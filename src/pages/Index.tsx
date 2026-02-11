import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

/* ============================================================
   CONFIG
============================================================ */

const META_IMAGE =
  "https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images/projets/meta.png";

/* ============================================================
   PAGE
============================================================ */

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">

        {/* ================= HERO ================= */}
        <HeroSection />

        {/* ================= PROJETS / TEASER ================= */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto space-y-12">

            {/* ---- Carte image cliquable ---- */}
            <Link
              to="/projets"
              className="
                block group
                rounded-2xl overflow-hidden
                border border-border/40
                bg-black
                transition
                hover:border-primary/40
                hover:shadow-xl
              "
            >
              {/* Image (pas de texte dessus) */}
              <div className="aspect-[21/9] bg-black flex items-center justify-center">
                <img
                  src={META_IMAGE}
                  alt="Projets et expertises en imagerie médicale"
                  className="
                    w-full h-full
                    object-contain
                    transition-transform duration-500
                    group-hover:scale-[1.01]
                  "
                />
              </div>

              {/* Texte sous l’image */}
              <div className="bg-background p-8 sm:p-10">
                <h2 className="text-3xl font-semibold tracking-tight">
                  Projets & expertises en imagerie médicale
                </h2>

                <p className="mt-4 text-lg text-muted-foreground max-w-4xl">
                  Exemples concrets de segmentation lésionnelle, quantification
                  fonctionnelle, recalage multimodal et outils méthodologiques
                  appliqués à l’imagerie CT et IRM.
                </p>

                <div className="mt-6 text-primary font-medium">
                  Voir les projets →
                </div>
              </div>
            </Link>

            {/* ---- Axes (texte uniquement, sobre) ---- */}
            <div className="grid gap-8 md:grid-cols-3 pt-6">

              <div className="rounded-xl border border-border/50 bg-muted/20 p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Segmentation lésionnelle
                </h3>
                <p className="text-muted-foreground">
                  Segmentation guidée par le signal, relecture experte et
                  validation sur données cliniques réelles.
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-muted/20 p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Quantification fonctionnelle
                </h3>
                <p className="text-muted-foreground">
                  Extraction de biomarqueurs quantitatifs robustes à partir
                  d’images CT et IRM multimodales.
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-muted/20 p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Méthodologie & recalage
                </h3>
                <p className="text-muted-foreground">
                  Recalage multimodal, prototypage et outils indépendants
                  des solutions propriétaires.
                </p>
              </div>

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