import {
  ArrowRight,
  Brain,
  Activity,
  Database,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/* ============================================================
   Technologies → projets (quand démontrables)
============================================================ */

const TECH_WITH_PROJECT: Record<string, string> = {
  Python: "/projets",
  SimpleITK: "/projet/perfusion-segmentation",
  ANTsPy: "/projet/recalage",
  NiBabel: "/projet/neuro-onco",
  pydicom: "/projet/outils",
};

/* ============================================================
   Descriptions (quand pas de lien projet)
============================================================ */

const TECH_DESCRIPTIONS: Record<string, string> = {
  NumPy:
    "Calcul scientifique et manipulation de volumes multidimensionnels pour l’analyse quantitative.",
  SciPy:
    "Traitement du signal, filtrage et opérations numériques avancées appliquées aux données médicales.",
  PyTorch:
    "Prototypage algorithmique et validation méthodologique en segmentation médicale.",
  MONAI:
    "Framework IA médical utilisé dans une approche contrôlée et interprétable.",
  "3D Slicer":
    "Visualisation avancée et validation experte des résultats de segmentation.",
  OsiriX:
    "Inspection DICOM et structuration de bases d’images cliniques.",
};

/* ============================================================
   Hero Section
============================================================ */

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />

      <div className="container relative z-10 px-4 md:px-6 py-24">
        <div className="flex flex-col items-center text-center space-y-8">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <Activity className="w-10 h-10 md:w-[55px] md:h-[55px] text-primary" />
            <span className="text-3xl md:text-5xl font-bold tracking-tight text-primary">
              NOXIA
            </span>
            <Activity className="w-10 h-10 md:w-[55px] md:h-[55px] text-primary scale-x-[-1]" />
          </div>

          {/* H1 STRATÉGIQUE */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl">
            Consultant en <span className="text-primary">imagerie médicale quantitative</span>
            <br />
            pour la recherche clinique
          </h1>

          {/* Sous-titre enrichi SEO */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Segmentation IRM, analyse DICOM, quantification CT et
            structuration de bases multicentriques.
            Développement d’outils méthodologiques reproductibles
            pour projets hospitaliers et études translationnelles.
          </p>

          {/* CTA */}
          <Link to="/projets">
            <Button size="lg" className="group">
              Voir les projets
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>

          {/* Crédibilité technique */}
          <p className="text-sm md:text-base text-muted-foreground max-w-xl italic">
            Approche signal-driven, validation physiopathologique
            et séparation rigoureuse entre segmentation,
            visualisation et quantification.
          </p>

          {/* Icon cluster */}
          <div className="flex items-center gap-4 text-primary pt-6">
            <Brain className="w-8 h-8 md:w-10 md:h-10" />
            <Database className="w-7 h-7 md:w-9 md:h-9" />
            <Heart className="w-8 h-8 md:w-10 md:h-10" />
          </div>

          {/* Tech stack */}
          <div className="flex flex-wrap justify-center gap-3 pt-8">

            {Object.entries(TECH_WITH_PROJECT).map(([tech, path]) => (
              <Link
                key={tech}
                to={path}
                className="px-3 py-1 text-sm font-mono bg-primary/10 text-primary border border-primary/30 rounded-full hover:bg-primary/20 transition-colors"
              >
                {tech}
              </Link>
            ))}

            {Object.entries(TECH_DESCRIPTIONS).map(([tech, description]) => (
              <Popover key={tech}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="px-3 py-1 text-sm font-mono bg-secondary/50 border border-border rounded-full text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    {tech}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="max-w-xs text-sm text-muted-foreground leading-relaxed">
                  {description}
                </PopoverContent>
              </Popover>
            ))}

          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;