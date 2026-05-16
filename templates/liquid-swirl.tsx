import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface LiquidSwirlProps {
  imageUrl1?: string;
  imageUrl2?: string;
  duration?: number;
}

export default function LiquidSwirl({
  imageUrl1 = "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=1200&h=800&fit=crop",
  imageUrl2 = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop",
  duration = 3.5,
}: LiquidSwirlProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const totalFrames = fps * duration;
  const progress = interpolate(frame, [0, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Smooth easing
  const eased = progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

  const rotation = progress * 720;
  const swirl = Math.sin(progress * Math.PI * 2) * 30;
  const wave = Math.sin(frame * 0.05) * 5;

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
      {/* First Image - Swirling Out */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 1 - eased,
          filter: `blur(${eased * 10}px)`,
          transform: `
            scale(${1 + eased * 0.3})
            rotate(${rotation}deg)
            translateX(${swirl}px)
            translateY(${wave}px)
          `,
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

      {/* Second Image - Swirling In */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: eased,
          filter: `blur(${(1 - eased) * 10}px)`,
          transform: `
            scale(${1 - eased * 0.3})
            rotate(${-rotation}deg)
            translateX(${-swirl}px)
            translateY(${-wave}px)
          `,
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

      {/* Liquid Overlay Gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(
            circle at ${50 + Math.sin(progress * Math.PI) * 20}% ${50 + Math.cos(progress * Math.PI) * 20}%,
            rgba(100, 200, 255, ${eased * 0.3}),
            transparent 60%
          )`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
