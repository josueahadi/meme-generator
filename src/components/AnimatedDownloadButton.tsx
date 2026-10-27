import { useState } from "react";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { applyPalette, GIFEncoder, quantize } from "gifenc";

export type CaptionTextCase = "original" | "uppercase" | "lowercase";

export interface CaptionStyle {
  sideMargin: number;
  fontSize: number;
  fontFamily: string;
  textCase: CaptionTextCase;
  italic: boolean;
}

export interface MemeSticker {
  id: number;
  text: string;
  x: number;
  y: number;
}

interface AnimatedDownloadButtonProps {
  videoRef: RefObject<HTMLVideoElement>;
  captions: { topText: string; bottomText: string };
  captionStyles: { topText: CaptionStyle; bottomText: CaptionStyle };
  stickers: MemeSticker[];
  trimStart: number;
  trimEnd: number;
  playbackSpeed: number;
}

type CaptionPosition = "topText" | "bottomText";

const getSupportedMimeType = () => {
  const types = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];

  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
};

const seekVideo = (video: HTMLVideoElement, time: number) =>
  new Promise<void>((resolve, reject) => {
    if (Math.abs(video.currentTime - time) < 0.01) {
      resolve();
      return;
    }

    const timeout = window.setTimeout(() => {
      video.removeEventListener("seeked", onSeeked);
      reject(new Error("Could not seek to the selected clip range."));
    }, 5000);
    const onSeeked = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    video.addEventListener("seeked", onSeeked, { once: true });
    video.currentTime = time;
  });

const getTrimRange = (video: HTMLVideoElement, trimStart: number, trimEnd: number) => {
  if (!Number.isFinite(video.duration) || video.duration <= 0) return null;

  const start = Math.max(0, Math.min(trimStart, video.duration - 0.1));
  const end = Math.max(start + 0.1, Math.min(trimEnd || video.duration, video.duration));
  return { start, end };
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const wrapText = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) => {
  const lines: string[] = [];
  let line = "";

  for (const word of text.trim().split(/\s+/)) {
    if (!word) continue;
    const candidate = line ? `${line} ${word}` : word;

    if (context.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }

    if (line) lines.push(line);
    line = "";

    for (const character of word) {
      const next = line + character;
      if (line && context.measureText(next).width > maxWidth) {
        lines.push(line);
        line = character;
      } else {
        line = next;
      }
    }
  }

  if (line) lines.push(line);
  return lines;
};

const drawText = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  centerX: number,
  firstLineY: number,
  lineHeight: number,
) => {
  const lines = wrapText(context, text, maxWidth);
  context.lineJoin = "round";
  context.lineWidth = Math.max(2, lineHeight * 0.1);
  context.strokeStyle = "#000";
  context.fillStyle = "#fff";
  lines.forEach((line, index) => {
    const y = firstLineY + index * lineHeight;
    context.strokeText(line, centerX, y);
    context.fillText(line, centerX, y);
  });
  return lines.length;
};

const drawMemeFrame = (
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  captions: AnimatedDownloadButtonProps["captions"],
  captionStyles: AnimatedDownloadButtonProps["captionStyles"],
  stickers: MemeSticker[],
) => {
  const width = canvas.width;
  const height = canvas.height;
  const scale = width / Math.max(video.clientWidth, 1);

  context.clearRect(0, 0, width, height);
  context.drawImage(video, 0, 0, width, height);

  ( ["topText", "bottomText"] as CaptionPosition[]).forEach((position) => {
    const captionStyle = captionStyles[position];
    const text = captions[position];
    if (!text) return;

    const content = captionStyle.textCase === "uppercase"
      ? text.toLocaleUpperCase()
      : captionStyle.textCase === "lowercase"
        ? text.toLocaleLowerCase()
        : text;
    const fontSize = captionStyle.fontSize * scale;
    const lineHeight = fontSize * 1.05;
    const maxWidth = width * (1 - captionStyle.sideMargin * 2 / 100);
    const style = captionStyle.italic ? "italic " : "";
    context.font = `${style}${fontSize}px ${captionStyle.fontFamily}`;
    context.textAlign = "center";
    context.textBaseline = "top";
    const lineCount = wrapText(context, content, maxWidth).length;
    const firstLineY = position === "topText"
      ? 16 * scale
      : height - 16 * scale - lineCount * lineHeight;
    drawText(context, content, maxWidth, width / 2, firstLineY, lineHeight);
  });

  stickers.forEach((sticker) => {
    const fontSize = 32 * scale;
    const lineHeight = fontSize * 1.1;
    const maxWidth = width * 0.7;
    context.font = `700 ${fontSize}px Impact, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "top";
    const lines = wrapText(context, sticker.text, maxWidth);
    const centerX = width * sticker.x / 100;
    const firstLineY = height * sticker.y / 100 - lines.length * lineHeight / 2;
    drawText(context, sticker.text, maxWidth, centerX, firstLineY, lineHeight);
  });
};

const AnimatedDownloadButton: React.FC<AnimatedDownloadButtonProps> = ({
  videoRef,
  captions,
  captionStyles,
  stickers,
  trimStart,
  trimEnd,
  playbackSpeed,
}) => {
  const [exportingFormat, setExportingFormat] = useState<"video" | "gif" | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const downloadAnimation = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError("Wait for the video to finish loading, then try again.");
      return;
    }

    if (
      typeof MediaRecorder === "undefined" ||
      typeof HTMLCanvasElement.prototype.captureStream !== "function"
    ) {
      setError("Animated export is not supported by this browser.");
      return;
    }

    const mimeType = getSupportedMimeType();
    if (!mimeType) {
      setError("This browser does not support an exportable video format.");
      return;
    }

    const trimRange = getTrimRange(video, trimStart, trimEnd);
    if (!trimRange) {
      setError("This clip is not ready to export yet.");
      return;
    }

    if (trimRange.end - trimRange.start <= 0.1) {
      setError("Choose a longer clip range before exporting.");
      return;
    }

    setError("");
    setProgress(0);
    setExportingFormat("video");
    const wasPlaying = !video.paused;
    const previousTime = video.currentTime;
    const previousLoop = video.loop;
    const previousMuted = video.muted;
    const previousPlaybackRate = video.playbackRate;
    let canvasStream: MediaStream | undefined;
    let animationFrame = 0;
    let stopTimeout = 0;
    let stopAtTrimEnd = () => undefined;

    try {
      await document.fonts.ready;

      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1280 / video.videoWidth, 1280 / video.videoHeight);
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not create a video canvas.");

      video.pause();
      video.loop = false;
      video.muted = true;
      video.playbackRate = playbackSpeed;
      await seekVideo(video, trimRange.start);

      const drawFrame = () => drawMemeFrame(
        context,
        video,
        canvas,
        captions,
        captionStyles,
        stickers,
      );
      drawFrame();
      canvasStream = canvas.captureStream(30);

      const recorder = new MediaRecorder(canvasStream, { mimeType });
      const chunks: Blob[] = [];
      const recordingStopped = new Promise<void>((resolve) => {
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };
        recorder.onstop = () => resolve();
        recorder.onerror = () => {
          setError("The video could not be recorded. Try a shorter clip.");
          if (recorder.state === "recording") recorder.stop();
        };
      });

      const stopRecording = () => {
        if (recorder.state === "recording") recorder.stop();
      };
      stopAtTrimEnd = () => {
        if (video.currentTime >= trimRange.end) {
          stopRecording();
        }
      };
      video.addEventListener("timeupdate", stopAtTrimEnd);
      stopTimeout = window.setTimeout(
        stopRecording,
        ((trimRange.end - trimRange.start) / playbackSpeed + 3) * 1000,
      );

      recorder.start(250);
      await video.play();
      const renderFrame = () => {
        drawFrame();
        if (video.currentTime < trimRange.end) {
          animationFrame = requestAnimationFrame(renderFrame);
        } else {
          stopRecording();
        }
      };
      renderFrame();
      await recordingStopped;

      if (chunks.length === 0) throw new Error("No video frames were recorded.");
      const blob = new Blob(chunks, { type: mimeType });
      const extension = mimeType.includes("mp4") ? "mp4" : "webm";
      downloadBlob(blob, `animated-meme.${extension}`);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Video export failed.");
    } finally {
      video.removeEventListener("timeupdate", stopAtTrimEnd);
      cancelAnimationFrame(animationFrame);
      window.clearTimeout(stopTimeout);
      canvasStream?.getTracks().forEach((track) => track.stop());
      video.pause();
      video.loop = previousLoop;
      video.muted = previousMuted;
      video.playbackRate = previousPlaybackRate;
      if (Number.isFinite(previousTime)) video.currentTime = previousTime;
      if (wasPlaying) void video.play().catch(() => undefined);
      setExportingFormat(null);
    }
  };

  const downloadGif = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError("Wait for the video to finish loading, then try again.");
      return;
    }

    const trimRange = getTrimRange(video, trimStart, trimEnd);
    if (!trimRange) {
      setError("This clip is not ready to export yet.");
      return;
    }
    if (trimRange.end - trimRange.start > 8) {
      setError("GIF export is limited to 8 seconds. Shorten the selected clip range.");
      return;
    }

    setError("");
    setProgress(0);
    setExportingFormat("gif");
    const wasPlaying = !video.paused;
    const previousTime = video.currentTime;
    const previousLoop = video.loop;
    const previousMuted = video.muted;
    const previousPlaybackRate = video.playbackRate;
    let animationFrame = 0;
    let stopTimeout = 0;
    let stopAtTrimEnd = () => undefined;

    try {
      await document.fonts.ready;
      const scale = Math.min(1, 480 / video.videoWidth, 480 / video.videoHeight);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not create a GIF canvas.");

      video.pause();
      video.loop = false;
      video.muted = true;
      video.playbackRate = playbackSpeed;
      await seekVideo(video, trimRange.start);

      const drawFrame = () => drawMemeFrame(
        context,
        video,
        canvas,
        captions,
        captionStyles,
        stickers,
      );
      const frames: Uint8ClampedArray[] = [];
      let lastFrameTime = 0;
      const gifFrameDelay = 100;
      const captureFrame = (now: number) => {
        drawFrame();
        if (now - lastFrameTime >= gifFrameDelay || frames.length === 0) {
          frames.push(context.getImageData(0, 0, canvas.width, canvas.height).data);
          lastFrameTime = now;
          setProgress(Math.min(100, ((video.currentTime - trimRange.start) / (trimRange.end - trimRange.start)) * 100));
        }
        if (video.currentTime < trimRange.end) {
          animationFrame = requestAnimationFrame(captureFrame);
        }
      };

      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          video.removeEventListener("timeupdate", stopAtTrimEnd);
          resolve();
        };
        stopAtTrimEnd = () => {
          if (video.currentTime >= trimRange.end) finish();
        };
        video.addEventListener("timeupdate", stopAtTrimEnd);
        stopTimeout = window.setTimeout(
          finish,
          ((trimRange.end - trimRange.start) / playbackSpeed + 5) * 1000,
        );
        video.play()
          .then(() => {
            animationFrame = requestAnimationFrame(captureFrame);
          })
          .catch(reject);
      });
      video.pause();
      if (frames.length === 0) throw new Error("No GIF frames were captured.");

      const samplePixelsPerFrame = 1200;
      const pixelCount = canvas.width * canvas.height;
      const pixelStep = Math.max(1, Math.floor(pixelCount / samplePixelsPerFrame));
      const paletteSamples: number[] = [];
      for (const frame of frames) {
        for (let pixel = 0; pixel < pixelCount; pixel += pixelStep) {
          const offset = pixel * 4;
          paletteSamples.push(frame[offset], frame[offset + 1], frame[offset + 2], frame[offset + 3]);
        }
      }
      const palette = quantize(new Uint8Array(paletteSamples), 256);
      const gif = GIFEncoder();
      frames.forEach((frame, index) => {
        gif.writeFrame(applyPalette(frame, palette), canvas.width, canvas.height, {
          palette: index === 0 ? palette : undefined,
          delay: gifFrameDelay,
          repeat: index === 0 ? 0 : undefined,
        });
        setProgress(Math.min(100, ((index + 1) / frames.length) * 100));
      });
      gif.finish();
      const gifBytes = gif.bytes();
      const gifBuffer = new ArrayBuffer(gifBytes.byteLength);
      new Uint8Array(gifBuffer).set(gifBytes);
      downloadBlob(new Blob([gifBuffer], { type: "image/gif" }), "animated-meme.gif");
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "GIF export failed.");
    } finally {
      video.removeEventListener("timeupdate", stopAtTrimEnd);
      cancelAnimationFrame(animationFrame);
      window.clearTimeout(stopTimeout);
      video.pause();
      video.loop = previousLoop;
      video.muted = previousMuted;
      video.playbackRate = previousPlaybackRate;
      if (Number.isFinite(previousTime)) video.currentTime = previousTime;
      if (wasPlaying) void video.play().catch(() => undefined);
      setExportingFormat(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          type="button"
          onClick={downloadAnimation}
          disabled={exportingFormat !== null}
          className="bg-[#A818DA] font-bold text-white hover:bg-[#711F8D]"
        >
          {exportingFormat === "video" ? "Recording video..." : "Download video"}
        </Button>
        <Button
          type="button"
          onClick={downloadGif}
          disabled={exportingFormat !== null}
          variant="outline"
        >
          {exportingFormat === "gif" ? "Encoding GIF..." : "Download GIF"}
        </Button>
      </div>
      {exportingFormat && (
        <progress className="h-2 w-full max-w-xs accent-fuchsia-600" value={progress} max="100" aria-label="Export progress" />
      )}
      <p className="text-center text-xs text-slate-500">Video exports as MP4 or WebM without audio. GIF export supports clips up to 8 seconds.</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
};

export default AnimatedDownloadButton;