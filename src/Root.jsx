import React from 'react';
import {Composition} from 'remotion';
import {SlideshowVideo} from './SlideshowVideo';
import AllTransitionsShowcase from './AllTransitionsShowcase';

const DEFAULT_SETTINGS = {
  fps: 30,
  width: 1080,
  height: 1920,
  stillSeconds: 2.7,
  transitionSeconds: 0.85,
};

const SHOWCASE_SEGMENT_SECONDS = 4;

const getDurationInFrames = (imageCount, settings) => {
  const still = Math.round(settings.stillSeconds * settings.fps);
  const transition = Math.round(settings.transitionSeconds * settings.fps);

  if (imageCount <= 1) {
    return Math.max(still, settings.fps * 2);
  }

  return imageCount * still + (imageCount - 1) * transition;
};

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="Slideshow"
        component={SlideshowVideo}
        width={DEFAULT_SETTINGS.width}
        height={DEFAULT_SETTINGS.height}
        fps={DEFAULT_SETTINGS.fps}
        durationInFrames={DEFAULT_SETTINGS.fps * 10}
        defaultProps={{
          images: [],
          settings: DEFAULT_SETTINGS,
        }}
        calculateMetadata={({props}) => {
          const mergedSettings = {...DEFAULT_SETTINGS, ...(props.settings ?? {})};
          return {
            fps: mergedSettings.fps,
            width: mergedSettings.width,
            height: mergedSettings.height,
            durationInFrames: getDurationInFrames(props.images?.length ?? 0, mergedSettings),
          };
        }}
      />
      <Composition
        id="AllTransitions"
        component={AllTransitionsShowcase}
        width={DEFAULT_SETTINGS.width}
        height={DEFAULT_SETTINGS.height}
        fps={DEFAULT_SETTINGS.fps}
        defaultProps={{
          images: [],
        }}
        calculateMetadata={({props}) => {
          const mergedSettings = {...DEFAULT_SETTINGS, ...(props.settings ?? {})};
          const imageCount = props.images?.length ?? 0;

          return {
            fps: mergedSettings.fps,
            width: mergedSettings.width,
            height: mergedSettings.height,
            durationInFrames: Math.max(imageCount, 5) * SHOWCASE_SEGMENT_SECONDS * mergedSettings.fps,
          };
        }}
      />
    </>
  );
};
