import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface HexagonWipeProps {
  imageUrl1?: string;
  imageUrl2?: string;
  duration?: number;
}

export default function HexagonWipe({
  imageUrl1 = "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=1200&h=800&fit=crop",
  imageUrl2 = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop",
  duration = 3,
}: HexagonWipeProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const totalFrames = fps * duration;
  const progress = interpolate(frame, [0, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rotation = progress * 360;
  const scale = 1 + progress * 0.3;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#000",
      }}
    >
      {/* First Image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 1 - progress,
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

      {/* Second Image with Hexagon Clip Path */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: progress,
          clipPath: `polygon(
            ${50 + 40 * Math.cos((rotation + 0) * (Math.PI / 180))}% ${50 + 40 * Math.sin((rotation + 0) * (Math.PI / 180))}%,
            ${50 + 40 * Math.cos((rotation + 60) * (Math.PI / 180))}% ${50 + 40 * Math.sin((rotation + 60) * (Math.PI / 180))}%,
            ${50 + 40 * Math.cos((rotation + 120) * (Math.PI / 180))}% ${50 + 40 * Math.sin((rotation + 120) * (Math.PI / 180))}%,
            ${50 + 40 * Math.cos((rotation + 180) * (Math.PI / 180))}% ${50 + 40 * Math.sin((rotation + 180) * (Math.PI / 180))}%,
            ${50 + 40 * Math.cos((rotation + 240) * (Math.PI / 180))}% ${50 + 40 * Math.sin((rotation + 240) * (Math.PI / 180))}%,
            ${50 + 40 * Math.cos((rotation + 300) * (Math.PI / 180))}% ${50 + 40 * Math.sin((rotation + 300) * (Math.PI / 180))}%
          )`,
          transform: `scale(${scale})`,
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
  );
}
