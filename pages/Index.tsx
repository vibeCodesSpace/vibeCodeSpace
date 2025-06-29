import Hero from "@/components/Hero";
import Features from "@/components/Features";
import TechStack from "@/components/TechStack";
import Testimonials from "@/components/Testimonials";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";
import AnimatedBackground from "@/components/AnimatedBackground";

const Index = () => {
  return (
    <AnimatedBackground>
      <div className="min-h-screen bg-gray-900 text-white">
        <Hero />
        <Features />
        <TechStack />
        <Testimonials />
        <CallToAction />
        <Footer />
      </div>
    </AnimatedBackground>
  );
};

export default Index;
