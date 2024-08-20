export default function Header() {
  return (
    <header>
      <div className="flex flex-row items-center gap-2 bg-gradient-to-r from-[#672280] to-[#A626D3] px-8 py-6">
        <img className="h-full" src="/troll-face.svg" alt="Troll Face" />
        <h1 className="text-white font-bold text-xl">Meme Generator</h1>
      </div>
    </header>
  );
}
