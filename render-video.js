const fs = require('node:fs');
const path = require('node:path');
const {bundle} = require('@remotion/bundler');
const {getCompositions, renderMedia} = require('@remotion/renderer');

// =========================
// Project Render Config
// =========================

// Allow command line argument: node render-video.js slideshow|transitions
const renderMode = process.argv[2] || 'slideshow';

const COMPOSITIONS = {
  slideshow: {
    id: 'Slideshow',
    outputFile: path.resolve(process.cwd(), 'out', 'slideshow.mp4'),
    durationMultiplier: (imageCount) => imageCount * 30 + (imageCount - 1) * 25, // Rough calc
  },
  transitions: {
    id: 'AllTransitions',
    outputFile: path.resolve(process.cwd(), 'out', 'all-transitions.mp4'),
    durationMultiplier: () => 600, // 20 seconds at 30fps (4+5+4+4+3 transitions)
  },
};

const selectedComposition = COMPOSITIONS[renderMode];
if (!selectedComposition) {
  console.error(`Invalid render mode: ${renderMode}`);
  console.error(`Available modes: ${Object.keys(COMPOSITIONS).join(', ')}`);
  process.exit(1);
}

const CONFIG = {
  compositionId: selectedComposition.id,
  inputDir: path.resolve(process.cwd(), 'img'),
  staticImageDir: path.resolve(process.cwd(), 'public', 'img'),
  entryPoint: path.resolve(process.cwd(), 'src', 'index.jsx'),
  outputFile: selectedComposition.outputFile,

  // Video settings
  fps: 30,
  width: 1080,
  height: 1920,
  stillSeconds: 2.7,
  transitionSeconds: 0.85,

  // Render settings
  codec: 'h264',
  crf: 18,
  imageFormats: ['.jpg', '.jpeg', '.png', '.webp'],
};

const ensureDir = (dir) => {
  fs.mkdirSync(dir, {recursive: true});
};

const clearDirectory = (dir) => {
  fs.rmSync(dir, {recursive: true, force: true});
  fs.mkdirSync(dir, {recursive: true});
};

const isImageFile = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  return CONFIG.imageFormats.includes(ext);
};

const copyInputImagesToPublic = () => {
  if (!fs.existsSync(CONFIG.inputDir)) {
    throw new Error(`Input directory not found: ${CONFIG.inputDir}`);
  }

  const allFiles = fs
    .readdirSync(CONFIG.inputDir)
    .filter(isImageFile)
    .sort((a, b) => a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'}));

  if (allFiles.length === 0) {
    throw new Error(`No images found in ${CONFIG.inputDir}. Supported formats: ${CONFIG.imageFormats.join(', ')}`);
  }

  clearDirectory(CONFIG.staticImageDir);

  for (const file of allFiles) {
    const source = path.join(CONFIG.inputDir, file);
    const destination = path.join(CONFIG.staticImageDir, file);
    fs.copyFileSync(source, destination);
  }

  return allFiles.map((file) => `img/${file}`); // staticFile() will find these in public/img/
};

const renderVideo = async () => {
  ensureDir(path.dirname(CONFIG.outputFile));

  const images = copyInputImagesToPublic();

  const inputProps = {
    images,
    settings: {
      fps: CONFIG.fps,
      width: CONFIG.width,
      height: CONFIG.height,
      stillSeconds: CONFIG.stillSeconds,
      transitionSeconds: CONFIG.transitionSeconds,
    },
  };

  console.log(`Found ${images.length} image(s).`);
  console.log('Bundling Remotion project...');

  const serveUrl = await bundle({
    entryPoint: CONFIG.entryPoint,
    webpackOverride: (config) => config,
  });

  const compositions = await getCompositions(serveUrl, {inputProps});
  const composition = compositions.find((c) => c.id === CONFIG.compositionId);

  if (!composition) {
    throw new Error(`Composition \"${CONFIG.compositionId}\" was not found.`);
  }

  console.log('Rendering MP4 video...');

  await renderMedia({
    composition,
    serveUrl,
    codec: CONFIG.codec,
    outputLocation: CONFIG.outputFile,
    inputProps,
    crf: CONFIG.crf,
    pixelFormat: 'yuv420p',
  });

  console.log(`Render complete: ${CONFIG.outputFile}`);
};

renderVideo().catch((err) => {
  console.error(err);
  process.exit(1);
});
