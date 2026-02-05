import { ArrowRight, Brain, Activity, Database, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />

      <div className="container relative z-10 px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-8 animate-fade-in">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <Activity className="w-10 h-10 text-primary md:w-[55px] md:h-[55px]" />
            <span className="text-3xl font-bold tracking-tight text-primary text-glow md:text-5xl">
              NOXIA
            </span>
            <Activity className="w-10 h-10 text-primary md:w-[55px] md:h-[55px]" />
          </div>

          {/* Main heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl">
            Expert en{" "}
            <span className="text-primary text-glow">Imagerie Médicale</span>{" "}
            pour la Recherche
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Prestataire indépendant spécialisé dans le traitement et l’analyse d’images médicales.
            Segmentation, quantification et solutions sur mesure pour la recherche clinique.
          </p>

          {/* CTA */}
          <Link to="/projets">
            <Button size="lg" className="group glow-primary">
              Découvrir mes projets
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>

          {/* Engineer credibility line */}
          <p className="text-sm md:text-base text-muted-foreground max-w-xl italic">
            Ingénieur en imagerie médicale, avec une maîtrise de la chaîne d’analyse,
            du signal brut aux biomarqueurs exploitables, pour des résultats interprétables,
            traçables et reproductibles.
          </p>

          {/* Icon cluster — déplacé plus bas */}
          <div className="flex items-center gap-4 text-primary pt-10">
            <Brain className="w-8 h-8 md:w-10 md:h-10" />
            <Database className="w-7 h-7 md:w-9 md:h-9" />
            <Heart className="w-8 h-8 md:w-10 md:h-10" />
          </div>

          {/* Tech badges */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {[
              "Python",
              "NumPy",
              "SciPy",
              "NiBabel",
              "SimpleITK",
              "ANTsPy",
              "pydicom",
              "PyTorch",
              "MONAI",
              "3D Slicer",
              "OsiriX",
            ].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 text-sm font-mono bg-secondary/50 border border-border rounded-full text-muted-foreground"
              >
                {tech}
              </span>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;