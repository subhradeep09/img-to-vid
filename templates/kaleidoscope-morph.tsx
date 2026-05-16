import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface KaleidoscopeMorphProps {
  imageUrl1?: string;
  imageUrl2?: string;
  duration?: number;
  segments?: number;
}

export default function KaleidoscopeMorph({
  imageUrl1 = "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=1200&h=800&fit=crop",
  imageUrl2 = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop",
  duration = 3,
  segments = 6,
}: KaleidoscopeMorphProps) {
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

  const rotation = progress * 360;
  const scale = 1 + eased * 0.5;
  const blur = interpolate(progress, [0, 0.5, 1], [0, 15, 0]);

  const segmentAngle = 360 / segments;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#000",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: "50%",
            height: "50%",
            transformOrigin: "center",
            transform: `rotate(${i * segmentAngle}deg)`,
            overflow: "hidden",
          }}
        >
          {/* First image */}
          <div
            style={{
              position: "absolute",
              width: "200%",
              height: "200%",
              opacity: 1 - progress,
              filter: `blur(${blur}px)`,
              transformOrigin: "center",
              transform: `scale(${1 + progress * 0.2})`,
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
              width: "200%",
              height: "200%",
              opacity: progress,
              filter: `blur(${blur}px)`,
              transformOrigin: "center",
              transform: `scale(${1 + (1 - progress) * 0.2}) rotate(${rotation}deg)`,
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
        </div>
      ))}
    </div>
  );
}
