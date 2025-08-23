import Hero from "@/components/landing/Hero";
import VideoDemo from "@/components/landing/VideoDemo";
import TitleThreeCards from "@/components/landing/TitleWithThreeCards";
import Benefits from "@/components/landing/Benefits";
import TwoCardSplit from "@/components/landing/TwoCardSplit";
import Testimonials from "@/components/landing/Testimonials";
import Features from "@/components/landing/Features";
import Pricing from "@/components/landing/Pricing";
import FAQs from "@/components/landing/FAQs";
import CtaBanner from "@/components/landing/CtaBanner";

export default async function HomePage() {
  return (
    <section>
      <Hero />

      <VideoDemo />

      <TitleThreeCards />

      <Benefits />

      <TwoCardSplit />

      <Testimonials />

      <Features />

      <Pricing />

      <FAQs />

      <CtaBanner />
    </section>
  );
}
