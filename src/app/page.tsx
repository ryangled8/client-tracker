import { Benefits } from "@/components/landing/Benefits";
import { Features } from "@/components/landing/Features";
import { Testimonials } from "@/components/landing/Testimonials";
import { Hero } from "@/components/landing/Hero";
import { CtaBanner } from "@/components/landing/CtaBanner";
import { FAQs } from "@/components/landing/FAQs";
import { Pricing } from "@/components/landing/Pricing";
import { TitleThreeCards } from "@/components/landing/TitleWithThreeCards";
import { TwoCardSplit } from "@/components/landing/TwoCardSplit";
import { VideoDemo } from "@/components/landing/VideoDemo";

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
