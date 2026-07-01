import { useState } from 'react';

const faqs = [
    {
        q: 'Comment RecruteAI se connecte aux plateformes ?',
        a: "Connexion via API ou outils d'intégration. Configuration unique dans le dashboard.",
    },
    {
        q: 'Quels formats de CV sont acceptés ?',
        a: 'PDF et DOCX. Extraction automatique des données et scoring IA.',
    },
    {
        q: "Quels formats d'entretiens sont supportés ?",
        a: "MP4, MP3, WAV jusqu'à 500MB avec support Zoom, Teams et Meet.",
    },
    {
        q: 'Comment est calculé le score IA ?',
        a: 'Basé sur des critères pondérés définis dans le brief (expérience, skills, etc.).',
    },
    {
        q: 'Quel modèle IA est utilisé ?',
        a: "Claude pour l'analyse + Whisper pour la transcription audio/vidéo.",
    },
    {
        q: 'Les données sont-elles sécurisées ?',
        a: 'Chiffrement complet + conformité RGPD + contrôle total des accès.',
    },
];

export default function FAQ() {
    const [open, setOpen] = useState<number | null>(0);

    return (
        <section id="faq" className="bg-background relative overflow-hidden py-16 sm:py-20 lg:py-28">
            {/* background */}
            <div className="pointer-events-none absolute inset-0">
                <div className="bg-primary/10 absolute top-1/2 left-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />
            </div>

            <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                {/* HEADER */}
                <div className="mb-10 text-center sm:mb-14 lg:mb-16">
                    <div className="border-border bg-card mb-5 inline-flex items-center rounded-full border px-4 py-1.5 sm:mb-6">
                        <span className="text-primary text-xs font-semibold tracking-widest uppercase">FAQ</span>
                    </div>

                    <h2 className="text-foreground text-2xl font-bold sm:text-3xl lg:text-5xl">Questions fréquentes</h2>

                    <p className="text-muted-foreground mt-3 text-sm sm:mt-4 sm:text-base lg:text-lg">Réponses aux questions les plus courantes.</p>
                </div>

                {/* ACCORDION */}
                <div className="space-y-2.5 sm:space-y-3">
                    {faqs.map((faq, i) => (
                        <div
                            key={i}
                            className={`bg-card rounded-2xl border transition-all duration-300 ${
                                open === i ? 'border-primary/30' : 'border-border hover:border-border/70'
                            }`}
                        >
                            {/* QUESTION */}
                            <button
                                onClick={() => setOpen(open === i ? null : i)}
                                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:gap-4 sm:px-5 sm:py-5 lg:px-6"
                            >
                                <span className="text-foreground text-sm leading-snug font-semibold lg:text-base">{faq.q}</span>

                                <span
                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-transform duration-300 sm:h-7 sm:w-7 ${
                                        open === i ? 'bg-primary border-primary rotate-45 text-white' : 'bg-muted border-border text-foreground'
                                    }`}
                                >
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                        <path d="M5 2v6M2 5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </span>
                            </button>

                            {/* ANSWER */}
                            <div
                                className={`overflow-hidden transition-all duration-300 ${open === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
                            >
                                <p className="text-muted-foreground px-4 pb-4 text-sm leading-relaxed sm:px-5 sm:pb-5 lg:px-6">{faq.a}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
