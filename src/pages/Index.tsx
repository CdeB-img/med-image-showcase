import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">

        <HeroSection />

        {/* AXES + CTA */}
        <section className="py-24 px-4">
          <div className="max-w-5xl mx-auto space-y-16 text-center">

            <h2 className="text-3xl font-semibold tracking-tight">
              Expertises en imagerie médicale
            </h2>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Approches méthodologiques en imagerie CT et IRM, adaptées aux
              contraintes cliniques et de recherche.
            </p>

            <div className="grid gap-8 md:grid-cols-3 text-left">
              <div className="rounded-xl border border-border/50 bg-muted/20 p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Segmentation & analyse lésionnelle
                </h3>
                <p className="text-muted-foreground">
                  Segmentation guidée par le signal et validation experte.
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-muted/20 p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Quantification fonctionnelle
                </h3>
                <p className="text-muted-foreground">
                  Extraction de biomarqueurs quantitatifs robustes.
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-muted/20 p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Méthodologie & outils
                </h3>
                <p className="text-muted-foreground">
                  Recalage, prototypage et outils indépendants.
                </p>
              </div>
            </div>

            <Link
              to="/projets"
              className="inline-block mt-8 rounded-lg bg-primary px-8 py-4 text-primary-foreground font-medium hover:bg-primary/90 transition"
            >
              Voir des exemples de projets
            </Link>

          </div>
        </section>

        <AboutSection />

      </main>

      <Footer />
    </div>
  );
};

export default Index;