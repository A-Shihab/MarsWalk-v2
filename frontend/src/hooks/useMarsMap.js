
import { useCallback, useState } from "react";

const RASTER_WIDTH = 3900;
const RASTER_HEIGHT = 4103;

function useMarsMap() {
  const [startPoint, setStartPoint] = useState(null);
  const [destinationPoint, setDestinationPoint] = useState(null);
  const [selectionMode, setSelectionMode] = useState("start");

  const handleMapClick = useCallback(
    ({ pixel_x, pixel_y }) => {
      if (
        !Number.isFinite(pixel_x) ||
        !Number.isFinite(pixel_y) ||
        pixel_x < 0 ||
        pixel_x >= RASTER_WIDTH ||
        pixel_y < 0 ||
        pixel_y >= RASTER_HEIGHT
      ) {
        return;
      }

      const point = {
        x: Math.round(pixel_x),
        y: Math.round(pixel_y),
      };

      if (selectionMode === "start") {
        setStartPoint(point);
        setSelectionMode("destination");
      } else {
        setDestinationPoint(point);
        setSelectionMode("start");
      }
    },
    [selectionMode]
  );

  const clearStartPoint = useCallback(() => {
    setStartPoint(null);
    setSelectionMode("start");
  }, []);

  const clearDestinationPoint = useCallback(() => {
    setDestinationPoint(null);
    setSelectionMode("destination");
  }, []);

  const resetPoints = useCallback(() => {
    setStartPoint(null);
    setDestinationPoint(null);
    setSelectionMode("start");
  }, []);

  const selectStartPoint = useCallback((point) => {
    setStartPoint(point);
  }, []);

  const selectDestinationPoint = useCallback((point) => {
    setDestinationPoint(point);
  }, []);

  return {
    startPoint,
    destinationPoint,
    selectionMode,
    handleMapClick,
    clearStartPoint,
    clearDestinationPoint,
    resetPoints,
    selectStartPoint,
    selectDestinationPoint,
    setSelectionMode,
    hasBothPoints: Boolean(startPoint && destinationPoint),
  };
}

export default useMarsMap;
