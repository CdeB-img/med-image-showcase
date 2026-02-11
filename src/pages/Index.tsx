import { Link } from "react-router-dom";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">

        {/* ================= HERO ================= */}
        <HeroSection />

        {/* ================= EXPERTISES ================= */}
        <section className="py-24 px-4">
          <div className="max-w-5xl mx-auto space-y-16 text-center">

            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                Expertises en imagerie médicale
              </h2>

              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Approches méthodologiques en imagerie CT et IRM, adaptées aux
                contraintes cliniques, translationnelles et de recherche.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 text-left">
              <div className="rounded-xl border border-border/50 bg-muted/20 p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Segmentation & analyse lésionnelle
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Segmentation guidée par le signal, relecture experte et
                  validation sur données cliniques réelles.
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-muted/20 p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Quantification fonctionnelle
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Extraction de biomarqueurs quantitatifs robustes à partir
                  d’images CT et IRM multimodales.
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-muted/20 p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Méthodologie & outils
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Recalage multimodal, prototypage et outils indépendants des
                  solutions propriétaires.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= META PROJETS (IMAGE CTA) ================= */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <Link
              to="/projets"
              className="group block relative overflow-hidden rounded-2xl border border-border/40"
            >
              <img
                src="https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images/projets/meta.png"
                alt="Aperçu des projets et expertises en imagerie médicale"
                className="
                  w-full h-[280px] sm:h-[360px]
                  object-cover
                  transition-transform duration-500
                  group-hover:scale-[1.02]
                "
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

              {/* Texte */}
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="text-2xl sm:text-3xl font-semibold text-white">
                  Projets & expertises
                </h2>

                <p className="mt-2 text-white/80 max-w-2xl leading-relaxed">
                  Exemples concrets de segmentation, quantification,
                  recalage et outils méthodologiques appliqués à l’imagerie
                  médicale.
                </p>

                <span className="inline-block mt-4 text-primary font-medium">
                  Voir les projets →
                </span>
              </div>
            </Link>
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