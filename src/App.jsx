import React, {useEffect, useMemo, useRef, useState} from 'react';
import {drawFrame, exportVideo, getVideoDurationFrames, preloadImages, WIDTH, HEIGHT} from './videoEngine';

const sampleUrls = `https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=1200&q=80
https://images.unsplash.com/photo-1507149833265-60c372daea22?auto=format&fit=crop&w=1200&q=80
https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=1200&q=80`;

const App = () => {
  const [urlText, setUrlText] = useState(sampleUrls);
  const [rawUrls, setRawUrls] = useState(sampleUrls.split('\n'));
  const [loadedImages, setLoadedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Paste image URLs, one per line.');
  const [progress, setProgress] = useState(0);
  const [errorRows, setErrorRows] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef(null);
  const previewFrameRef = useRef(0);
  const previewRafRef = useRef(0);
  const previewLastTimeRef = useRef(0);
  const previewAccumulatorRef = useRef(0);

  const validImages = useMemo(() => loadedImages.filter(Boolean), [loadedImages]);

  const runPreview = (entries) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fps = 30;
    const frameDurationMs = 1000 / fps;
    const durationFrames = Math.max(1, getVideoDurationFrames(entries.length, fps));

    drawFrame(ctx, entries, previewFrameRef.current, {width: WIDTH, height: HEIGHT, fps});

    if (!isPlaying) {
      return () => undefined;
    }

    let cancelled = false;
    const tick = (timestamp) => {
      if (cancelled) return;

      if (!previewLastTimeRef.current) {
        previewLastTimeRef.current = timestamp;
      }

      const deltaMs = timestamp - previewLastTimeRef.current;
      previewLastTimeRef.current = timestamp;
      previewAccumulatorRef.current += deltaMs;

      while (previewAccumulatorRef.current >= frameDurationMs) {
        previewFrameRef.current = (previewFrameRef.current + 1) % durationFrames;
        previewAccumulatorRef.current -= frameDurationMs;
      }

      drawFrame(ctx, entries, previewFrameRef.current, {width: WIDTH, height: HEIGHT, fps});
      previewRafRef.current = window.requestAnimationFrame(tick);
    };

    previewRafRef.current = window.requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      previewLastTimeRef.current = 0;
      previewAccumulatorRef.current = 0;
      window.cancelAnimationFrame(previewRafRef.current);
    };
  };

  useEffect(() => {
    if (validImages.length > 0) {
      const stop = runPreview(validImages);
      return () => stop?.();
    }
    return undefined;
  }, [validImages, isPlaying]);

  useEffect(() => {
    if (validImages.length === 0) {
      previewFrameRef.current = 0;
      return undefined;
    }

    previewFrameRef.current = 0;
    previewLastTimeRef.current = 0;
    previewAccumulatorRef.current = 0;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      drawFrame(ctx, validImages, previewFrameRef.current, {width: WIDTH, height: HEIGHT, fps: 30});
    }

    return undefined;
  }, [validImages]);

  const handleLoad = async () => {
    const urls = urlText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    setRawUrls(urls);
    setLoading(true);
    setStatus('Loading images and checking CORS...');
    setErrorRows([]);
    setProgress(0);

    try {
      const {images, errors} = await preloadImages(urls);
      setLoadedImages(images);
      setErrorRows(errors);
      setStatus(errors.length ? `${images.length} image(s) loaded, ${errors.length} failed.` : `${images.length} image(s) loaded.`);
    } catch (error) {
      setLoadedImages([]);
      setStatus(error.message || 'Failed to load images.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (validImages.length < 2) {
      setStatus('Load at least 2 valid image URLs first.');
      return;
    }

    setLoading(true);
    setProgress(0);
    setStatus('Rendering frames in browser...');

    try {
      const mp4Blob = await exportVideo({
        images: validImages,
        onProgress: setProgress,
      });

      const url = URL.createObjectURL(mp4Blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'image-video.mp4';
      anchor.click();
      setStatus('MP4 exported successfully.');
      window.setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (error) {
      setStatus(error.message || 'Export failed. Check URL CORS headers and browser support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="glow glow-a" />
      <div className="glow glow-b" />

      <header className="hero">
        <div>
          <p className="eyebrow">Frontend-only video builder</p>
          <h1>Paste image URLs, animate them, export MP4 locally.</h1>
          <p className="subcopy">
            Load remote image links directly into the browser, preview the transition sequence, then render and download a video without a backend.
          </p>
        </div>
        <div className="stat-card">
          <span>Loaded</span>
          <strong>{validImages.length}</strong>
          <small>images in state</small>
        </div>
      </header>

      <main className="layout">
        <section className="panel editor-panel">
          <label className="field-label" htmlFor="urls">
            Paste image URLs
          </label>
          <textarea
            id="urls"
            value={urlText}
            onChange={(event) => setUrlText(event.target.value)}
            placeholder="https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg"
            rows={12}
          />
          <div className="button-row">
            <button onClick={handleLoad} disabled={loading} className="button primary">
              {loading ? 'Working...' : 'Load URLs'}
            </button>
            <button
              onClick={() => setIsPlaying((value) => !value)}
              disabled={validImages.length < 2}
              className="button secondary"
            >
              {isPlaying ? 'Pause preview' : 'Play preview'}
            </button>
            <button onClick={handleExport} disabled={loading || validImages.length < 2} className="button secondary">
              Export MP4
            </button>
          </div>

          <div className="status-line">
            <span>{status}</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>

          {errorRows.length > 0 && (
            <div className="error-box">
              <strong>Some URLs failed to load</strong>
              <ul>
                {errorRows.slice(0, 4).map((item) => (
                  <li key={item.url}>
                    {item.url}
                  </li>
                ))}
              </ul>
              <p>
                If a host does not send CORS headers, the browser cannot draw it into the canvas. Use CORS-enabled image URLs.
              </p>
            </div>
          )}

          <div className="url-list">
            {rawUrls.map((url, index) => (
              <div className="url-chip" key={`${url}-${index}`}>
                <span>{index + 1}</span>
                <code>{url}</code>
              </div>
            ))}
          </div>
        </section>

        <section className="panel preview-panel">
          <div className="preview-header">
            <h2>Live preview</h2>
            <span>Canvas 1080 × 1920</span>
          </div>
          <div className="canvas-wrap">
            <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />
          </div>
          <div className="hint-grid">
            <div>
              <strong>Flow</strong>
              <p>URLs → state array → preload → draw frame-by-frame → record → transcode to MP4.</p>
            </div>
            <div>
              <strong>Note</strong>
              <p>Cross-origin image hosts must allow canvas access or export will fail.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;