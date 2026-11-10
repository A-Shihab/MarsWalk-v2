
import { useMemo } from "react";
import {
  MapContainer,
  ImageOverlay,
  Marker,
  Polyline,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --------------------------------------------------
// MAP CONFIGURATION
// --------------------------------------------------

const MAP_WIDTH = 3900;
const MAP_HEIGHT = 4103;

const IMAGE_BOUNDS = [
  [0, 0],
  [MAP_HEIGHT, MAP_WIDTH],
];

// --------------------------------------------------
// CUSTOM MARKERS
// --------------------------------------------------

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

// --------------------------------------------------
// VALIDATE PIXEL COORDINATES
// --------------------------------------------------

function isValidPixel(point) {
  if (!point) return false;

  const x = Number(point.x);
  const y = Number(point.y);

  return (
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= 0 &&
    x <= MAP_WIDTH &&
    y >= 0 &&
    y <= MAP_HEIGHT
  );
}

// --------------------------------------------------
// MAP CLICK HANDLER
// --------------------------------------------------

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(event) {
      if (!onMapClick) return;

      const pixel_x = Math.round(event.latlng.lng);

      const pixel_y = Math.round(
        MAP_HEIGHT - event.latlng.lat
      );

      if (
        !Number.isFinite(pixel_x) ||
        !Number.isFinite(pixel_y) ||
        pixel_x < 0 ||
        pixel_x > MAP_WIDTH ||
        pixel_y < 0 ||
        pixel_y > MAP_HEIGHT
      ) {
        return;
      }

      // IMPORTANT:
      // useMarsMap.js expects pixel_x and pixel_y.

      onMapClick({
        pixel_x,
        pixel_y,
      });
    },
  });

  return null;
}

// --------------------------------------------------
// MAIN MARS MAP COMPONENT
// --------------------------------------------------

export default function MarsMap({
  startPoint,
  destinationPoint,
  routePoints = [],
  onMapClick,
  onClearStartPoint,
  onClearDestinationPoint,
  className = "h-[500px] w-full",
}) {

  // ------------------------------------------------
  // CONVERT PIXELS TO LEAFLET POSITIONS
  // ------------------------------------------------

  const convertPixel = (point) => {
    if (!isValidPixel(point)) {
      return null;
    }

    return [
      MAP_HEIGHT - Number(point.y),
      Number(point.x),
    ];
  };

  // ------------------------------------------------
  // ROUTE LINE
  // ------------------------------------------------

  const routePositions = useMemo(() => {
    return routePoints
      .map(convertPixel)
      .filter(Boolean);
  }, [routePoints]);

  const startPosition = convertPixel(startPoint);

  const destinationPosition = convertPixel(
    destinationPoint
  );

  // ------------------------------------------------
  // RENDER MAP
  // ------------------------------------------------

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

        {/* JEZERO CRATER ORTHOMOSAIC */}

        <ImageOverlay
          url="/jesero_ortho.png"
          bounds={IMAGE_BOUNDS}
        />

        {/* MAP CLICK HANDLER */}

        <MapClickHandler
          onMapClick={onMapClick}
        />

        {/* START MARKER */}

        {startPosition && (
          <Marker
            position={startPosition}
            icon={startIcon}
            eventHandlers={{
              contextmenu: () =>
                onClearStartPoint?.(),
            }}
          />
        )}

        {/* DESTINATION MARKER */}

        {destinationPosition && (
          <Marker
            position={destinationPosition}
            icon={destinationIcon}
            eventHandlers={{
              contextmenu: () =>
                onClearDestinationPoint?.(),
            }}
          />
        )}

        {/* OUTBOUND AND RETURN ROUTES */}

        {routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: "#22c55e",
              weight: 4,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}

      </MapContainer>

    </div>
  );
}
