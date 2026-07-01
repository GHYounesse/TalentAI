export default function Hero() {
    return (
        <section className="bg-background relative flex min-h-screen items-center overflow-hidden pt-16 sm:pt-20">
            {/* Background */}
            <div className="pointer-events-none absolute inset-0">
                <div className="bg-primary/20 absolute -top-40 -left-40 h-[400px] w-[400px] rounded-full blur-[100px] sm:h-[600px] sm:w-[600px] sm:blur-[120px]" />
                <div className="bg-chart-3/10 absolute top-1/2 right-0 h-[300px] w-[300px] rounded-full blur-[100px] sm:h-[500px] sm:w-[500px] sm:blur-[120px]" />
                <div className="bg-primary/10 absolute bottom-0 left-1/3 h-[200px] w-[300px] rounded-full blur-[80px] sm:h-[300px] sm:w-[400px] sm:blur-[100px]" />

                {/* Grid */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />
            </div>

            <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
                <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
                    {/* LEFT CONTENT */}
                    <div className="text-center lg:text-left">
                        <div className="border-border bg-card/50 mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-sm sm:px-4">
                            <span className="bg-primary h-1.5 w-1.5 rounded-full" />
                            <span className="text-muted-foreground text-xs font-medium">Propulsé par Claude AI & Whisper</span>
                        </div>

                        <h1 className="text-foreground text-3xl leading-tight font-bold sm:text-4xl md:text-5xl lg:text-6xl">
                            Recrutez les{' '}
                            <span className="from-primary to-chart-3 bg-gradient-to-r via-purple-500 bg-clip-text text-transparent">
                                meilleurs profils
                            </span>{' '}
                            grâce à l'IA
                        </h1>

                        <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-sm leading-relaxed sm:mt-6 sm:text-base lg:mx-0 lg:text-lg">
                            RecruteAI automatise votre processus de recrutement : sourcing, analyse CV, entretiens IA et classement intelligent des
                            candidats.
                        </p>

                        {/* CTA */}
                        <div className="mt-8 flex flex-col justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4 lg:justify-start">
                            <a
                                href="#contact"
                                className="bg-primary rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition hover:opacity-90 sm:px-8 sm:py-4"
                            >
                                Voir la démo
                            </a>

                            <a
                                href="#about"
                                className="border-border bg-card text-foreground hover:bg-accent rounded-xl border px-6 py-3.5 text-sm font-semibold transition sm:px-8 sm:py-4"
                            >
                                En savoir plus
                            </a>
                        </div>

                        {/* Social proof */}
                        <p className="text-muted-foreground mt-6 text-xs sm:mt-8">
                            Rejoignez <span className="text-foreground font-medium">500+ recruteurs</span> qui font confiance à RecruteAI
                        </p>
                    </div>

                    {/* RIGHT CONTENT — visible from md up (not just lg) */}
                    <div className="relative hidden md:block">
                        {/* Glow */}
                        <div className="bg-primary/20 absolute -inset-4 rounded-3xl blur-2xl" />

                        {/* Card */}
                        <div className="bg-card border-border relative overflow-hidden rounded-2xl border shadow-xl">
                            {/* Top bar */}
                            <div className="border-border flex items-center gap-2 border-b px-4 py-3 sm:px-5 sm:py-4">
                                <div className="h-2.5 w-2.5 rounded-full bg-red-500/60 sm:h-3 sm:w-3" />
                                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60 sm:h-3 sm:w-3" />
                                <div className="h-2.5 w-2.5 rounded-full bg-green-500/60 sm:h-3 sm:w-3" />
                                <span className="text-muted-foreground ml-3 text-xs">RecruteAI Dashboard</span>
                            </div>

                            <div className="space-y-3 p-4 sm:space-y-4 sm:p-6">
                                {/* KPI */}
                                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                    {[
                                        { label: 'Profils', val: '1,284' },
                                        { label: 'CV', val: '347' },
                                        { label: 'Interviews', val: '89' },
                                    ].map((k, i) => (
                                        <div key={i} className="bg-background border-border rounded-xl border p-2.5 sm:p-3">
                                            <p className="text-muted-foreground text-xs">{k.label}</p>
                                            <p className="text-foreground mt-0.5 text-base font-bold sm:text-lg">{k.val}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* List */}
                                <div className="border-border overflow-hidden rounded-xl border">
                                    <div className="border-border text-foreground border-b px-3 py-2.5 text-sm font-semibold sm:px-4 sm:py-3">
                                        Top candidats
                                    </div>

                                    {[
                                        { name: 'Sarah El Mansouri', role: 'Senior Dev' },
                                        { name: 'Karim Benjelloun', role: 'Product Lead' },
                                        { name: 'Leila Tazi', role: 'Data Engineer' },
                                    ].map((c, i) => (
                                        <div
                                            key={i}
                                            className="border-border flex items-center justify-between border-b px-3 py-2.5 last:border-0 sm:px-4 sm:py-3"
                                        >
                                            <div>
                                                <p className="text-foreground text-xs font-medium sm:text-sm">{c.name}</p>
                                                <p className="text-muted-foreground text-xs">{c.role}</p>
                                            </div>
                                            <span className="text-primary text-xs font-semibold">94%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Floating badge */}
                        <div className="bg-card border-border absolute -bottom-4 -left-4 rounded-xl border px-3 py-2.5 shadow-lg sm:px-4 sm:py-3">
                            <p className="text-foreground text-xs font-semibold sm:text-sm">Candidat recommandé</p>
                            <p className="text-muted-foreground text-xs">Score IA: 94/100</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* bottom fade */}
            <div className="from-background absolute right-0 bottom-0 left-0 h-24 bg-gradient-to-t to-transparent" />
        </section>
    );
}
