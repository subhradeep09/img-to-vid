import { random, useCurrentFrame, useVideoConfig, useMemo } from "remotion";

export default function PixelTransition() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Pixel size
  const pixelSize = 20;

  // Calculate grid dimensions
  const cols = Math.ceil(width / pixelSize);
  const rows = Math.ceil(height / pixelSize);

  // Memoize pixel grid generation - only calculate once
  const pixels = useMemo(() => {
    const pixelArray = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const seed = x * 1000 + y;
        const delay = Math.floor(random(seed) * 60);
        const hue = Math.floor(random(seed * 2) * 220) + 200;
        const saturation = 70 + Math.floor(random(seed * 3) * 30);
        const lightness = 40 + Math.floor(random(seed * 4) * 20);

        pixelArray.push({
          x: x * pixelSize,
          y: y * pixelSize,
          delay,
          color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        });
      }
    }
    return pixelArray;
  }, [cols, rows, pixelSize]);

  return (
    <div
      style={{
        width,
        height,
        background: "#0f172a",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {pixels.map((pixel, i) =>
        frame > pixel.delay ? (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pixel.x,
              top: pixel.y,
              width: pixelSize,
              height: pixelSize,
              backgroundColor: pixel.color,
            }}
          />
        ) : null
      )}
    </div>
  );
}
