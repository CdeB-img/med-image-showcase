import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, Mail, User, MessageSquare, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";
import { z } from "zod";

/* ============================================================
   CONFIG
============================================================ */

//  URL fournie par Formspree
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mnjbalye";

/* ============================================================
   VALIDATION
============================================================ */

const contactSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(100),
  email: z.string().trim().email("Adresse email invalide").max(255),
  message: z.string().trim().min(10, "Le message doit contenir au moins 10 caractères").max(2000)
});

/* ============================================================
   COMPONENT
============================================================ */

const Contact = () => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = contactSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("email", formData.email);
      form.append("message", formData.message);
      form.append("_subject", `Contact noxia-imagerie.fr – ${formData.name}`);
      form.append("_gotcha", "");

      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: form,
        headers: {
          Accept: "application/json"
        }
      });

      // ✅ Formspree SUCCESS = HTTP 2xx
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      toast({
        title: "Message envoyé",
        description: "Votre message a bien été transmis."
      });

      setFormData({ name: "", email: "", message: "" });

    } catch (error) {
      console.error("Formspree error:", error);

      toast({
        title: "Erreur",
        description: "Impossible d’envoyer le message. Merci de réessayer plus tard.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">

        {/* ================= HERO ================= */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

          <div className="container relative z-10 px-4 md:px-6">

            {/* Back */}
            <div className="mb-12">
              <Link to="/">
                <Button variant="ghost" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Accueil
                </Button>
              </Link>
            </div>

            <div className="max-w-3xl mx-auto">

              {/* Header */}
              <div className="text-center space-y-6 mb-16">
                <div className="flex items-center justify-center gap-3">
                  <Activity className="w-8 h-8 text-primary" />
                  <span className="text-2xl font-bold text-primary">
                    NOXIA Imagerie
                  </span>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold">
                  Contact professionnel
                </h1>

                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  Pour toute question, collaboration ou échange autour d’un projet
                  en imagerie médicale.
                </p>

                <p className="text-sm text-muted-foreground">
                  contact@noxia-imagerie.fr
                </p>
              </div>

              {/* ================= FORM ================= */}
              <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-lg">
                <form onSubmit={handleSubmit} className="space-y-8">

                  {/* Name */}
                  <div className="space-y-3">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Nom
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-3">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-primary" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  {/* Message */}
                  <div className="space-y-3">
                    <Label htmlFor="message" className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={8}
                      value={formData.message}
                      onChange={handleChange}
                      className={errors.message ? "border-destructive" : ""}
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive">{errors.message}</p>
                    )}
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-14 text-lg font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Envoi en cours…" : (
                      <>
                        Envoyer le message
                        <Send className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>

                </form>
              </div>

              {/* ================= FOOT NOTE ================= */}
              <div className="mt-8 text-center p-6 rounded-xl bg-secondary/30 border border-border">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Les informations transmises via ce formulaire sont utilisées
                  exclusivement pour répondre à votre demande.
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;