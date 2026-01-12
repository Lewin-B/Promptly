import Hero from "./_components/landing/hero";
import About from "./_components/landing/about";
export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex w-full flex-col items-center overflow-x-hidden">
        <Hero />
        <About />
      </main>
    </div>
  );
}
