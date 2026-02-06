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

// Formspree endpoint - à remplacer par votre endpoint
const FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";

// Validation schema
const contactSchema = z.object({
  name: z.string().trim().min(1, {
    message: "Le nom est requis"
  }).max(100, {
    message: "Le nom doit contenir moins de 100 caractères"
  }),
  email: z.string().trim().email({
    message: "Adresse email invalide"
  }).max(255, {
    message: "L'email doit contenir moins de 255 caractères"
  }),
  message: z.string().trim().min(10, {
    message: "Le message doit contenir au moins 10 caractères"
  }).max(2000, {
    message: "Le message doit contenir moins de 2000 caractères"
  })
});

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

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
          message: formData.message
        })
      });

      if (!response.ok) {
        throw new Error("Form submission failed");
      }

      toast({
        title: "Message envoyé",
        description: "Votre message a bien été transmis."
      });

      setFormData({
        name: "",
        email: "",
        message: ""
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message. Veuillez réessayer plus tard.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />
          
          <div className="container relative z-10 px-4 md:px-6">
            {/* Back button */}
            <div className="mb-12">
              <Link to="/">
                <Button variant="ghost" className="gap-2 hover:bg-primary/10">
                  <ArrowLeft className="w-4 h-4" />
                  Accueil
                </Button>
              </Link>
            </div>

            <div className="max-w-3xl mx-auto">
              {/* Header */}
              <div className="text-center space-y-6 mb-16">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Activity className="w-8 h-8 text-primary" />
                  <span className="text-2xl font-bold tracking-tight text-primary">NOXIA</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  Contact professionnel
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  Ce formulaire permet de me contacter pour toute question, collaboration 
                  ou échange autour d'un projet en imagerie médicale.
                </p>
                <p className="text-sm text-muted-foreground">
                  Les messages sont transmis directement et traités de manière confidentielle.
                </p>
              </div>

              {/* Contact Form Card */}
              <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-lg">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Name */}
                  <div className="space-y-3">
                    <Label htmlFor="name" className="flex items-center gap-2 text-base font-medium">
                      <User className="w-5 h-5 text-primary" />
                      Nom
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Votre nom"
                      value={formData.name}
                      onChange={handleChange}
                      className={`h-12 text-base ${errors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive font-medium">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-3">
                    <Label htmlFor="email" className="flex items-center gap-2 text-base font-medium">
                      <Mail className="w-5 h-5 text-primary" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={`h-12 text-base ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive font-medium">{errors.email}</p>
                    )}
                  </div>

                  {/* Message */}
                  <div className="space-y-3">
                    <Label htmlFor="message" className="flex items-center gap-2 text-base font-medium">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Décrivez votre projet ou votre demande..."
                      rows={8}
                      value={formData.message}
                      onChange={handleChange}
                      className={`text-base resize-none ${errors.message ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive font-medium">{errors.message}</p>
                    )}
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-14 text-lg font-semibold group"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Envoi en cours...
                      </span>
                    ) : (
                      <>
                        Envoyer le message
                        <Send className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* Privacy notice */}
              <div className="mt-8 text-center p-6 rounded-xl bg-secondary/30 border border-border">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Les informations transmises via ce formulaire sont utilisées exclusivement
                  pour répondre à votre demande et ne sont ni stockées ni partagées.
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