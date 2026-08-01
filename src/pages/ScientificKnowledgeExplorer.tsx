import { Helmet } from "react-helmet-async";
import Breadcrumb from "@/components/Breadcrumb";
import Footer from "@/components/Footer";
import ScientificExplorer from "@/features/scientific-explorer/ScientificExplorer";

const CANONICAL = "https://noxia-imagerie.fr/connaissances/";

const ScientificKnowledgeExplorer = () => (
  <>
    <Helmet>
      <title>Explorateur de connaissances scientifiques | NOXIA</title>
      <meta
        name="description"
        content="Comprendre et évaluer la segmentation en imagerie médicale : concepts, métriques, limites et justifications scientifiques issues du corpus structuré NOXIA."
      />
      <meta name="robots" content="noindex, follow" />
      <meta name="googlebot" content="noindex, follow" />
      <link rel="canonical" href={CANONICAL} />
    </Helmet>

    <div className="min-h-screen bg-background">
      <main className="px-4 pb-20 pt-24 sm:px-6 sm:pb-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Breadcrumb
            items={[
              { label: "Accueil", path: "/" },
              { label: "Expertise", path: "/expertise" },
              { label: "Explorer les connaissances" },
            ]}
          />
          <ScientificExplorer />
        </div>
      </main>
      <Footer />
    </div>
  </>
);

export default ScientificKnowledgeExplorer;
