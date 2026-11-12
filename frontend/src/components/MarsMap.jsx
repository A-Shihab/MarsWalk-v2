
import { useEffect, useMemo, useRef, useState } from "react";

import {
  MapContainer,
  ImageOverlay,
  Marker,
  Polyline,
  Polygon,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MAP_WIDTH = 3900;
const MAP_HEIGHT = 4103;

const IMAGE_BOUNDS = [
  [0, 0],
  [MAP_HEIGHT, MAP_WIDTH],
];

const ZOOM_LEVELS = [
  { label: "Overview", zoom: -1 },
  { label: "Detail", zoom: 1 },
  { label: "Close", zoom: 3 },
];

const createMarkerIcon = (color) =>
  L.divIcon({
    className: "mars-map-marker",
    html: `
      <div style="
        width: 18px;
        height: 18px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 12px ${color};
      "></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

const startIcon = createMarkerIcon("#22c55e");
const destinationIcon = createMarkerIcon("#ef4444");

function isValidPixel(point) {
  if (!point) return false;

  const x = Number(point.x);
  const y = Number(point.y);

  return (
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= 0 &&
    x < MAP_WIDTH &&
    y >= 0 &&
    y < MAP_HEIGHT
  );
}

function convertPixel(point) {
  if (!isValidPixel(point)) return null;

  return [
    MAP_HEIGHT - Number(point.y) - 0.5,
    Number(point.x) + 0.5,
  ];
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(event) {
      if (!onMapClick) return;

      const pixel_x = Math.floor(event.latlng.lng);
      const pixel_y = Math.floor(
        MAP_HEIGHT - event.latlng.lat
      );

      if (
        !Number.isFinite(pixel_x) ||
        !Number.isFinite(pixel_y) ||
        pixel_x < 0 ||
        pixel_x >= MAP_WIDTH ||
        pixel_y < 0 ||
        pixel_y >= MAP_HEIGHT
      ) {
        return;
      }

      onMapClick({ pixel_x, pixel_y });
    },
  });

  return null;
}

function MapScale() {
  const map = useMap();
  useEffect(() => {
    // One CRS.Simple map unit is one projected metre.
    const control = L.control.scale({ imperial: false, position: "bottomleft" });
    control.addTo(map);
    return () => control.remove();
  }, [map]);
  return null;
}

function FocusRoute({ start, destination }) {
  const map = useMap();
  useEffect(() => {
    if (start && destination) {
      map.fitBounds([convertPixel(start), convertPixel(destination)], {
        padding: [100, 75],
        maxZoom: 3,
      });
    }
  }, [map, start, destination]);
  return null;
}

function RouteLine({ route }) {
  const line = useRef(null);
  useEffect(() => {
    if (route.selected) line.current?.bringToFront();
  }, [route.selected]);
  return (
    <Polyline
      ref={line}
      positions={route.positions}
      pathOptions={{
        color: route.color || "#22c55e",
        weight: route.weight ?? (route.selected ? 6 : 4),
        opacity: route.selected ? 1 : 0.75,
        dashArray: route.dashArray,
        lineCap: "round",
        lineJoin: "round",
      }}
    />
  );
}

function MapZoomControls() {
  const map = useMap();
  const [activeZoom, setActiveZoom] = useState(map.getZoom());
  const controls = useRef(null);
  useEffect(() => {
    L.DomEvent.disableClickPropagation(controls.current);
  }, []);

  useMapEvents({ zoomend: () => setActiveZoom(map.getZoom()) });
  const applyZoom = (zoom) => {
    const safeZoom = Math.min(
      map.getMaxZoom(),
      Math.max(map.getMinZoom(), zoom)
    );

    // Keep the current map centre and change only the zoom.
    map.setZoom(safeZoom);
    setActiveZoom(safeZoom);
  };

  return (
    <div ref={controls} className="absolute right-3 top-3 z-[1000] flex flex-col gap-2 rounded-xl border border-white/10 bg-slate-950/95 p-2 shadow-xl">
      <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Map Zoom
      </p>

      {ZOOM_LEVELS.map((level) => {
        const selected = activeZoom === level.zoom;

        return (
          <button
            key={level.label}
            type="button"
            onClick={() => applyZoom(level.zoom)}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              selected
                ? "bg-orange-500 text-white"
                : "border border-white/10 bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            {level.label}
          </button>
        );
      })}

    </div>
  );
}

export default function MarsMap({
  startPoint,
  destinationPoint,
  routePoints = [],
  routes = [],
  onMapClick,
  onClearStartPoint,
  onClearDestinationPoint,
  className = "h-[500px] w-full",
  focusRoute = false,
  basemap = "ctx",
  slope = false,
  geology = [],
  startLabel,
  destinationLabel,
}) {
  // Backwards compatibility:
  // If no multiple routes are supplied, display routePoints.
  const displayedRoutes = useMemo(() => {
    if (routes.length > 0) {
      return routes;
    }

    if (routePoints.length > 1) {
      return [
        {
          id: "active-route",
          points: routePoints,
          color: "#22c55e",
          selected: true,
        },
      ];
    }

    return [];
  }, [routes, routePoints]);

  const preparedRoutes = useMemo(() => {
    return displayedRoutes
      .map((route, index) => ({
        ...route,
        id: route.id || `route-${index}`,
        positions: (route.points || [])
          .map(convertPixel)
          .filter(Boolean),
      }))
      .filter((route) => route.positions.length > 1)
      // Draw the selected route last so it appears on top.
      .sort(
        (a, b) =>
          Number(Boolean(a.selected)) -
          Number(Boolean(b.selected))
      );
  }, [displayedRoutes]);

  const startPosition = convertPixel(startPoint);
  const destinationPosition = convertPixel(destinationPoint);

  return (
    <div className={className}>
      <MapContainer
        crs={L.CRS.Simple}
        bounds={IMAGE_BOUNDS}
        minZoom={-3}
        maxZoom={3}
        zoom={-1}
        scrollWheelZoom={true}
        style={{
          width: "100%",
          height: "100%",
          background: "#0f172a",
        }}
      >
        <ImageOverlay
          url={`/jezero-demo/${basemap}.png`}
          attribution={'<a href="https://doi.org/10.3133/sim3464">USGS SIM 3464</a>'}
          bounds={IMAGE_BOUNDS}
        />

        {slope && <ImageOverlay url="/jezero-demo/slope.png" bounds={IMAGE_BOUNDS} opacity={0.36} />}
        {[...geology].sort((a, b) => Number(a.unit === "Aeb") - Number(b.unit === "Aeb")).map(({ id, unit, geometry }) => {
          const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
          const color = unit === "Aeb" ? "#67e8f9" : unit === "Nnp1" ? "#c4b5fd" : "#f8fafc";
          return (
            <Polygon
              key={id}
              positions={polygons.map(polygon => polygon.map(ring => ring.map(
                ([x, y]) => [MAP_HEIGHT - y, x]
              )))}
              pathOptions={{ color, weight: 2, fillOpacity: 0.10, dashArray: "5 4" }}
            >
              <Tooltip sticky>{unit} · SIM 3464 feature {id}</Tooltip>
            </Polygon>
          );
        })}
        {focusRoute && <FocusRoute start={startPoint} destination={destinationPoint} />}
        <MapScale />
        <MapClickHandler onMapClick={onMapClick} />

        <MapZoomControls />

        {preparedRoutes.map((route) => (
          <RouteLine key={route.id} route={route} />
        ))}

        {startPosition && (
          <Marker
            position={startPosition}
            icon={startIcon}
            eventHandlers={{
              contextmenu: () => onClearStartPoint?.(),
            }}
          >
            {startLabel && <Tooltip permanent direction="top" offset={[0, -11]}>{startLabel}</Tooltip>}
          </Marker>
        )}

        {destinationPosition && (
          <Marker
            position={destinationPosition}
            icon={destinationIcon}
            eventHandlers={{
              contextmenu: () => onClearDestinationPoint?.(),
            }}
          >
            {destinationLabel && <Tooltip permanent direction="top" offset={[0, -11]}>{destinationLabel}</Tooltip>}
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
