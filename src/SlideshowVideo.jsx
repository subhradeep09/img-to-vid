import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

const TRANSITIONS = [
  'cinematic-fade',
  'soft-pan',
  'slide-diagonal',
  'blur-reveal',
  'glass-swipe',
  'luma-fade',
  'cross-dissolve',
  'morph-transition',
  'fade-through-black',
];

const getScene = (frame, imageCount, stillFrames, transitionFrames) => {
  if (imageCount === 0) {
    return {kind: 'empty'};
  }

  if (imageCount === 1) {
    return {kind: 'static', index: 0, localFrame: frame};
  }

  const segmentFrames = stillFrames + transitionFrames;
  const segmentIndex = Math.floor(frame / segmentFrames);

  if (segmentIndex >= imageCount - 1) {
    const lastStart = (imageCount - 1) * segmentFrames;
    return {kind: 'static', index: imageCount - 1, localFrame: Math.max(0, frame - lastStart)};
  }

  const local = frame % segmentFrames;

  if (local < stillFrames) {
    return {kind: 'static', index: segmentIndex, localFrame: local};
  }

  return {
    kind: 'transition',
    fromIndex: segmentIndex,
    toIndex: segmentIndex + 1,
    localFrame: local - stillFrames,
    transitionIndex: segmentIndex,
  };
};

const getStillStyle = () => {
  return {
    transform: 'none',
    opacity: 1,
    filter: 'brightness(1.01) saturate(1.02) contrast(1.01)',
  };
};

const getTransitionStyles = (transition, progress) => {
  const p = Math.min(Math.max(progress, 0), 1);
  const eased = p * p * (3 - 2 * p);

  switch (transition) {
    case 'cinematic-fade':
    case 'soft-pan':
    case 'slide-diagonal':
    case 'blur-reveal':
    case 'glass-swipe':
    case 'luma-fade':
    case 'cross-dissolve':
    case 'morph-transition':
    case 'fade-through-black':
    default:
      return {
        outgoing: {
          opacity: 1,
          transform: `translateY(${eased * 100}%)`,
        },
        incoming: {
          opacity: 1,
          transform: `translateY(${(eased - 1) * 100}%)`,
        },
      };
  }
};

const FrameImage = ({src, style}) => {
  return (
    <Img
      src={staticFile(src)}
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        transformOrigin: 'center center',
        ...style,
      }}
    />
  );
};

const FrameShell = ({children}) => {
  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        background:
          'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 35%), radial-gradient(circle at 80% 80%, rgba(120,160,255,0.12), transparent 30%), linear-gradient(135deg, #04060a, #111826 58%, #04060a)',
      }}
    >
      <AbsoluteFill
        style={{
          inset: '6%',
          borderRadius: 34,
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.55)',
          backgroundColor: 'rgba(255,255,255,0.02)',
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ImageStage = ({src, style, overlayOpacity = 0.22}) => {
  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <FrameImage
        src={src}
        style={{
          objectFit: 'cover',
          filter: 'blur(28px) saturate(1.1) brightness(0.75)',
          transform: 'scale(1.08)',
          opacity: overlayOpacity,
        }}
      />
      <FrameImage src={src} style={style} />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.05), transparent 18%, transparent 82%, rgba(0,0,0,0.24)), radial-gradient(circle at center, transparent 55%, rgba(0,0,0,0.22) 100%)',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

export const SlideshowVideo = ({images = [], settings = {}}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  
  const finalFps = settings?.fps ?? fps ?? 30;
  const stillFrames = Math.max(1, Math.round((settings?.stillSeconds ?? 2.7) * finalFps));
  const transitionFrames = Math.max(1, Math.round((settings?.transitionSeconds ?? 0.85) * finalFps));

  const scene = getScene(frame, images.length, stillFrames, transitionFrames);

  if (scene.kind === 'empty') {
    return (
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle at 20% 20%, #2d2d2d, #0b0b0b)',
          color: '#f2f2f2',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: 56,
        }}
      >
        No images found in /img
      </AbsoluteFill>
    );
  }

  if (scene.kind === 'static') {
    return (
      <FrameShell>
        <ImageStage
          src={images[scene.index]}
          style={getStillStyle(scene.index, scene.localFrame, stillFrames)}
        />
      </FrameShell>
    );
  }

  const transitionType = TRANSITIONS[scene.transitionIndex % TRANSITIONS.length];
  const progress = scene.localFrame / transitionFrames;
  const {incoming, outgoing} = getTransitionStyles(transitionType, progress);

  return (
    <FrameShell>
      <ImageStage src={images[scene.fromIndex]} style={outgoing} overlayOpacity={0.18} />
      <ImageStage src={images[scene.toIndex]} style={incoming} overlayOpacity={0.28} />
    </FrameShell>
  );
};

export default SlideshowVideo;
