import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ProjectGallery from "@/components/ProjectGallery";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <HeroSection />
        <ProjectGallery />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
