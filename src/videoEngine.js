import ffmpegCoreURL from '@ffmpeg/core?url';
import ffmpegWasmURL from '@ffmpeg/core/wasm?url';

export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;
const SEGMENT_SECONDS = 4;
const HOLD_SECONDS = 1.5;
export const MUSIC_PATH = new URL(
  '../music/Energetic Rock (30 sec) - Royalty-Free Background Music _ Cinematic.mp3',
  import.meta.url,
).href;

const TRANSITIONS = ['cross-dissolve', 'film-strip', 'split-screen', 'circular-reveal', 'beat-cut'];

const clamp01 = (value) => Math.min(Math.max(value, 0), 1);
const smoothstep = (value) => {
  const p = clamp01(value);
  return p * p * (3 - 2 * p);
};

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

const pickMimeType = () => {
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return candidates.find((candidate) => window.MediaRecorder?.isTypeSupported(candidate)) || '';
};

const createLoopingMusicStream = async (musicUrl) => {
  const audioContext = new AudioContext();
  await audioContext.resume();

  const audioElement = new Audio(musicUrl);
  audioElement.crossOrigin = 'anonymous';
  audioElement.loop = true;
  audioElement.preload = 'auto';

  const source = audioContext.createMediaElementSource(audioElement);
  const destination = audioContext.createMediaStreamDestination();
  source.connect(destination);
  source.connect(audioContext.destination);

  await audioElement.play();

  return {
    stream: destination.stream,
    stop: async () => {
      audioElement.pause();
      audioElement.src = '';
      await audioContext.close();
    },
  };
};

const loadSingleImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    image.src = url;
  });

export const preloadImages = async (urls) => {
  const results = await Promise.allSettled(urls.map((url) => loadSingleImage(url)));
  const images = [];
  const errors = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      images.push({url: urls[index], image: result.value});
    } else {
      errors.push({url: urls[index], error: result.reason?.message || 'Could not load image'});
    }
  });

  return {images, errors};
};

const drawContain = (ctx, image, width, height) => {
  const scale = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;
  ctx.drawImage(image, x, y, drawWidth, drawHeight);
};

const drawBackground = (ctx, width, height, progress) => {
  const hue = Math.round(210 + progress * 30);
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, `hsl(${hue}, 42%, 9%)`);
  gradient.addColorStop(0.55, '#111827');
  gradient.addColorStop(1, '#05070c');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
};

const drawCrossDissolve = (ctx, current, next, progress, width, height) => {
  drawBackground(ctx, width, height, progress);
  ctx.save();
  ctx.globalAlpha = 1 - progress;
  drawContain(ctx, current, width, height);
  ctx.globalAlpha = progress;
  drawContain(ctx, next, width, height);
  ctx.restore();
};

const drawFilmStrip = (ctx, images, progress, width, height) => {
  drawBackground(ctx, width, height, progress);
  const local = smoothstep(progress);
  const visibleCount = Math.min(4, images.length);
  const itemHeight = height * 0.72;
  const gap = height * 0.01;
  const stride = itemHeight + gap;
  const scrollDistance = stride * Math.max(0, visibleCount - 1);
  const startY = (height - itemHeight) / 2;

  for (let i = 0; i < visibleCount; i += 1) {
    const image = images[i];
    if (!image) continue;
    const y = startY + i * stride - local * scrollDistance;
    ctx.save();
    ctx.translate(0, y);
    drawContain(ctx, image, width, itemHeight);
    ctx.restore();
  }
};

const drawSplitScreen = (ctx, current, next, progress, width, height) => {
  drawBackground(ctx, width, height, progress);
  const local = smoothstep(progress);
  const half = height / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, half);
  ctx.clip();
  ctx.translate(0, 0);
  drawContain(ctx, current, width, half);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, half, width, half);
  ctx.clip();
  ctx.translate(width * (1 - local), half);
  drawContain(ctx, next, width, half);
  ctx.restore();
};

const drawCircularReveal = (ctx, current, next, progress, width, height) => {
  drawBackground(ctx, width, height, progress);
  drawContain(ctx, current, width, height);

  const eased = smoothstep(progress);
  const radius = Math.sqrt(width * width + height * height) * eased;

  ctx.save();
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
  ctx.clip();
  drawContain(ctx, next, width, height);
  ctx.restore();
};

const drawBeatCut = (ctx, current, next, progress, width, height) => {
  drawBackground(ctx, width, height, progress);
  const cut = progress < 0.5 ? current : next;
  drawContain(ctx, cut, width, height);
};

export const drawFrame = (ctx, images, frameIndex, options = {}) => {
  const width = options.width ?? WIDTH;
  const height = options.height ?? HEIGHT;
  const fps = options.fps ?? FPS;
  const segmentSeconds = options.segmentSeconds ?? SEGMENT_SECONDS;
  const holdSeconds = options.holdSeconds ?? HOLD_SECONDS;
  const segmentFrames = Math.max(1, Math.round(segmentSeconds * fps));
  const holdFrames = Math.max(1, Math.round(holdSeconds * fps));
  const totalSegments = Math.max(1, images.length - 1);
  const totalFrames = totalSegments * segmentFrames + holdFrames;
  const clampedFrame = Math.min(frameIndex, totalFrames - 1);
  const segmentIndex = Math.min(Math.floor(clampedFrame / segmentFrames), totalSegments - 1);
  const localFrame = clampedFrame - segmentIndex * segmentFrames;
  const progress = clamp01(localFrame / segmentFrames);
  const transitionType = TRANSITIONS[segmentIndex % TRANSITIONS.length];

  const currentIndex = Math.min(segmentIndex, images.length - 1);
  const nextIndex = Math.min(segmentIndex + 1, images.length - 1);
  const current = images[currentIndex]?.image;
  const next = images[nextIndex]?.image ?? current;

  if (!current) return;

  ctx.clearRect(0, 0, width, height);

  switch (transitionType) {
    case 'film-strip':
      drawFilmStrip(ctx, images.slice(currentIndex, currentIndex + 4).map((entry) => entry.image), progress, width, height);
      break;
    case 'split-screen':
      drawSplitScreen(ctx, current, next, progress, width, height);
      break;
    case 'circular-reveal':
      drawCircularReveal(ctx, current, next, progress, width, height);
      break;
    case 'beat-cut':
      drawBeatCut(ctx, current, next, progress, width, height);
      break;
    case 'cross-dissolve':
    default:
      drawCrossDissolve(ctx, current, next, progress, width, height);
      break;
  }

};

export const getVideoDurationFrames = (imageCount, fps = FPS, segmentSeconds = SEGMENT_SECONDS, holdSeconds = HOLD_SECONDS) => {
  const totalSegments = Math.max(1, imageCount - 1);
  return totalSegments * Math.round(segmentSeconds * fps) + Math.round(holdSeconds * fps);
};

const transcodeToMp4 = async (webmBlob) => {
  const {FFmpeg} = await import('@ffmpeg/ffmpeg');
  const {fetchFile} = await import('@ffmpeg/util');
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: ffmpegCoreURL,
    wasmURL: ffmpegWasmURL,
  });

  await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob));
  await ffmpeg.exec(['-i', 'input.webm', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', 'faststart', 'output.mp4']);
  const output = await ffmpeg.readFile('output.mp4');
  return new Blob([output], {type: 'video/mp4'});
};

export const exportVideo = async ({images, onProgress, width = WIDTH, height = HEIGHT, fps = FPS, musicUrl = MUSIC_PATH}) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context unavailable');
  }

  const stream = canvas.captureStream(fps);
  const mimeType = pickMimeType();
  const music = await createLoopingMusicStream(musicUrl);
  const combinedStream = new MediaStream([
    ...stream.getVideoTracks(),
    ...music.stream.getAudioTracks(),
  ]);
  const recorder = new MediaRecorder(combinedStream, mimeType ? {mimeType} : undefined);
  const chunks = [];

  const recording = new Promise((resolve) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => resolve(new Blob(chunks, {type: recorder.mimeType || 'video/webm'}));
  });

  try {
    recorder.start();
    await sleep(50);

    const durationFrames = getVideoDurationFrames(images.length, fps);
    for (let frameIndex = 0; frameIndex < durationFrames; frameIndex += 1) {
      drawFrame(ctx, images, frameIndex, {width, height, fps});
      if (onProgress) onProgress((frameIndex / durationFrames) * 0.85);
      await sleep(1000 / fps);
    }

    recorder.stop();
    const webmBlob = await recording;
    if (onProgress) onProgress(0.9);
    const mp4Blob = await transcodeToMp4(webmBlob);
    if (onProgress) onProgress(1);
    return mp4Blob;
  } finally {
    await music.stop().catch(() => undefined);
  }
};