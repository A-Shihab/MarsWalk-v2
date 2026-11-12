"""Build the browser layers from the USGS SIM 3464 release and the routing DEM."""

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image
from pyproj import CRS, Transformer
import rasterio
from affine import Affine
from rasterio.warp import Resampling, reproject
from shapely.geometry import Point, box, mapping, shape
from shapely.ops import transform
from scipy.ndimage import minimum_filter, sobel

ROOT = Path(__file__).resolve().parent
DEM = ROOT / "data/processed/jezero_dem_mars_projected.tif"
OUTPUT = ROOT.parent / "frontend/public/jezero-demo"
SLOPE_COLORS = [(0, 0, 0), (70, 171, 142), (234, 201, 85), (244, 142, 70), (238, 71, 84)]
DEMO_START = (3251, 2079)
DEMO_STOP = (3134, 2147)


def render_imagery(source, dem, destination, spacing, resampling):
    height = round(dem.height / spacing)
    width = round(dem.width / spacing)
    # Preserve the exact DEM footprint even when the output dimensions round.
    transform = dem.transform * Affine.scale(dem.width / width, dem.height / height)
    pixels = np.full((height, width), np.nan, dtype=np.float32)
    with rasterio.open(source) as image:
        reproject(
            rasterio.band(image, 1),
            pixels,
            src_nodata=0,  # Zero is blank in these release images.
            dst_nodata=np.nan,
            dst_transform=transform,
            dst_crs=dem.crs,
            resampling=resampling,
        )
        print(f"{source.name}: {image.res}, valid output {np.isfinite(pixels).mean():.2%}")
    if not np.isfinite(pixels).all():
        raise ValueError(f"Incomplete orbital image coverage: {source.name}")
    Image.fromarray(np.rint(pixels).astype(np.uint8)).save(destination)


def render_slope(dem):
    elevation = dem.read(1, masked=True).astype(np.float64)
    valid = ~np.ma.getmaskarray(elevation) & np.isfinite(elevation.filled(np.nan))
    # Match TerrainService's Sobel gradient and metre spacing. Mask the
    # one-cell halo around NoData so fill values cannot introduce false slopes.
    safe = elevation.filled(0)
    dy = sobel(safe, axis=0, mode="nearest") / (8 * dem.res[1])
    dx = sobel(safe, axis=1, mode="nearest") / (8 * dem.res[0])
    slope = np.degrees(np.arctan(np.hypot(dx, dy)))
    classes = np.digitize(slope, [5, 15, 25]).astype(np.uint8) + 1
    classes[~minimum_filter(valid, size=3, mode="constant", cval=False)] = 0
    for x, y in [DEMO_START, DEMO_STOP]:
        if not classes[y, x]:
            raise ValueError(f"Invalid slope coverage at {(x, y)}")
        print(f"DEM cell {(x, y)}: {slope[y, x]:.2f} degrees")
    overlay = Image.fromarray(classes).convert("P")
    overlay.putpalette([channel for color in SLOPE_COLORS for channel in color])
    overlay.save(OUTPUT / "slope.png", transparency=0, optimize=True, bits=4)


def render_geology(geojson, dem):
    # ArcGIS exports lon/lat. Interpret the angular values on the source
    # Mars sphere and use the DEM's own geodetic CRS, not a terrestrial datum.
    crs = CRS.from_user_input(dem.crs)
    to_projected = Transformer.from_crs(crs.geodetic_crs, crs, always_xy=True)
    to_geographic = Transformer.from_crs(crs, crs.geodetic_crs, always_xy=True)
    to_pixel = ~dem.transform
    window = box(*dem.bounds)
    start = Point(dem.xy(DEMO_START[1], DEMO_START[0]))
    stop = Point(dem.xy(DEMO_STOP[1], DEMO_STOP[0]))
    matches = [None, None]
    features = []
    for feature in json.loads(geojson.read_text(encoding="utf-8"))["features"]:
        props = feature["properties"]
        polygon = transform(to_projected.transform, shape(feature["geometry"]))
        clipped = polygon.intersection(window)
        if clipped.geom_type not in {"Polygon", "MultiPolygon"} or clipped.is_empty:
            continue
        for i, point in enumerate((start, stop)):
            if clipped.contains(point):
                matches[i] = (props["OBJECTID"], props["symbol"])
        pixel_polygon = transform(lambda x, y: to_pixel * (x, y), clipped)
        features.append({
            "id": props["OBJECTID"],
            "unit": props["symbol"],
            "geometry": mapping(pixel_polygon),
        })

    if matches != [(854, "Nnp1"), (597, "Aeb")]:
        raise ValueError(f"Unexpected mapped units at demo endpoints: {matches}")
    for point, match in zip((start, stop), matches):
        lon, lat = to_geographic.transform(point.x, point.y)
        print(f"{match}: {lat:.6f} N, {lon:.6f} E")
    (OUTPUT / "geology.json").write_text(json.dumps(features, separators=(",", ":")) + "\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("release", type=Path, help="Extracted sim3464_JezeroNili_FINAL directory")
    parser.add_argument("geology", type=Path, help="Geologic Units layer 8 GeoJSON query result")
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    rasters = args.release / "Rasters"
    with rasterio.open(DEM) as dem:
        render_imagery(
            rasters / "Caltech_CTX_mosaic_feb2018/Nili_CTX_Mosaic_Beta01_Feb2018_MTM.tif",
            dem, OUTPUT / "ctx.png", 5, Resampling.bilinear,
        )
        render_imagery(
            rasters / "USGS_THEMIS_IR_controlled_mosaic_oct2018/nili_THEMIS_NightIR_Controlled_oct2018.tif",
            dem, OUTPUT / "themis-night.png", 100, Resampling.nearest,
        )
        render_slope(dem)
        render_geology(args.geology, dem)


if __name__ == "__main__":
    main()
