import Hero from "./_components/landing/hero";
import About from "./_components/landing/about";
import SubmissionFlow from "./_components/landing/submission-flow";
import Footer from "./_components/landing/footer";
export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex w-full flex-col items-center overflow-x-hidden">
        <Hero />
        <About />
        <SubmissionFlow />
      </main>
      <Footer />
    </div>
  );
}
