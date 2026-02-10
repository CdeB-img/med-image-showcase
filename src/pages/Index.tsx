import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

/* ============================================================
   HOME / INDEX
============================================================ */

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">

        {/* ================= HERO ================= */}
        <HeroSection />

        {/* ================= AXES D’EXPERTISE ================= */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto space-y-16">

            {/* Intro */}
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                Axes d’expertise
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Approches méthodologiques en imagerie médicale, adaptées aux
                contraintes cliniques et de recherche.
              </p>
            </div>

            {/* Axes */}
            <div className="grid gap-10 md:grid-cols-3">
              <div className="rounded-xl border border-border/50 bg-muted/20 p-8 space-y-4">
                <h3 className="text-xl font-semibold">
                  Segmentation & analyse lésionnelle
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Segmentation guidée par le signal, validation experte et
                  contrôle physiopathologique sur données CT et IRM réelles.
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-muted/20 p-8 space-y-4">
                <h3 className="text-xl font-semibold">
                  Quantification & analyse fonctionnelle
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Extraction de biomarqueurs quantitatifs robustes et
                  reproductibles à partir de données multimodales.
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-muted/20 p-8 space-y-4">
                <h3 className="text-xl font-semibold">
                  Méthodologie & outils transverses
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Recalage multimodal, prototypage et outils indépendants des
                  solutions propriétaires.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center pt-12">
              <Link
                to="/projets"
                className="
                  inline-flex items-center justify-center
                  rounded-lg bg-primary px-8 py-4
                  text-primary-foreground font-medium
                  hover:bg-primary/90 transition
                "
              >
                Voir des exemples de projets & approches
              </Link>
            </div>
          </div>
        </section>

        {/* ================= ABOUT ================= */}
        <AboutSection />

      </main>

      <Footer />
    </div>
  );
};

export default Index;