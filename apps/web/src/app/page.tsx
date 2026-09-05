import { Navbar } from '@/components/marketing/Navbar';
import { Hero } from '@/components/marketing/Hero';
import { Features, HowItWorks, ComparisonSection } from '@/components/marketing/Features';
import { Footer } from '@/components/marketing/Footer';

export default function LandingPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-ops-dark-950">
      <Navbar />
      <main className="pt-16">
        <Hero />
        <div id="features">
          <Features />
        </div>
        <HowItWorks />
        <ComparisonSection />
      </main>
      <Footer />
    </div>
  );
}
