import { useState } from "react";
import { Send, Mail, User, MessageSquare, Activity, Building, CheckCircle2, Briefcase, ScanLine, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Breadcrumb from "@/components/Breadcrumb";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { z } from "zod";

/* ============================================================
   CONFIG
============================================================ */

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mnjbalye";
const CANONICAL = "https://noxia-imagerie.fr/contact";

const PROJECT_TYPES = [
  "Audit méthodologique",
  "CoreLab externalisé",
  "Reprise d'étude",
  "Ingénierie pipeline",
  "Autre besoin",
];

const MODALITIES = ["IRM", "CT", "IRM + CT", "Autre"];

const PROJECT_STAGES = [
  "Exploration",
  "Etude en préparation",
  "Etude en cours",
  "Reprise / correction",
];

/* ============================================================
   VALIDATION
============================================================ */

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  organization: z.string().trim().max(255).optional(),
  projectType: z.string().trim().min(1).max(100),
  modality: z.string().trim().min(1).max(50),
  projectStage: z.string().trim().min(1).max(100),
  message: z.string().trim().min(10).max(2000),
  website: z.string().max(0).optional() // honeypot
});

/* ============================================================
   COMPONENT
============================================================ */

const Contact = () => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    projectType: "",
    modality: "",
    projectStage: "",
    message: "",
    website: "" // honeypot
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact consultant en imagerie médicale - NOXIA",
    url: CANONICAL,
    description:
      "Prise de contact avec un consultant indépendant en imagerie quantitative IRM et CT.",
    mainEntity: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "business",
        email: "contact@noxia-imagerie.fr",
        availableLanguage: ["fr"],
      },
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Contact", item: CANONICAL },
    ],
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = contactSchema.safeParse(formData);
    if (!validation.success) {
      const nextErrors = Object.fromEntries(
        Object.entries(validation.error.flatten().fieldErrors)
          .filter(([, value]) => value && value.length > 0)
          .map(([key, value]) => [key, value?.[0] ?? "Champ invalide"])
      );
      setErrors(nextErrors);
      toast({
        title: "Formulaire incomplet",
        description: "Merci de vérifier les champs saisis.",
        variant: "destructive"
      });
      return;
    }

    // honeypot anti-spam
    if (formData.website) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          organization: formData.organization,
          projectType: formData.projectType,
          modality: formData.modality,
          projectStage: formData.projectStage,
          message: formData.message,
          _subject: `Contact noxia-imagerie.fr – ${formData.name} (${formData.projectType})`
        })
      });

      if (!response.ok) throw new Error();

      toast({
        title: "Message envoyé",
        description: "Votre message a bien été transmis."
      });

      setFormData({
        name: "",
        email: "",
        organization: "",
        projectType: "",
        modality: "",
        projectStage: "",
        message: "",
        website: ""
      });

    } catch {
      toast({
        title: "Erreur",
        description: "Impossible d’envoyer le message.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact consultant indépendant en imagerie médicale | NOXIA</title>
        <meta
          name="description"
          content="Contact consultant indépendant en imagerie médicale quantitative : CoreLab IRM/CT, analyse DICOM, harmonisation multicentrique et ingénierie méthodologique."
        />
        <meta property="og:title" content="Contact consultant indépendant en imagerie médicale | NOXIA" />
        <meta
          property="og:description"
          content="Échange initial pour une mission de consulting en imagerie quantitative IRM et CT."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={CANONICAL} />
        <script type="application/ld+json">{JSON.stringify(contactJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-12">
            <Breadcrumb
              items={[
                { label: "Accueil", path: "/" },
                { label: "Contact" }
              ]}
            />

            <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-card to-muted/30 p-8 md:p-12 space-y-6">
              <div className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative text-center space-y-4">
                <Activity className="w-8 h-8 text-primary mx-auto" />
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  Contact professionnel
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  Contact direct avec un consultant indépendant en imagerie quantitative IRM et CT pour projets académiques, hospitaliers et industriels.
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  <span className="rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-foreground">
                    CoreLab & méthodologie
                  </span>
                  <span className="rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-foreground">
                    Analyse DICOM & multicentrique
                  </span>
                  <span className="rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-foreground">
                    IRM & CT
                  </span>
                </div>
              </div>
            </section>

            <section className="max-w-4xl mx-auto space-y-5">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground text-center">Offres cadrées</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <article className="rounded-xl border border-border bg-card/50 p-5 space-y-2">
                  <h3 className="font-semibold text-foreground">Audit méthodologique</h3>
                  <p className="text-sm text-muted-foreground">
                    Revue d'un pipeline existant, points de fragilité, priorisation des corrections.
                  </p>
                </article>
                <article className="rounded-xl border border-border bg-card/50 p-5 space-y-2">
                  <h3 className="font-semibold text-foreground">CoreLab externalisé</h3>
                  <p className="text-sm text-muted-foreground">
                    Structuration des lectures quantitatives IRM/CT pour étude mono ou multicentrique.
                  </p>
                </article>
                <article className="rounded-xl border border-border bg-card/50 p-5 space-y-2">
                  <h3 className="font-semibold text-foreground">Reprise d'étude</h3>
                  <p className="text-sm text-muted-foreground">
                    Remise à plat technique d'une base hétérogène avec traçabilité et livrables exploitables.
                  </p>
                </article>
              </div>
            </section>

            <section className="grid lg:grid-cols-[0.9fr,1.1fr] gap-6 lg:gap-8 items-stretch">
              <aside className="rounded-2xl border border-border bg-card/50 p-6 md:p-7 h-full flex flex-col space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">Informations utiles</h2>
                  <p className="text-sm text-muted-foreground">
                    Vous pouvez décrire ces éléments pour faciliter le cadrage de la demande.
                  </p>
                </div>

                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Contexte clinique ou scientifique du projet</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Modalités concernées (IRM, CT ou les deux)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Stade actuel (préparation, en cours, reprise)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Type d'accompagnement recherché</span>
                  </li>
                </ul>

                <div className="rounded-xl border border-border bg-background/70 p-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground">Types de demandes fréquentes</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Audit méthodologique d'un pipeline existant</li>
                    <li>• Reprise d'une base hétérogène multicentrique</li>
                    <li>• Structuration d'un CoreLab IRM/CT</li>
                    <li>• Définition d'endpoints quantitatifs</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-background/70 p-4 space-y-2 mt-auto">
                  <p className="text-sm font-semibold text-foreground">Contact direct</p>
                  <a
                    href={"mailto:" + "contact" + "@noxia-imagerie.fr"}
                    className="text-sm text-primary hover:underline underline-offset-4"
                  >
                    contact@noxia-imagerie.fr
                  </a>
                  <p className="text-xs text-muted-foreground">
                    Vos informations sont utilisées uniquement pour répondre à votre demande.
                  </p>
                </div>
              </aside>

              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm h-full">
                <form onSubmit={handleSubmit} className="h-full flex flex-col gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      <User className="w-4 h-4 inline mr-2" />
                      Nom
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Votre nom"
                      autoComplete="name"
                      required
                      aria-invalid={Boolean(errors.name)}
                      className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="vous@organisation.fr"
                      autoComplete="email"
                      required
                      aria-invalid={Boolean(errors.email)}
                      className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization">
                      <Building className="w-4 h-4 inline mr-2" />
                      Organisation (optionnel)
                    </Label>
                    <Input
                      id="organization"
                      name="organization"
                      value={formData.organization}
                      onChange={handleChange}
                      placeholder="CHU, CRO, entreprise, laboratoire"
                      autoComplete="organization"
                      aria-invalid={Boolean(errors.organization)}
                      className={errors.organization ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {errors.organization ? <p className="text-sm text-destructive">{errors.organization}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projectType">
                      <Briefcase className="w-4 h-4 inline mr-2" />
                      Type de besoin
                    </Label>
                    <select
                      id="projectType"
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                      required
                      aria-invalid={Boolean(errors.projectType)}
                      className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background ${
                        errors.projectType ? "border-destructive focus-visible:ring-destructive" : "border-input"
                      }`}
                    >
                      <option value="">Sélectionner</option>
                      {PROJECT_TYPES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                    {errors.projectType ? <p className="text-sm text-destructive">{errors.projectType}</p> : null}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="modality">
                        <ScanLine className="w-4 h-4 inline mr-2" />
                        Modalité
                      </Label>
                      <select
                        id="modality"
                        name="modality"
                        value={formData.modality}
                        onChange={handleChange}
                        required
                        aria-invalid={Boolean(errors.modality)}
                        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background ${
                          errors.modality ? "border-destructive focus-visible:ring-destructive" : "border-input"
                        }`}
                      >
                        <option value="">Sélectionner</option>
                        {MODALITIES.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                      {errors.modality ? <p className="text-sm text-destructive">{errors.modality}</p> : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="projectStage">
                        <GitBranch className="w-4 h-4 inline mr-2" />
                        Stade du projet
                      </Label>
                      <select
                        id="projectStage"
                        name="projectStage"
                        value={formData.projectStage}
                        onChange={handleChange}
                        required
                        aria-invalid={Boolean(errors.projectStage)}
                        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background ${
                          errors.projectStage ? "border-destructive focus-visible:ring-destructive" : "border-input"
                        }`}
                      >
                        <option value="">Sélectionner</option>
                        {PROJECT_STAGES.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                      {errors.projectStage ? <p className="text-sm text-destructive">{errors.projectStage}</p> : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">
                      <MessageSquare className="w-4 h-4 inline mr-2" />
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={8}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Objectif de l'étude, contraintes techniques, et livrable attendu."
                      required
                      aria-invalid={Boolean(errors.message)}
                      className={errors.message ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {errors.message ? <p className="text-sm text-destructive">{errors.message}</p> : null}
                  </div>

                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="website">Ne pas remplir</label>
                    <input
                      id="website"
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      autoComplete="off"
                      tabIndex={-1}
                    />
                  </div>

                  <div className="mt-auto">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-12"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Envoi en cours…" : (
                        <>
                          Envoyer le message
                          <Send className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Contact;
