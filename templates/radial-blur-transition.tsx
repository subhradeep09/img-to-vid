import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface RadialBlurTransitionProps {
  imageUrl1?: string;
  imageUrl2?: string;
  duration?: number;
}

export default function RadialBlurTransition({
  imageUrl1 = "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=1200&h=800&fit=crop",
  imageUrl2 = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop",
  duration = 2.5,
}: RadialBlurTransitionProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const totalFrames = fps * duration;
  const progress = interpolate(frame, [0, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Create vortex effect with easing
  const eased = progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

  const rotation = progress * 1080; // 3 full rotations
  const blur = Math.abs(Math.sin(progress * Math.PI)) * 40;
  const zoom = 1 + eased * 0.4;
  const centerX = 50 + Math.sin(progress * Math.PI * 2) * 10;
  const centerY = 50 + Math.cos(progress * Math.PI * 2) * 10;

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
      {/* First Image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 1 - eased,
          transform: `
            rotate(${-rotation}deg)
            scale(${1 + (1 - eased) * 0.5})
          `,
          filter: `blur(${blur}px)`,
          transformOrigin: `${centerX}% ${centerY}%`,
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

      {/* Second Image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: eased,
          transform: `
            rotate(${rotation}deg)
            scale(${1 - (1 - eased) * 0.5})
          `,
          filter: `blur(${blur}px)`,
          transformOrigin: `${centerX}% ${centerY}%`,
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

      {/* Vortex Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(
              circle at ${centerX}% ${centerY}%,
              transparent 0%,
              transparent ${Math.max(0, 30 - progress * 60)}%,
              rgba(0, 0, 0, ${eased * 0.5}) 100%
            )
          `,
          pointerEvents: "none",
          mixBlendMode: "multiply",
        }}
      />

      {/* Glow Effect */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(
              circle at ${centerX}% ${centerY}%,
              rgba(100, 200, 255, ${eased * 0.4}),
              transparent 50%
            )
          `,
          pointerEvents: "none",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
