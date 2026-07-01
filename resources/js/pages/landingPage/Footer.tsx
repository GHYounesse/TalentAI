export default function Footer() {
    const links = {
        Produit: ['Fonctionnalités', 'Tarifs', 'Roadmap', 'Changelog'],
        Solution: ['Recruteurs', 'DRH', 'Cabinets', "Cas d'usage"],
        Ressources: ['Documentation', 'Blog', 'API', 'Support'],
        Entreprise: ['À propos', 'Carrières', 'Contact'],
    };

    const year = new Date().getFullYear();

    return (
        <footer className="bg-background border-border border-t">
            {/* CTA */}
            <div className="relative overflow-hidden">
                <div className="from-primary/10 via-primary/5 to-chart-3/10 pointer-events-none absolute inset-0 bg-gradient-to-r" />

                <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:gap-8 sm:px-6 sm:py-14 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-16">
                    <div>
                        <h3 className="text-foreground text-lg font-bold sm:text-xl lg:text-3xl">Prêt à recruter plus intelligemment ?</h3>

                        <p className="text-muted-foreground mt-2 text-sm lg:text-base">
                            Rejoignez les équipes qui automatisent déjà leur recrutement.
                        </p>
                    </div>

                    <a
                        href="#contact"
                        className="bg-primary text-primary-foreground w-fit rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:opacity-90 sm:px-6 sm:py-3"
                    >
                        Voir la démo →
                    </a>
                </div>
            </div>

            {/* MAIN */}
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
                {/* Links grid — brand full width on mobile, then 2-col, then 5-col */}
                <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
                    {/* Brand — spans full width on mobile, 1 col otherwise */}
                    <div className="col-span-2 sm:col-span-3 lg:col-span-1">
                        <div className="mb-3 flex items-center gap-2 sm:mb-4">
                            <span className="text-foreground text-lg font-bold">
                                Recrute<span className="text-primary">AI</span>
                            </span>
                        </div>

                        <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
                            Plateforme IA de recrutement automatisée pour les équipes modernes.
                        </p>
                    </div>

                    {/* Link columns — 2-col on mobile, then natural grid */}
                    <div className="col-span-2 grid grid-cols-2 gap-8 sm:col-span-3 sm:grid-cols-4 lg:contents">
                        {Object.entries(links).map(([title, items]) => (
                            <div key={title}>
                                <h4 className="text-foreground mb-3 text-sm font-semibold sm:mb-4">{title}</h4>

                                <ul className="space-y-2">
                                    {items.map((item) => (
                                        <li key={item}>
                                            <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition">
                                                {item}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* BOTTOM */}
                <div className="border-border mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:mt-12 md:flex-row">
                    <p className="text-muted-foreground text-xs">© {year} RecruteAI. Tous droits réservés.</p>

                    <div className="flex gap-4 text-xs sm:gap-5">
                        <a className="text-muted-foreground hover:text-foreground" href="#">
                            Confidentialité
                        </a>
                        <a className="text-muted-foreground hover:text-foreground" href="#">
                            CGU
                        </a>
                        <a className="text-muted-foreground hover:text-foreground" href="#">
                            RGPD
                        </a>
                    </div>

                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                        Système opérationnel
                    </div>
                </div>
            </div>
        </footer>
    );
}
