import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const META_IMAGE =
  "https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images/projets/meta.png";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">

        {/* HERO */}
        <HeroSection />

        {/* ================= META PROJETS ================= */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto space-y-10">

            {/* Image + overlay */}
            <div
              className="
                relative overflow-hidden rounded-2xl
                border border-border/40
                aspect-[21/9]
                bg-black
              "
            >
              <img
                src={META_IMAGE}
                alt="Projets et expertises en imagerie médicale"
                className="
                  absolute inset-0
                  w-full h-full
                  object-contain
                  bg-black
                "
              />

              {/* Overlay lisible */}
              <div
                className="
                  absolute inset-0
                  bg-gradient-to-t
                  from-black/70 via-black/30 to-transparent
                "
              />

              {/* Texte dans l’image */}
              <div
                className="
                  relative z-10
                  h-full
                  flex flex-col justify-end
                  p-8 sm:p-12
                  max-w-3xl
                "
              >
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Projets & expertises
                </h2>

                <p className="mt-4 text-lg text-muted-foreground">
                  Exemples concrets de segmentation, quantification,
                  recalage multimodal et outils méthodologiques appliqués
                  à l’imagerie CT et IRM.
                </p>

                <Link
                  to="/projets"
                  className="
                    mt-6 inline-flex items-center gap-2
                    text-primary font-medium
                    hover:underline underline-offset-4
                  "
                >
                  Voir les projets →
                </Link>
              </div>
            </div>

            {/* Résumé en dessous (non superposé) */}
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-xl border border-border/50 bg-muted/20 p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Segmentation lésionnelle
                </h3>
                <p className="text-muted-foreground">
                  Segmentation guidée par le signal, relecture experte
                  et validation sur données cliniques réelles.
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-muted/20 p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Quantification fonctionnelle
                </h3>
                <p className="text-muted-foreground">
                  Extraction de biomarqueurs quantitatifs robustes
                  à partir d’images CT et IRM multimodales.
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-muted/20 p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Méthodologie & recalage
                </h3>
                <p className="text-muted-foreground">
                  Recalage multimodal, prototypage et outils
                  indépendants des solutions propriétaires.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ABOUT */}
        <AboutSection />

      </main>

      <Footer />
    </div>
  );
};

export default Index;