import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Film, Upload } from "lucide-react";
import AnimatedDownloadButton, {
  type CaptionStyle,
  type CaptionTextCase,
  type MemeSticker,
} from "./AnimatedDownloadButton";
import DownloadButton from "./DownloadButton";
import "./Meme.css";

interface MemesData {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  box_count: number;
  captions: number;
}

interface Meme {
  topText: string;
  bottomText: string;
  memeImageUrl: string;
}

type CaptionKey = "topText" | "bottomText";

const defaultCaptionStyle: CaptionStyle = {
  sideMargin: 8,
  fontSize: 36,
  fontFamily: "Impact, sans-serif",
  textCase: "uppercase",
  italic: false,
};

const Meme: React.FC = () => {
  const [meme, setMeme] = useState<Meme>({
    topText: "",
    bottomText: "",
    memeImageUrl: "https://i.imgflip.com/23ls.jpg",
  });

  const [allMemes, setAllMemes] = useState<MemesData[]>([]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [videoTrimStart, setVideoTrimStart] = useState(0);
  const [videoTrimEnd, setVideoTrimEnd] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [captionStyles, setCaptionStyles] = useState<Record<CaptionKey, CaptionStyle>>({
    topText: { ...defaultCaptionStyle },
    bottomText: { ...defaultCaptionStyle },
  });
  const [activeCaption, setActiveCaption] = useState<CaptionKey>("bottomText");
  const [stickers, setStickers] = useState<MemeSticker[]>([]);
  const [stickerText, setStickerText] = useState("");
  const nextStickerId = useRef(0);
  const draggingStickerId = useRef<number | null>(null);

  useEffect(() => {
    const fetchMemes = async () => {
      try {
        const response = await fetch("https://api.imgflip.com/get_memes");
        const data = await response.json();
        setAllMemes(data.data.memes);
      } catch (error) {
        console.error("Error fetching memes:", error);
      }
    };
  
    fetchMemes();
  }, []);

  useEffect(() => {
    return () => {
      if (uploadedImageUrl) {
        URL.revokeObjectURL(uploadedImageUrl);
      }
    };
  }, [uploadedImageUrl]);

  useEffect(() => {
    return () => {
      if (uploadedVideoUrl) {
        URL.revokeObjectURL(uploadedVideoUrl);
      }
    };
  }, [uploadedVideoUrl]);

  const memeRef = useRef<HTMLDivElement>(null);
  const activeCaptionStyle = captionStyles[activeCaption];

  const updateCaptionStyle = (update: Partial<CaptionStyle>) => {
    setCaptionStyles((previous) => ({
      ...previous,
      [activeCaption]: { ...previous[activeCaption], ...update },
    }));
  };

  const handleTextChange =
    (field: "topText" | "bottomText") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (field === "topText") {
        setMeme((prevMeme) => ({ ...prevMeme, topText: event.target.value }));
      } else {
        setMeme((prevMeme) => ({
          ...prevMeme,
          bottomText: event.target.value,
        }));
      }
    };

  const getMemeImage = () => {
    if (allMemes.length === 0) return;

    const randomIndex: number = Math.floor(Math.random() * allMemes.length);
    const url: string = allMemes[randomIndex].url;
    setUploadedImageUrl(null);
    setUploadedVideoUrl(null);
    setMeme((prevMeme) => ({ ...prevMeme, memeImageUrl: url }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !file.type.startsWith("image/")) return;

    const url = URL.createObjectURL(file);
    setUploadedImageUrl(url);
    setUploadedVideoUrl(null);
    setMeme((prevMeme) => ({ ...prevMeme, memeImageUrl: url }));
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !file.type.startsWith("video/")) return;

    const url = URL.createObjectURL(file);
    setUploadedImageUrl(null);
    setUploadedVideoUrl(url);
    setVideoTrimStart(0);
    setVideoTrimEnd(0);
    setVideoDuration(0);
    setVideoCurrentTime(0);
    setPlaybackSpeed(1);
  };

  const handleVideoMetadata = () => {
    if (!videoRef.current) return;

    const duration = Number.isFinite(videoRef.current.duration)
      ? videoRef.current.duration
      : 0;
    if (duration <= 0) return;

    setVideoDuration(duration);
    setVideoTrimStart(0);
    setVideoTrimEnd(duration);
    setVideoCurrentTime(videoRef.current.currentTime);
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setVideoCurrentTime(videoRef.current.currentTime);
    }
  };

  const addSticker = (text = stickerText) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    setStickers((previous) => [
      ...previous,
      {
        id: nextStickerId.current++,
        text: trimmedText,
        x: 50,
        y: Math.min(50 + (previous.length % 4) * 8, 82),
      },
    ]);
    setStickerText("");
  };

  const handleStickerPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    stickerId: number,
  ) => {
    event.preventDefault();
    draggingStickerId.current = stickerId;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleStickerPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const stickerId = draggingStickerId.current;
    const bounds = memeRef.current?.getBoundingClientRect();
    if (stickerId === null || !bounds || bounds.width === 0 || bounds.height === 0) return;

    const x = Math.max(4, Math.min(96, ((event.clientX - bounds.left) / bounds.width) * 100));
    const y = Math.max(4, Math.min(96, ((event.clientY - bounds.top) / bounds.height) * 100));
    setStickers((previous) =>
      previous.map((sticker) =>
        sticker.id === stickerId ? { ...sticker, x, y } : sticker,
      ),
    );
  };

  const handleStickerPointerEnd = () => {
    draggingStickerId.current = null;
  };

  const renderCaption = (caption: CaptionKey, position: "top-4" | "bottom-4") => {
    const style = captionStyles[caption];
    const textTransform = style.textCase === "original" ? "none" : style.textCase;

    return (
      <div
        className={`absolute ${position} z-10 text-center text-white impact-font text-stroke`}
        style={{
          left: `${style.sideMargin}%`,
          right: `${style.sideMargin}%`,
          fontFamily: style.fontFamily,
          fontSize: `${style.fontSize}px`,
          fontStyle: style.italic ? "italic" : "normal",
          textTransform,
          overflowWrap: "anywhere",
          lineHeight: 1.05,
        }}
      >
        {meme[caption]}
      </div>
    );
  };

  return (
    <main className="editor-layout">
      <div className="editor-source grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="top-caption" className="font-medium text-sm">Top text</label>
          <Input
            id="top-caption"
            placeholder="Add your text"
            value={meme.topText}
            onChange={handleTextChange("topText")}
          />
        </div>
        <div>
          <label htmlFor="bottom-caption" className="font-medium text-sm">Bottom text</label>
          <Input
            id="bottom-caption"
            placeholder="Add your text"
            value={meme.bottomText}
            onChange={handleTextChange("bottomText")}
          />
        </div>
        <Button
          onClick={getMemeImage}
          disabled={allMemes.length === 0}
          className="bg-[#A818DA] font-bold text-white hover:bg-[#711F8D]"
        >
          Get a random image
        </Button>
        <Button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          variant="outline"
          className="font-bold"
        >
          <Upload aria-hidden="true" className="mr-2 h-4 w-4" />
          Upload image
        </Button>
        <Button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          variant="outline"
          className="font-bold sm:col-span-2"
        >
          <Film aria-hidden="true" className="mr-2 h-4 w-4" />
          Upload video clip
        </Button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          aria-label="Choose an image to use in your meme"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={handleVideoUpload}
          className="hidden"
          aria-label="Choose a video clip to use in your meme"
        />
      </div>

      <section className="editor-caption w-full border-y border-slate-200 py-5" aria-label="Caption formatting">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Caption style</h2>
          <div className="flex items-center gap-2">
            <label htmlFor="caption-target" className="text-sm font-medium">Edit</label>
            <select
              id="caption-target"
              value={activeCaption}
              onChange={(event) => setActiveCaption(event.target.value as CaptionKey)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="topText">Top caption</option>
              <option value="bottomText">Bottom caption</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="caption-margins">
            Side margins <span className="font-normal text-slate-500">{activeCaptionStyle.sideMargin}%</span>
            <input
              id="caption-margins"
              type="range"
              min="0"
              max="30"
              value={activeCaptionStyle.sideMargin}
              onChange={(event) => updateCaptionStyle({ sideMargin: Number(event.target.value) })}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="caption-size">
            Font size <span className="font-normal text-slate-500">{activeCaptionStyle.fontSize}px</span>
            <input
              id="caption-size"
              type="range"
              min="16"
              max="64"
              value={activeCaptionStyle.fontSize}
              onChange={(event) => updateCaptionStyle({ fontSize: Number(event.target.value) })}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="caption-case">
            Letter case
            <select
              id="caption-case"
              value={activeCaptionStyle.textCase}
              onChange={(event) => updateCaptionStyle({ textCase: event.target.value as CaptionTextCase })}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="original">As typed</option>
              <option value="uppercase">UPPERCASE</option>
              <option value="lowercase">lowercase</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="caption-font">
            Font
            <select
              id="caption-font"
              value={activeCaptionStyle.fontFamily}
              onChange={(event) => updateCaptionStyle({ fontFamily: event.target.value })}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="Impact, sans-serif">Impact</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Georgia, serif">Georgia</option>
            </select>
          </label>
          <Button
            type="button"
            variant={activeCaptionStyle.italic ? "default" : "outline"}
            aria-pressed={activeCaptionStyle.italic}
            onClick={() => updateCaptionStyle({ italic: !activeCaptionStyle.italic })}
            className="justify-self-start"
          >
            <span className="mr-2 font-serif italic" aria-hidden="true">I</span>
            Italic
          </Button>
        </div>
      </section>

      <section className="editor-stickers w-full" aria-label="Sticker creator">
        <h2 className="mb-3 text-base font-semibold">Create stickers</h2>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            addSticker();
          }}
        >
          <Input
            value={stickerText}
            onChange={(event) => setStickerText(event.target.value)}
            placeholder="Type text or an emoji"
            aria-label="Sticker text"
            maxLength={32}
          />
          <Button type="submit" disabled={!stickerText.trim()} className="bg-[#A818DA] font-bold text-white hover:bg-[#711F8D]">
            Add sticker
          </Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Quick stickers">
          {["😂", "🔥", "❤️", "✨", "💯"].map((sticker) => (
            <Button
              key={sticker}
              type="button"
              variant="outline"
              size="icon"
              aria-label={`Add ${sticker} sticker`}
              onClick={() => addSticker(sticker)}
            >
              <span aria-hidden="true">{sticker}</span>
            </Button>
          ))}
        </div>
      </section>

      <section className="editor-preview" aria-label="Meme preview">
        <div className="meme-preview-canvas" ref={memeRef}>
        {meme.memeImageUrl && (
          <>
            {uploadedVideoUrl ? (
              <video
                ref={videoRef}
                src={uploadedVideoUrl}
                aria-label="Video meme preview"
                autoPlay
                loop
                muted
                playsInline
                controls
                onLoadedMetadata={handleVideoMetadata}
                onTimeUpdate={handleVideoTimeUpdate}
              />
            ) : (
              <img src={meme.memeImageUrl} alt="Meme background" />
            )}
            {renderCaption("topText", "top-4")}
            {renderCaption("bottomText", "bottom-4")}
            {stickers.map((sticker) => (
              <div
                key={sticker.id}
                className="meme-sticker"
                style={{ left: `${sticker.x}%`, top: `${sticker.y}%` }}
                onPointerDown={(event) => handleStickerPointerDown(event, sticker.id)}
                onPointerMove={handleStickerPointerMove}
                onPointerUp={handleStickerPointerEnd}
                onPointerCancel={handleStickerPointerEnd}
              >
                <span>{sticker.text}</span>
                <button
                  type="button"
                  className="meme-sticker-remove"
                  aria-label={`Remove ${sticker.text} sticker`}
                  data-html2canvas-ignore="true"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => setStickers((previous) => previous.filter((item) => item.id !== sticker.id))}
                >
                  ×
                </button>
              </div>
            ))}
          </>
        )}
        </div>
        {uploadedVideoUrl && (
          <div className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <label className="flex flex-col gap-2 font-medium" htmlFor="video-playhead">
              Preview position
              <span className="font-normal text-slate-500">
                {videoCurrentTime.toFixed(1)}s / {videoDuration.toFixed(1)}s
              </span>
              <input
                id="video-playhead"
                type="range"
                min="0"
                max={Math.max(videoDuration, 0.1)}
                step="0.1"
                value={Math.min(videoCurrentTime, videoDuration || 0)}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setVideoCurrentTime(next);
                  if (videoRef.current) videoRef.current.currentTime = next;
                }}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 font-medium" htmlFor="video-trim-start">
                Clip start
                <span className="font-normal text-slate-500">{videoTrimStart.toFixed(1)}s</span>
                <input
                  id="video-trim-start"
                  type="range"
                  min="0"
                  max={Math.max(videoDuration - 0.1, 0)}
                  step="0.1"
                  value={videoTrimStart}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setVideoTrimStart(Math.min(next, Math.max(videoTrimEnd - 0.1, 0)));
                  }}
                />
              </label>
              <label className="flex flex-col gap-2 font-medium" htmlFor="video-trim-end">
                Clip end
                <span className="font-normal text-slate-500">{videoTrimEnd.toFixed(1)}s</span>
                <input
                  id="video-trim-end"
                  type="range"
                  min={Math.min(videoTrimStart + 0.1, videoDuration)}
                  max={Math.max(videoDuration, 0.1)}
                  step="0.1"
                  value={videoTrimEnd}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setVideoTrimEnd(Math.max(next, videoTrimStart + 0.1));
                  }}
                />
              </label>
              <label className="flex items-center gap-2 font-medium sm:col-span-2" htmlFor="video-speed">
                Playback speed
                <select
                  id="video-speed"
                  value={playbackSpeed}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setPlaybackSpeed(next);
                    if (videoRef.current) videoRef.current.playbackRate = next;
                  }}
                  className="h-9 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="0.5">0.5x</option>
                  <option value="0.75">0.75x</option>
                  <option value="1">1x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                </select>
              </label>
            </div>
          </div>
        )}
        <div className="mt-4 flex justify-center">
          {uploadedVideoUrl ? (
            <AnimatedDownloadButton
              videoRef={videoRef}
              captions={{ topText: meme.topText, bottomText: meme.bottomText }}
              captionStyles={captionStyles}
              stickers={stickers}
              trimStart={videoTrimStart}
              trimEnd={videoTrimEnd}
              playbackSpeed={playbackSpeed}
            />
          ) : (
            <DownloadButton memeRef={memeRef} />
          )}
        </div>
      </section>
    </main>
  );
};

export default Meme;
