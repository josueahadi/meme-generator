import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
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

const Meme: React.FC = () => {
  const [meme, setMeme] = useState<Meme>({
    topText: "",
    bottomText: "",
    memeImageUrl: "https://i.imgflip.com/23ls.jpg",
  });

  const [allMemes, setAllMemes] = useState<MemesData[]>([]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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

  const memeRef = useRef<HTMLDivElement>(null);

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
    setMeme((prevMeme) => ({ ...prevMeme, memeImageUrl: url }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !file.type.startsWith("image/")) return;

    const url = URL.createObjectURL(file);
    setUploadedImageUrl(url);
    setMeme((prevMeme) => ({ ...prevMeme, memeImageUrl: url }));
  };

  return (
    <main className="flex flex-col items-center justify-center py-10 px-6">
      <div className="w-full sm:w-auto grid grid-cols-2 grid-rows-2 gap-4 sm:gap-8">
        <div className="w-full sm:w-56">
          <label className="font-medium text-sm">Top text</label>
          <Input
            placeholder="Add your text"
            value={meme.topText}
            onChange={handleTextChange("topText")}
          />
        </div>
        <div className="w-full sm:w-56">
          <label className="font-medium text-sm">Bottom text</label>
          <Input
            placeholder="Add your text"
            value={meme.bottomText}
            onChange={handleTextChange("bottomText")}
          />
        </div>
        <Button
          onClick={getMemeImage}
          disabled={allMemes.length === 0}
          className="bg-[#A818DA] hover:bg-[#711F8D] font-bold text-white text-base"
        >
          Get a random image
        </Button>
        <Button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          variant="outline"
          className="font-bold text-base"
        >
          <Upload aria-hidden="true" className="mr-2 h-4 w-4" />
          Upload image
        </Button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          aria-label="Choose an image to use in your meme"
        />
      </div>
      <div
        className="w-full sm:w-[30rem] relative flex justify-center"
        ref={memeRef}
      >
        {meme.memeImageUrl && (
          <>
            <img src={meme.memeImageUrl} alt="Random Meme" className="" />
            <h1 className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white uppercase shadow-black text-2xl font-regular z-50 text-center impact-font text-stroke">
              {meme.topText}
            </h1>
            <h1 className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white uppercase shadow-black text-2xl font-regular z-50 text-center impact-font text-stroke">
              {meme.bottomText}
            </h1>
          </>
        )}
      </div>
      <DownloadButton memeRef={memeRef} />
    </main>
  );
};

export default Meme;
