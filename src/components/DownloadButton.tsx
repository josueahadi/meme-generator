import React from "react";
import html2canvas from "html2canvas";

interface DownloadButtonProps {
  memeRef: React.RefObject<HTMLDivElement>;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ memeRef }) => {
  const downloadMeme = async () => {
    if (memeRef.current) {
      const canvas = await html2canvas(memeRef.current, {
        useCORS: true, // Enable cross-origin resource sharing if needed
        backgroundColor: null, // Set background color to null to capture transparent background
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "meme.png";
      link.click();
    }
  };

  return (
    <button
      onClick={downloadMeme}
      className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Download Meme
    </button>
  );
};

export default DownloadButton;
