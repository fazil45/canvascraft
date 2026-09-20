import LandingPage from "@/pages/LandingPage";
import "./globals.css";

export default function Home() {
  return (
    <div className="min-h-screen w-screen bg-white bg-[radial-gradient(#D3D3D3_1px,transparent_1px)] bg-size-[10px_10px] sm:bg-[radial-gradient(#D3D3D3_10px,transparent_5px)] sm:bg-size-[12px_12px] md:bg-[radial-gradient(#D3D3D3_1.5px,transparent_1.5px)] md:bg-size-[14px_14px] dark:bg-black dark:bg-[radial-gradient(#ffffff20_1px,transparent_1px)]">
      <LandingPage />
    </div>
  );
}
