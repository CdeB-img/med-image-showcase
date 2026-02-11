import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

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
    <>
      <Helmet>
        <title>
          Expert en imagerie médicale quantitative | NOXIA
        </title>

        <meta
          name="description"
          content="Expert indépendant en imagerie médicale quantitative. Segmentation IRM, analyse CT, quantification de biomarqueurs, traitement DICOM et méthodologie signal-driven pour la recherche clinique."
        />

        <link
          rel="canonical"
          href="https://noxia-imagerie.fr/"
        />

        {/* Données structurées */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            name: "NOXIA Imagerie",
            url: "https://noxia-imagerie.fr",
            description:
              "Expertise indépendante en imagerie médicale quantitative pour la recherche clinique.",
            serviceType: "Medical Imaging Analysis",
            areaServed: "Europe"
          })}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1">

          <HeroSection />

          <section className="py-24 px-4">
            <div className="max-w-6xl mx-auto space-y-12">

              <Link
                to="/projets"
                className="block group rounded-2xl overflow-hidden border border-border/40 bg-black transition hover:border-primary/40 hover:shadow-xl"
              >
                <div className="aspect-[21/9] overflow-hidden">
                  <img
                    src={META_IMAGE}
                    alt="Segmentation et quantification en imagerie médicale CT et IRM"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>

                <div className="bg-background p-8 sm:p-10">
                  <h2 className="text-3xl font-semibold tracking-tight">
                    Projets & expertises en imagerie médicale
                  </h2>

                  <p className="mt-4 text-lg text-muted-foreground max-w-4xl">
                    Segmentation lésionnelle IRM, quantification CT,
                    recalage multimodal et développement d’outils
                    méthodologiques pour la recherche clinique.
                  </p>

                  <div className="mt-6 text-primary font-medium">
                    Voir les projets →
                  </div>
                </div>
              </Link>

              <div className="grid gap-8 md:grid-cols-3 pt-6">

                <div className="rounded-xl border border-border/50 bg-muted/20 p-6">
                  <h3 className="font-semibold text-lg mb-2">
                    Segmentation IRM
                  </h3>
                  <p className="text-muted-foreground">
                    Approches signal-driven pour la segmentation
                    lésionnelle cérébrale et tumorale.
                  </p>
                </div>

                <div className="rounded-xl border border-border/50 bg-muted/20 p-6">
                  <h3 className="font-semibold text-lg mb-2">
                    Quantification CT
                  </h3>
                  <p className="text-muted-foreground">
                    Extraction robuste de biomarqueurs
                    morphologiques et fonctionnels.
                  </p>
                </div>

                <div className="rounded-xl border border-border/50 bg-muted/20 p-6">
                  <h3 className="font-semibold text-lg mb-2">
                    Recalage multimodal
                  </h3>
                  <p className="text-muted-foreground">
                    Alignement CT / IRM longitudinal
                    pour analyse quantitative fiable.
                  </p>
                </div>

              </div>
            </div>
          </section>

          <AboutSection />

        </main>

        <Footer />
      </div>
    </>
  );
};

export default Index;