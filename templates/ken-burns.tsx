import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface KenBurnsProps {
  imageUrl?: string;
  duration?: number;
  scale?: number;
  panX?: number;
  panY?: number;
}

export default function KenBurns({
  imageUrl = "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba",
  duration = 5,
  scale = 1.5,
  panX = -50,
  panY = -30,
}: KenBurnsProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const totalFrames = fps * duration;

  const animScale = interpolate(frame, [0, totalFrames], [1, scale], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const xPan = interpolate(frame, [0, totalFrames], [0, panX], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const yPan = interpolate(frame, [0, totalFrames], [0, panY], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
        overflow: "hidden",
      }}
    >
      <img
        src={imageUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${animScale}) translate(${xPan}px, ${yPan}px)`,
        }}
      />
    </div>
  );
}
