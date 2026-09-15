import { useState } from "react";
import type { LocalProjectMetadata, LocalResearcherProfile, ProjectAdministrativeData } from "./project-administration";

const inputClass = "mt-1 min-h-11 w-full rounded-lg border bg-background px-3 py-2 text-sm";
const buttonClass = "min-h-11 rounded-lg border bg-background px-4 text-sm font-medium";

export function ResearcherProfileForm({ profile, onSave, onCancel }: {
  profile: LocalResearcherProfile;
  onSave: (profile: LocalResearcherProfile) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(profile);
  const fields = [
    ["name", "Nom professionnel", "Pour vous désigner explicitement comme investigateur dans un projet."],
    ["email", "Email professionnel", "Pour préremplir un contact documentaire, si vous le choisissez."],
    ["organization", "Organisation", "Pour réutiliser votre institution sans lui attribuer automatiquement le rôle de promoteur."],
    ["department", "Service / unité", "Pour préciser le rattachement de l’équipe dans les documents."],
    ["address", "Adresse professionnelle", "Pour préremplir une adresse institutionnelle lorsque nécessaire."],
  ] as const;
  return <form onSubmit={(e) => { e.preventDefault(); onSave({ ...draft, revision: profile.revision + 1 }); }} className="mx-auto max-w-3xl space-y-5 rounded-2xl border bg-background p-6">
    <h1 className="text-2xl font-semibold">Profil réutilisable</h1>
    <p className="text-sm text-muted-foreground">Informations conservées dans ce navigateur. Tous les champs sont optionnels. Leur utilisation dans un projet nécessite une copie explicite ; aucun rôle ni décision scientifique n’est attribué automatiquement.</p>
    {fields.map(([key, label, why]) => <label key={key} className="block text-sm font-medium">{label} <span className="font-normal text-muted-foreground">· optionnel</span>
      <input aria-label={label} type={key === "email" ? "email" : "text"} maxLength={key === "address" ? 1000 : 300} value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} className={inputClass} />
      <span className="mt-1 block text-xs font-normal text-muted-foreground">{why}</span>
    </label>)}
    <div className="flex gap-3"><button type="submit" className={`${buttonClass} bg-primary text-primary-foreground`}>Enregistrer le profil</button><button type="button" onClick={onCancel} className={buttonClass}>Retour aux projets</button></div>
  </form>;
}

export default function ProjectAdministrationForm({ metadata, profile, projectId, onSave, onCancel }: {
  metadata: LocalProjectMetadata;
  profile: LocalResearcherProfile;
  projectId: string;
  onSave: (metadata: LocalProjectMetadata) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(metadata.title);
  const [data, setData] = useState(metadata.administration);
  const fields: Array<[keyof ProjectAdministrativeData, string, boolean, string]> = [
    ["principalInvestigator", "Investigateur principal", true, "Requis pour un dossier administratif complet ; peut rester vide dans le brouillon."],
    ["sponsor", "Promoteur", true, "Le promoteur de ce projet doit être désigné explicitement ; il ne découle pas de votre affiliation."],
    ["protocolVersion", "Numéro de version documentaire", true, "Version déclarée par votre équipe, distincte du numéro de génération conservé automatiquement."],
    ["institution", "Institution de rattachement", false, "Utile pour présenter l’équipe du projet dans le document."],
    ["contactEmail", "Contact du projet", false, "Utile pour préremplir un contact professionnel dans le document."],
    ["department", "Service du projet", false, "Utile pour préciser le service ou l’unité qui porte le projet."],
    ["address", "Adresse du projet", false, "Utile pour préremplir une adresse professionnelle de correspondance."],
  ];
  return <form onSubmit={(e) => { e.preventDefault(); onSave({ title: title.trim() || "Projet sans titre", revision: metadata.revision + 1, administration: data }); }} className="mx-auto max-w-3xl space-y-5 rounded-2xl border bg-background p-6">
    <h1 className="text-2xl font-semibold">Informations du projet</h1>
    <p className="text-sm text-muted-foreground">Vous pouvez enregistrer une fiche incomplète et continuer la recherche. Les données manquantes apparaîtront comme champs à compléter dans le protocole. Ces informations administratives ne modifient pas la science adoptée.</p>
    <label className="block text-sm font-medium">Titre temporaire du projet
      <input aria-label="Titre temporaire du projet" maxLength={300} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
    </label>
    {(profile.name || profile.organization) && <div className="rounded-xl border bg-muted/30 p-4">
      <p className="text-sm font-medium">Copier depuis le profil réutilisable</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {profile.name && <button type="button" className={buttonClass} onClick={() => setData({ ...data, principalInvestigator: profile.name, investigatorRef: profile.actorRef, contactEmail: profile.email, institution: profile.organization, department: profile.department, address: profile.address })}>Me désigner comme investigateur</button>}
        {profile.organization && <button type="button" className={buttonClass} onClick={() => setData({ ...data, sponsor: profile.organization, sponsorRef: profile.organizationRef })}>Désigner mon organisation comme promoteur</button>}
      </div>
    </div>}
    {fields.map(([key, label, required, help]) => <label key={key} className="block text-sm font-medium">{label} <span className="font-normal text-muted-foreground">· {required ? "requis pour compléter le document" : "optionnel"}</span>
      <input aria-label={label} type={key === "contactEmail" ? "email" : "text"} maxLength={key === "address" ? 1000 : 300} value={data[key]} className={inputClass}
        onChange={(e) => setData({ ...data, [key]: e.target.value, ...(key === "principalInvestigator" ? { investigatorRef: `${projectId}:administrative-investigator` } : key === "sponsor" ? { sponsorRef: `${projectId}:administrative-sponsor` } : {}) })} />
      <span className="mt-1 block text-xs font-normal text-muted-foreground">{help}</span>
    </label>)}
    <div className="flex flex-wrap gap-3"><button type="submit" className={`${buttonClass} bg-primary text-primary-foreground`}>Enregistrer et revenir au projet</button><button type="button" onClick={onCancel} className={buttonClass}>Annuler les modifications</button></div>
  </form>;
}
