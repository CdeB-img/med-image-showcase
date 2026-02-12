import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

/* ============================================================
   CONFIG
============================================================ */

const META_IMAGE =
  "https://noxia-imagerie.fr/og-image-2026.png";

/* ============================================================
   PAGE
============================================================ */

const Index = () => {
  return (
    <>
      <Helmet>
        <title>
          Consultant en imagerie médicale quantitative | Segmentation IRM & Analyse DICOM | NOXIA
        </title>

        <meta
          name="description"
          content="Consultant indépendant en imagerie médicale quantitative : segmentation IRM, analyse DICOM, quantification perfusion CT et développement de pipelines reproductibles pour la recherche clinique."
        />

        <link rel="canonical" href="https://noxia-imagerie.fr/" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              name: "NOXIA Imagerie",
              url: "https://noxia-imagerie.fr",
              description:
                "Consultant indépendant en imagerie médicale quantitative pour la recherche clinique.",
              serviceType: "MedicalImagingAnalysis",
              areaServed: "Europe"
            })
          }}
        />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1">

          {/* HERO (doit contenir le H1 principal) */}
          <HeroSection />

          {/* SECTION INTRODUCTION */}
          <section className="max-w-4xl mx-auto py-16 px-4">
            <h2 className="text-2xl font-semibold mb-6">
              Consultant en imagerie médicale quantitative
            </h2>

            <p className="text-muted-foreground leading-relaxed">
              NOXIA intervient comme consultant indépendant spécialisé en
              segmentation IRM, analyse DICOM, quantification de perfusion CT
              et structuration de pipelines méthodologiques reproductibles
              appliqués à la recherche clinique.
            </p>

            <p className="text-muted-foreground leading-relaxed mt-4">
              Expertise en extraction de biomarqueurs, validation physiopathologique,
              recalage multimodal longitudinal et harmonisation de bases de données
              DICOM pour études translationnelles multicentriques.
            </p>
          </section>

          {/* BLOC SEO DISCRET */}
          <section className="sr-only">
            <h2>
              Analyse DICOM, segmentation IRM et quantification CT en recherche clinique
            </h2>
            <p>
              Consultant en analyse DICOM, structuration de bases d’images médicales,
              normalisation de pipelines IRM et CT, segmentation lésionnelle,
              quantification perfusion et validation méthodologique en recherche clinique.
            </p>
          </section>

          {/* SECTION PROJETS */}
          <section className="py-24 px-4">
            <div className="max-w-6xl mx-auto space-y-12">

              <Link
                to="/projets"
                className="block group rounded-2xl overflow-hidden border border-border/40 bg-black transition hover:border-primary/40 hover:shadow-xl"
              >
                <div className="aspect-[21/9] overflow-hidden">
                  <img
                    src={META_IMAGE}
                    alt="Segmentation IRM, quantification CT et analyse DICOM en recherche clinique"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>

                <div className="bg-background p-8 sm:p-10">
                  <h2 className="text-3xl font-semibold tracking-tight">
                    Projets & expertises en imagerie médicale
                  </h2>

                  <p className="mt-4 text-lg text-muted-foreground max-w-4xl">
                    Segmentation IRM cérébrale et cardiaque, quantification CT,
                    recalage multimodal longitudinal et développement d’outils
                    méthodologiques robustes pour la recherche clinique.
                  </p>

                  <div className="mt-6 text-primary font-medium">
                    Voir les projets →
                  </div>
                </div>
              </Link>

              {/* DOMAINES D'EXPERTISE */}
              <div className="grid gap-8 md:grid-cols-3 pt-6">

                <div className="rounded-xl border border-border/50 bg-muted/20 p-6">
                  <h3 className="font-semibold text-lg mb-2">
                    Segmentation IRM
                  </h3>
                  <p className="text-muted-foreground">
                    Segmentation lésionnelle cérébrale et tumorale,
                    extraction quantitative et validation méthodologique.
                  </p>
                </div>

                <div className="rounded-xl border border-border/50 bg-muted/20 p-6">
                  <h3 className="font-semibold text-lg mb-2">
                    Analyse DICOM & Structuration
                  </h3>
                  <p className="text-muted-foreground">
                    Normalisation, harmonisation multicentrique et
                    structuration de bases d’images cliniques.
                  </p>
                </div>

                <div className="rounded-xl border border-border/50 bg-muted/20 p-6">
                  <h3 className="font-semibold text-lg mb-2">
                    Quantification CT & Perfusion
                  </h3>
                  <p className="text-muted-foreground">
                    Extraction de biomarqueurs fonctionnels et
                    quantification robuste en imagerie de perfusion.
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