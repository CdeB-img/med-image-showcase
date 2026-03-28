import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import ExpertiseHero from "@/components/ExpertiseHero";
import {
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Atom,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Brain,
  Database,
  Workflow,
  Layers,
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/ct-quantitatif-avance-imagerie-spectrale";

const FAQ_ITEMS = [
  {
    question: "Les unités Hounsfield sont-elles comparables entre centres ?",
    answer:
      "Pas directement. Les valeurs HU varient selon le constructeur, le kernel, l’algorithme itératif et l’énergie effective. En pratique, des écarts de plusieurs HU à parfois plus d’une dizaine de HU peuvent être observés si la chaîne n’est pas harmonisée.",
  },
  {
    question: "L’imagerie spectrale améliore-t-elle réellement la quantification ?",
    answer:
      "Oui, mais pas automatiquement. Le spectral améliore la séparation matière et peut renforcer le contraste utile, à condition de contrôler les reconstructions, la calibration énergétique et la reproductibilité inter-systèmes.",
  },
  {
    question: "Pourquoi une calibration phantom reste-t-elle nécessaire ?",
    answer:
      "Parce qu’elle fournit un repère physique indépendant de l’image patient. Elle permet d’objectiver les dérives instrumentales et de limiter les biais systématiques avant extraction d’un biomarqueur.",
  },
  {
    question: "Quelle est la variabilité inter-constructeur en CT quantitatif ?",
    answer:
      "Sans harmonisation explicite, la variabilité technique inter-vendor peut dépasser l’effet biologique recherché. C’est particulièrement vrai quand les reconstructions et les protocoles d’acquisition ne sont pas alignés.",
  },
  {
    question: "Les basses énergies (<70 keV) sont-elles toujours préférables ?",
    answer:
      "Non. Elles peuvent améliorer le contraste d’iode, mais augmentent aussi la sensibilité au bruit et à la reconstruction. Leur usage doit être validé selon l’indication, le patient et le pipeline de post-traitement.",
  },
  {
    question: "Améliorer le contraste visuel suffit-il pour valider un biomarqueur ?",
    answer:
      "Non. Un meilleur contraste ne garantit pas la validité quantitative. La robustesse d’un biomarqueur repose sur la traçabilité, la calibration, les contrôles QA et la stabilité inter-centre.",
  },
];

const CTQuantitatifAvance = () => {
  const medicalWebPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "CT quantitatif avancé et imagerie spectrale",
    description:
      "Approche méthodologique du CT spectral : décomposition physique, calibration phantom, validation indépendante, harmonisation multicentrique et extraction de biomarqueurs reproductibles.",
    about: [
      "Spectral CT",
      "Dual-energy CT",
      "Photon-counting CT",
      "Monoenergetic imaging",
      "Material decomposition",
      "Hounsfield unit variability",
      "Phantom calibration",
      "Quantitative imaging biomarkers",
      "Multicenter harmonization",
      "Clinical trial imaging",
    ],
    specialty: [
      "Radiology",
      "Medical physics",
      "Quantitative imaging biomarkers",
      "Clinical research imaging",
    ],
    medicalAudience: {
      "@type": "MedicalAudience",
      audienceType: "Healthcare professionals and clinical researchers",
    },
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr",
    },
    url: CANONICAL,
  };

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "CT quantitatif avancé et imagerie spectrale",
    serviceType: [
      "Audit DICOM spectral",
      "Calibration phantom et contrôle énergétique",
      "Validation indépendante de biomarqueurs CT",
      "Harmonisation inter-constructeurs",
      "Structuration multicentrique des données CT",
    ],
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr",
    },
    areaServed: "Europe",
    url: CANONICAL,
    description:
      "Conception et validation de pipelines CT quantitatifs avancés pour produire des mesures traçables, comparables entre centres et défendables scientifiquement.",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Expertise", item: "https://noxia-imagerie.fr/expertise" },
      { "@type": "ListItem", position: 3, name: "CT spectral avancé", item: CANONICAL },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <Helmet>
        <title>CT spectral avancé: décomposition et validation physique | NOXIA</title>
        <meta
          name="description"
          content="CT spectral avancé et double énergie: décomposition matière, calibration phantom et validation multicentrique pour des biomarqueurs CT robustes."
        />
        <link rel="canonical" href={CANONICAL} />
        <script type="application/ld+json">{JSON.stringify(medicalWebPageJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(serviceJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-20">
            <Breadcrumb
              items={[
                { label: "Accueil", path: "/" },
                { label: "Expertise", path: "/expertise" },
                { label: "CT spectral avancé" },
              ]}
            />

            <ExpertiseHero
              badge="Physique du signal CT"
              badgeIcon={Atom}
              title="CT quantitatif avancé & imagerie spectrale"
              description="Structurer des mesures CT robustes au-delà du contraste visuel : décomposition physique, calibration indépendante et reproductibilité multicentrique."
              chips={["Spectral / dual-energy", "Calibration phantom", "Reproductibilité inter-vendor"]}
              actions={[
                { label: "Cadrer un protocole CT", to: "/contact", variant: "primary", icon: ArrowRight },
                { label: "Voir CT quantitatif", to: "/ct-imagerie-quantitative", variant: "secondary", icon: Database },
                { label: "Comparer DECT / conventionnel", to: "/scanner-double-energie", variant: "secondary", icon: Layers },
              ]}
            />

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Définition du CT spectral en quantification avancée
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Le CT spectral (scanner à double énergie) utilise plusieurs niveaux d’énergie pour différencier les matériaux et produire des reconstructions monoénergétiques. Son intérêt en quantification est d’améliorer l’interprétation physique des mesures, notamment pour l’iode et les tissus denses. Son intérêt dépend directement du cadre technique : sans calibration, contrôle de reconstruction et harmonisation inter-constructeurs, l’information énergétique peut devenir plus instable qu’interprétable.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Acronymes / definitions rapides</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm text-muted-foreground">
                <div>
                  <div className="font-semibold text-foreground">CT spectral</div>
                  <p>Acquisition multi-energie pour caracterisation matiere.</p>
                </div>
                <div>
                  <div className="font-semibold text-foreground">DECT</div>
                  <p>Dual-Energy CT, forme courante de scanner spectral.</p>
                </div>
                <div>
                  <div className="font-semibold text-foreground">keV</div>
                  <p>Niveau d'energie de reconstruction monoenergetique.</p>
                </div>
                <div>
                  <div className="font-semibold text-foreground">HU</div>
                  <p>Unite Hounsfield, dependante de la chaine technique.</p>
                </div>
                <div>
                  <div className="font-semibold text-foreground">Z effectif</div>
                  <p>Approximation de composition atomique utile en spectral.</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Workflow className="w-5 h-5 text-primary" />
                Positionnement en imagerie quantitative
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Cette page traite du passage d’une image CT « lisible » à un biomarqueur quantitativement
                défendable. En pratique, cela combine{" "}
                <Link to="/analyse-dicom" className="text-primary hover:underline">
                  audit DICOM
                </Link>
                , règles de calibration, contrôle de reconstruction et traçabilité pipeline, dans la continuité
                de l’
                <Link to="/ingenierie-imagerie-quantitative" className="text-primary hover:underline">
                  ingénierie quantitative
                </Link>{" "}
                et de l’
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  harmonisation multicentrique
                </Link>
                {" "}et cadre{" "}
                <Link to="/methodologie-imagerie-quantitative" className="text-primary hover:underline">
                  méthodologique
                </Link>
                .
              </p>

              <p className="text-muted-foreground leading-relaxed">
                Concrètement, la logique repose sur une séquence stricte : contrôler l’acquisition, vérifier la stabilité physique,
                puis valider la mesure avant d’interpréter un signal clinique. C’est cette séquence qui distingue
                un usage quantitatif robuste d’une simple amélioration de contraste.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="text-sm font-semibold text-foreground">Objectif</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Réduire la variance technique avant interprétation biologique.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="text-sm font-semibold text-foreground">Risque principal</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Confondre un effet constructeur/reconstruction avec un effet clinique.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="text-sm font-semibold text-foreground">Livrable attendu</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Valeurs comparables entre centres, documentées et auditables.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-foreground">
                Imagerie spectrale & décomposition physique
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Le spectral (dual-energy, multi-couches ou photon-counting selon systèmes) ouvre l’accès à des
                    variables plus proches de la composition tissulaire que la seule HU. C’est central en{" "}
                    <Link to="/quantification-ct" className="text-primary hover:underline">
                      quantification CT
                    </Link>
                    , mais dépend fortement de la chaîne de reconstruction.
                  </p>

                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      <span>Reconstructions monoénergétiques et sensibilité énergie-dépendante.</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      <span>Décomposition matière (iode, eau, calcium, densité électronique, Z effectif).</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      <span>Effets non négligeables du débruitage et des reconstructions itératives.</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-card/80 to-primary/5 p-6 space-y-4">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                    Point de vigilance
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Les reconstructions basses énergies (&lt;70 keV) peuvent augmenter le contraste utile mais aussi
                    la fragilité au bruit. Une amélioration visuelle n’est pas, à elle seule, une validation
                    quantitative.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    En contexte neurovasculaire, cette logique complète la{" "}
                    <Link to="/ct-perfusion-quantitative-avc" className="text-primary hover:underline">
                      CT perfusion quantitative
                    </Link>{" "}
                    et se discute en interface avec l’
                    <Link to="/irm-imagerie-quantitative" className="text-primary hover:underline">
                      IRM quantitative
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Spectral CT vs CT conventionnel
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <div className="font-semibold text-foreground">CT conventionnel</div>
                  <p className="text-sm text-muted-foreground">
                    Fournit principalement une densité apparente (HU) utile en clinique courante, mais limitée pour séparer proprement les effets matériau, énergie et reconstruction.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <div className="font-semibold text-foreground">CT spectral</div>
                  <p className="text-sm text-muted-foreground">
                    Ajoute une dimension énergétique qui facilite la décomposition matière et certaines quantifications, au prix d’une exigence plus forte en calibration et validation inter-centres.
                  </p>
                </div>
              </div>

              <p>
                En pratique, le spectral ne remplace pas la rigueur d’un pipeline: il l’exige davantage. Cette logique
                se rattache au socle{" "}
                <Link to="/ct-imagerie-quantitative" className="text-primary hover:underline">
                  CT quantitative
                </Link>
                , avec un comparatif dédié{" "}
                <Link to="/scanner-double-energie" className="text-primary hover:underline">
                  scanner double énergie vs conventionnel
                </Link>
                , le{" "}
                <Link to="/scanner-spectral-principe" className="text-primary hover:underline">
                  principe spectral
                </Link>
                {" "}et l’ouverture{" "}
                <Link to="/scanner-comptage-photon" className="text-primary hover:underline">
                  scanner à comptage photonique
                </Link>
                . Les mêmes exigences s’appliquent aux protocoles de{" "}
                <Link to="/ct-perfusion-quantitative-avc" className="text-primary hover:underline">
                  perfusion AVC
                </Link>.
              </p>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-foreground">
                Calibration phantom & validation indépendante
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-4">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Pourquoi calibrer
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    La calibration phantom fixe un repère externe à l’image patient. Elle permet d’identifier les
                    dérives instrumentales et de mesurer des biais stables ou dynamiques entre lots, scanners et
                    versions logicielles.
                  </p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                    <li>Contrôle périodique eau/air et inserts de référence.</li>
                    <li>Suivi longitudinal des dérives HU et des paramètres spectraux.</li>
                    <li>Critères d’acceptation/rejet documentés avant extraction biomarqueur.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-4">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Validation indépendante
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Un biomarqueur CT robuste doit être confronté à une validation indépendante (phantom,
                    reproductibilité test-retest, cohérence inter-centre), pas uniquement à une cohérence visuelle.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Les métadonnées critiques sont structurées via{" "}
                    <Link to="/analyse-dicom" className="text-primary hover:underline">
                      Analyse DICOM
                    </Link>{" "}
                    puis intégrées dans un cadre{" "}
                    <Link to="/bases-multicentriques" className="text-primary hover:underline">
                      multicentrique
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-foreground">
                Architecture d’un biomarqueur CT robuste
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-4">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Layers className="w-5 h-5 text-primary" />
                    Chaîne technique
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>1. Audit DICOM (acquisition, énergie, reconstruction, kernel).</li>
                    <li>2. Calibration phantom et contrôle de stabilité.</li>
                    <li>3. Segmentation/ROI reproductible et règles d’exclusion.</li>
                    <li>4. Extraction métrique versionnée et journalisée.</li>
                    <li>5. Contrôle statistique de robustesse inter-centre.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-4">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Database className="w-5 h-5 text-primary" />
                    Chaîne méthodologique
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    L’outil n’est qu’une partie du résultat. La valeur finale dépend d’un pipeline explicite,
                    reproductible et relisible, dans la continuité de l’
                    <Link to="/ingenierie-imagerie-quantitative" className="text-primary hover:underline">
                      ingénierie quantitative
                    </Link>
                    . La qualité des contours peut être outillée par les mêmes principes de contrôle que ceux décrits
                    en{" "}
                    <Link to="/segmentation-irm" className="text-primary hover:underline">
                      segmentation IRM
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-foreground">
                Applications cliniques et translationnelles
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Brain className="w-5 h-5 text-primary" />
                    Neurovasculaire
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Optimisation des biomarqueurs de perfusion et cohérence avec les stratégies de sélection en AVC.
                  </p>
                  <Link to="/ct-perfusion-quantitative-avc" className="text-primary text-sm hover:underline">
                    Voir CT perfusion AVC →
                  </Link>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Atom className="w-5 h-5 text-primary" />
                    Caractérisation matière
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Analyse iode/calcium, densité électronique et signatures spectrales dans des protocoles
                    quantitatifs.
                  </p>
                  <Link to="/quantification-ct" className="text-primary text-sm hover:underline">
                    Voir Quantification CT →
                  </Link>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Workflow className="w-5 h-5 text-primary" />
                    Multimodal & essais
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Intégration CT/IRM pour endpoints composites et protocoles translationnels multicentriques.
                  </p>
                  <Link to="/recalage-multimodal" className="text-primary text-sm hover:underline">
                    Voir Recalage multimodal →
                  </Link>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-5">
              <h2 className="text-2xl font-semibold text-foreground">
                Ce que cette mesure change en pratique clinique et en essai
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Affiner des comparaisons inter-groupes quand la variabilité technique est contrôlée.</li>
                <li>Documenter une composante matière/énergie plutôt qu’un simple contraste visuel.</li>
                <li>Rendre la mesure opposable via calibration, QA longitudinal et validation indépendante.</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-primary/20 bg-gradient-to-b from-card/80 to-primary/5 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <BarChart3 className="w-5 h-5 text-primary" />
                Données de la littérature (ordres de grandeur)
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Les amplitudes exactes dépendent des protocoles et des plateformes. Les points ci-dessous sont des
                repères pratiques, utiles pour cadrer un pipeline plutôt que pour imposer un seuil universel.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/60 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">Variabilité rapportée</h3>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                    <li>Écarts HU inter-systèmes de l’ordre de ±5 à ±15 HU selon contexte.</li>
                    <li>Différences supplémentaires possibles selon kernel et reconstruction itérative.</li>
                    <li>Instabilité plus marquée en basses énergies si le bruit n’est pas contrôlé.</li>
                    <li>En spectral, gains de contraste de l’ordre de plusieurs dizaines de pourcents selon l’indication.</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-card/60 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">Implications méthodologiques</h3>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                    <li>Comparer des chiffres bruts sans harmonisation expose à un biais technique.</li>
                    <li>La calibration phantom réduit les biais systématiques inter-vendor.</li>
                    <li>La reproductibilité doit être vérifiée par lot, centre et version logicielle.</li>
                    <li>La validité quantitative repose sur la chaîne complète, pas sur une seule carte.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-5">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <FileText className="w-5 h-5 text-primary" />
                Références & consensus
              </div>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li>Recommandations de sociétés savantes sur le CT spectral / dual-energy en pratique clinique.</li>
                <li>Cadres de calibration phantom et de contrôle qualité en physique médicale (AAPM/QIBA).</li>
                <li>Bonnes pratiques de reproductibilité des quantitative imaging biomarkers en multicentrique.</li>
                <li>Principes de traçabilité pipeline, auditabilité et validation inter-plateformes en recherche clinique.</li>
              </ul>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center text-foreground">
                Questions fréquentes – CT quantitatif avancé
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {FAQ_ITEMS.map((item) => (
                  <div key={item.question} className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                    <h3 className="font-semibold text-foreground">{item.question}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Pages associées</h2>
              <div className="flex flex-wrap gap-3">
                <Link to="/ct-imagerie-quantitative" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  CT imagerie quantitative <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/quantification-ct" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Quantification CT <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/scanner-double-energie" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Scanner double énergie <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/scanner-comptage-photon" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Scanner à comptage photonique <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/scanner-spectral-principe" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Principe scanner spectral <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/ct-perfusion-quantitative-avc" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  CT perfusion AVC <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/analyse-dicom" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Analyse DICOM <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/bases-multicentriques" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Bases multicentriques <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/ingenierie-imagerie-quantitative" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Ingénierie quantitative <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/recalage-multimodal" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Recalage multimodal <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/irm-imagerie-quantitative" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  IRM quantitative <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/segmentation-irm" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Segmentation IRM <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8 space-y-5">
              <h2 className="text-xl font-semibold text-foreground">Synthèse opérationnelle</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>La comparaison HU brute n’est pas suffisante pour un endpoint multicentrique.</li>
                <li>Le spectral est puissant, mais son interprétation doit rester physiquement validée.</li>
                <li>Calibration phantom + QA + traçabilité sont les prérequis d’un biomarqueur opposable.</li>
                <li>L’objectif est une mesure stable entre centres, pas seulement une image plus contrastée.</li>
              </ul>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
                >
                  Discuter d’un protocole CT spectral
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/ct-imagerie-quantitative"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-6 py-3 font-medium hover:bg-muted/40 transition"
                >
                  Revenir au pôle CT
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default CTQuantitatifAvance;
