import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface PrismRefractProps {
  imageUrl1?: string;
  imageUrl2?: string;
  duration?: number;
  prisms?: number;
}

export default function PrismRefract({
  imageUrl1 = "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=1200&h=800&fit=crop",
  imageUrl2 = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop",
  duration = 3,
  prisms = 5,
}: PrismRefractProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const totalFrames = fps * duration;
  const progress = interpolate(frame, [0, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const eased = progress < 0.5
    ? 2 * progress * progress
    : -1 + (4 - 2 * progress) * progress;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#1a1a1a",
        display: "flex",
      }}
    >
      {Array.from({ length: prisms }).map((_, i) => {
        const delay = i * 0.1;
        const localProgress = Math.max(0, Math.min(1, progress - delay));
        
        const xOffset = (localProgress - 0.5) * 200;
        const yOffset = Math.sin(localProgress * Math.PI) * 100;
        const skew = localProgress * 15;
        const hueShift = localProgress * 60;

        return (
          <div
            key={i}
            style={{
              flex: 1,
              position: "relative",
              overflow: "hidden",
              transform: `skewX(${skew}deg)`,
            }}
          >
            {/* First image */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: 1 - localProgress,
                filter: `
                  hue-rotate(${-hueShift}deg)
                  saturate(${1 + localProgress * 0.3})
                `,
                transform: `translateX(${xOffset * -1}px) translateY(${yOffset * -1}px)`,
              }}
            >
              <img
                src={imageUrl1}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>

            {/* Second image */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: localProgress,
                filter: `
                  hue-rotate(${hueShift}deg)
                  saturate(${0.7 + localProgress * 0.3})
                `,
                transform: `translateX(${xOffset}px) translateY(${yOffset}px)`,
              }}
            >
              <img
                src={imageUrl2}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>

            {/* Prism light effect */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(
                  ${45 + localProgress * 90}deg,
                  rgba(255, 255, 255, ${localProgress * 0.4}),
                  transparent 50%
                )`,
                pointerEvents: "none",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
