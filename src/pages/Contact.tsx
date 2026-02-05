import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, Mail, User, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";
import { z } from "zod";

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
  const {
    toast
  } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
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

    // Validate form
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
      // Create mailto link with encoded parameters
      const subject = encodeURIComponent(`Contact depuis le site - ${formData.name}`);
      const body = encodeURIComponent(`Nom: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`);

      // Open mailto link
      window.location.href = `mailto:azerty@gmail.com?subject=${subject}&body=${body}`;
      toast({
        title: "Redirection vers votre client mail",
        description: "Votre client de messagerie s'ouvre avec le message pré-rempli."
      });

      // Reset form after short delay
      setTimeout(() => {
        setFormData({
          name: "",
          email: "",
          message: ""
        });
        setIsSubmitting(false);
      }, 1000);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };
  return <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          {/* Header */}
          <div className="mb-8">
            <Link to="/">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Accueil
              </Button>
            </Link>
          </div>

          <div className="max-w-2xl mx-auto space-y-12">
            {/* Title */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold">Contact</h1>
              <p className="text-muted-foreground max-w-lg mx-auto">Pour toute demande de collaboration, n'hésitez pas à me contacter.</p>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Nom
                </Label>
                <Input id="name" name="name" type="text" placeholder="Votre nom" value={formData.name} onChange={handleChange} className={errors.name ? "border-destructive" : ""} />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email
                </Label>
                <Input id="email" name="email" type="email" placeholder="votre@email.com" value={formData.email} onChange={handleChange} className={errors.email ? "border-destructive" : ""} />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  Message
                </Label>
                <Textarea id="message" name="message" placeholder="Décrivez votre projet ou votre demande..." rows={6} value={formData.message} onChange={handleChange} className={errors.message ? "border-destructive" : ""} />
                {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
              </div>

              {/* Submit */}
              <Button type="submit" size="lg" className="w-full group" disabled={isSubmitting}>
                {isSubmitting ? "Envoi en cours..." : <>
                    Envoyer le message
                    <Send className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </>}
              </Button>
            </form>

            {/* Additional info */}
            <div className="text-center p-6 rounded-xl bg-secondary/30 border border-border">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Je réponds généralement sous 24 à 48 heures.
                <br /><br />
                Le bouton <strong>« Envoyer le message »</strong> ouvrira votre client de messagerie.
                <br /><br />
                Les informations transmises via ce formulaire sont utilisées uniquement
                pour vous répondre.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>;
};
export default Contact;