import Navbar from "./_components/landing/navbar";
import Hero from "./_components/landing/hero";
import About from "./_components/landing/about";
export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar />
      <main className="flex w-full flex-col items-center">
        <Hero />
        <About />
      </main>
    </div>
  );
}
