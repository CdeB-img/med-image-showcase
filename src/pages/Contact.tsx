import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, Mail, User, MessageSquare, Activity, Building } from "lucide-react";
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

/* ============================================================
   VALIDATION
============================================================ */

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  organization: z.string().trim().max(255).optional(),
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
    message: "",
    website: "" // honeypot
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = contactSchema.safeParse(formData);
    if (!validation.success) {
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
          message: formData.message,
          _subject: `Contact noxia-imagerie.fr – ${formData.name}`
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
        <title>Contact professionnel | NOXIA Imagerie</title>
        <meta
          name="description"
          content="Contact professionnel pour collaboration en imagerie médicale quantitative : segmentation IRM, analyse DICOM, quantification CT."
        />
        <meta property="og:title" content="Contact professionnel | NOXIA Imagerie" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://noxia-imagerie.fr/contact" />
        
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <main className="flex-1">

          <section className="relative py-20 md:py-28">
            <div className="container px-4 md:px-6">
              <Breadcrumb
                items={[
                  { label: "Accueil", path: "/" },
                  { label: "Contact" }
                ]}
              />

              <div className="mb-12">
                <Link to="/">
                  <Button variant="ghost" className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Accueil
                  </Button>
                </Link>
              </div>

              <div className="max-w-3xl mx-auto text-center space-y-6 mb-16">
                <Activity className="w-8 h-8 text-primary mx-auto" />
                <h1 className="text-4xl md:text-5xl font-bold">
                  Contact professionnel
                </h1>
                <p className="text-muted-foreground">
                  Collaboration CHU, CRO, industrie ou projet académique.
                </p>

                <p className="text-sm text-muted-foreground mt-2">
                  Contact direct :{" "}
                  <a
                    href={"mailto:" + "contact" + "@noxia-imagerie.fr"}
                    className="text-primary hover:underline underline-offset-4"
                  >
                    contact@noxia-imagerie.fr
                  </a>
                </p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-lg max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-8">

                  {/* NOM */}
                  <div className="space-y-3">
                    <Label htmlFor="name">
                      <User className="w-4 h-4 inline mr-2" />
                      Nom
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>

                  {/* EMAIL */}
                  <div className="space-y-3">
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
                    />
                  </div>

                  {/* ORGANISATION */}
                  <div className="space-y-3">
                    <Label htmlFor="organization">
                      <Building className="w-4 h-4 inline mr-2" />
                      Organisation (CHU, entreprise, laboratoire)
                    </Label>
                    <Input
                      id="organization"
                      name="organization"
                      value={formData.organization}
                      onChange={handleChange}
                    />
                  </div>

                  {/* MESSAGE */}
                  <div className="space-y-3">
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
                    />
                  </div>

                  {/* Honeypot invisible */}
                  <div style={{ display: "none" }}>
                    <label>Ne pas remplir</label>
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      autoComplete="off"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-14"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Envoi en cours…" : (
                      <>
                        Envoyer
                        <Send className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>

                </form>
              </div>

            </div>
          </section>

        </main>

        <Footer />
      </div>
    </>
  );
};

export default Contact;
