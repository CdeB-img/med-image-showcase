import { Helmet } from "react-helmet-async";
import Footer from "@/components/Footer";

const SegmentationIRM = () => {
  return (
    <>
      <Helmet>
        <title>Segmentation IRM en recherche clinique | NOXIA</title>
        <meta
          name="description"
          content="Segmentation IRM cérébrale et cardiaque en contexte clinique et multicentrique. Approche signal-driven, validation physiopathologique et reproductibilité méthodologique."
        />
        <link rel="canonical" href="https://noxia-imagerie.fr/segmentation-irm" />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-24 px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-4xl font-bold tracking-tight">
              Segmentation IRM en recherche clinique
            </h1>

            <p className="text-muted-foreground text-lg">
              Page en construction.
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default SegmentationIRM;