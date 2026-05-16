import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame, useVideoConfig, staticFile} from 'remotion';

const SEGMENT_SECONDS = 4;

const clamp01 = (value) => Math.min(Math.max(value, 0), 1);

const smoothStep = (value) => {
  const p = clamp01(value);
  return p * p * (3 - 2 * p);
};

const wrapIndex = (index, length) => ((index % length) + length) % length;

const getImageAt = (images, index) => images[wrapIndex(index, images.length)];

const renderLabel = (text) => (
  <div
    style={{
      position: 'absolute',
      bottom: '5%',
      left: '50%',
      transform: 'translateX(-50%)',
      color: '#fff',
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      textShadow: '0 2px 8px rgba(0,0,0,0.8)',
      zIndex: 10,
    }}
  >
    {text}
  </div>
);

const imageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  maxWidth: '100%',
  maxHeight: '100%',
};

const centeredPanelStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#000',
};

const AllTransitionsShowcase = ({images = []}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  if (!images || images.length < 5) {
    return (
      <AbsoluteFill style={{background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        Need at least 5 images
      </AbsoluteFill>
    );
  }

  const segmentFrames = SEGMENT_SECONDS * fps;
  const segmentIndex = Math.min(Math.floor(frame / segmentFrames), images.length - 1);
  const segmentStartFrame = segmentIndex * segmentFrames;
  const segmentProgress = clamp01((frame - segmentStartFrame) / segmentFrames);
  const p = smoothStep(segmentProgress);
  const transitionType = segmentIndex % 5;
  const imageA = getImageAt(images, segmentIndex);
  const imageB = getImageAt(images, segmentIndex + 1);
  const filmStripImages = [0, 1, 2, 3].map((offset) => getImageAt(images, segmentIndex + offset));

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {/* Transition 1: Ghost Cross-Dissolve */}
      {transitionType === 0 && (
        <>
          <div style={{position: 'absolute', inset: 0, opacity: 1 - p, ...centeredPanelStyle}}>
            <Img src={staticFile(imageA)} style={imageStyle} />
          </div>
          <div style={{position: 'absolute', inset: 0, opacity: p, ...centeredPanelStyle}}>
            <Img src={staticFile(imageB)} style={imageStyle} />
          </div>
          {renderLabel('1. Ghost Cross-Dissolve')}
        </>
      )}

      {/* Transition 2: Triple-Image Film Strip Scroll */}
      {transitionType === 1 && (
        <>
          <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: '#000'}}>
            {filmStripImages.map((img, i) => {
              const offsetY = i * 100 - p * 300;
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    transform: `translateY(${offsetY}%)`,
                    ...centeredPanelStyle,
                  }}
                >
                  <Img src={staticFile(img)} style={imageStyle} />
                </div>
              );
            })}
          </div>
          {renderLabel('2. Film Strip Scroll')}
        </>
      )}

      {/* Transition 3: Horizontal Split-Screen Slide - Smooth entry from film strip */}
      {transitionType === 2 && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '50%',
              overflow: 'hidden',
              background: '#000',
              ...centeredPanelStyle,
            }}
          >
            <Img src={staticFile(filmStripImages[3])} style={imageStyle} />
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '50%',
              overflow: 'hidden',
              background: '#000',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                transform: `translateX(${(1 - p) * 100}%)`,
                ...centeredPanelStyle,
              }}
            >
              <Img src={staticFile(imageB)} style={imageStyle} />
            </div>
          </div>

          {renderLabel('3. Split-Screen Slide')}
        </>
      )}

      {/* Transition 4: Circular Reveal */}
      {transitionType === 3 && (
        <>
          <div style={{position: 'absolute', inset: 0, background: '#000', ...centeredPanelStyle}}>
            <Img src={staticFile(imageA)} style={imageStyle} />
          </div>

          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: `${p * 320}%`,
                height: `${p * 320}%`,
                borderRadius: '50%',
                overflow: 'hidden',
                transform: 'translate(-50%, -50%)',
                position: 'absolute',
                top: '50%',
                left: '50%',
              }}
            >
              <div
                style={{
                  width: '100vw',
                  height: '100vh',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `translate(-50%, -50%)`,
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  ...centeredPanelStyle,
                }}
              >
                <Img src={staticFile(imageB)} style={imageStyle} />
              </div>
            </div>
          </div>

          {renderLabel('4. Circular Reveal')}
        </>
      )}

      {/* Transition 5: Hard Beat-Match Cut */}
      {transitionType === 4 && (
        <>
          <div style={{position: 'absolute', inset: 0, opacity: 1 - smoothStep((p - 0.45) / 0.1), ...centeredPanelStyle}}>
            <Img src={staticFile(imageA)} style={imageStyle} />
          </div>
          <div style={{position: 'absolute', inset: 0, opacity: smoothStep((p - 0.45) / 0.1), ...centeredPanelStyle}}>
            <Img src={staticFile(imageB)} style={imageStyle} />
          </div>
          {renderLabel('5. Beat-Match Cut')}
        </>
      )}

    </AbsoluteFill>
  );
};

export default AllTransitionsShowcase;
