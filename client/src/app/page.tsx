import Hero from "./_components/landing/hero";
import About from "./_components/landing/about";
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <Hero />
      <About />
    </main>
  );
}
