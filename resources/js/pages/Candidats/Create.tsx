import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';

interface StatusOption {
    value: string;
    label: string;
}

interface Props {
    params: { status_candidat?: StatusOption[] };
}

const inputCls = (err?: string) =>
    `w-full rounded-lg border bg-ds-bg px-3 py-2 text-[13px] text-ds-text placeholder-ds-text3 outline-none transition focus:border-ds-accent ${err ? 'border-ds-red' : 'border-ds-border'}`;

const labelCls = 'block text-[12px] font-medium text-ds-text2 mb-1';

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className={labelCls}>
                {label}
                {required && <span className="text-ds-red ml-0.5">*</span>}
            </label>
            {children}
            {error && <p className="text-ds-red mt-1 text-[11px]">{error}</p>}
        </div>
    );
}

const DEFAULT_STATUSES: StatusOption[] = [
    { value: 'sourced', label: 'Sourcé' },
    { value: 'contacted', label: 'Contacté' },
    { value: 'interview', label: 'Entretien' },
    { value: 'recommended', label: 'Recommandé' },
    { value: 'offer', label: 'Offre' },
    { value: 'rejected', label: 'Rejeté' },
];

export default function CreateCandidat({ params }: Props) {
    const statuses = params.status_candidat && params.status_candidat.length > 0 ? params.status_candidat : DEFAULT_STATUSES;
    const { data, setData, post, processing, errors } = useForm({
        full_name: '',
        email: '',
        phone: '',
        current_title: '',
        current_company: '',
        location: '',
        experience_years: '',
        education_level: '',
        source: '',
        source_url: '',
        status: statuses[0]?.value ?? '',
        linkedin_url: '',
        headline: '',
        summary: '',
        open_to_work: false as boolean,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('dashboard.candidats.store'));
    }

    return (
        <AppLayout>
            <Head title="Nouveau candidat" />

            <div className="bg-ds-bg min-h-full px-6 py-8">
                {/* Header */}
                <div className="mb-6 flex items-start gap-3">
                    <Link
                        href={route('dashboard.candidats.index')}
                        className="border-ds-border text-ds-text3 hover:border-ds-accent/40 hover:bg-ds-accent/[0.06] hover:text-ds-accent mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition"
                    >
                        <ChevronLeft size={16} />
                    </Link>
                    <div>
                        <p className="text-ds-text3 mb-1 text-[12px]">
                            <Link href={route('dashboard.candidats.index')} className="hover:text-ds-text2 transition">
                                Candidats
                            </Link>{' '}
                            <span className="text-ds-text2">› Nouveau candidat</span>
                        </p>
                        <h1 className="font-heading text-ds-text text-[26px] font-bold">Nouveau candidat</h1>
                        <p className="text-ds-text2 mt-1 text-[14px]">Ajoutez manuellement un candidat à votre base.</p>
                    </div>
                </div>

                <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {/* LEFT */}
                    <div className="space-y-5">
                        <div className="border-ds-border bg-ds-surface rounded-2xl border p-5">
                            <h2 className="text-ds-text mb-4 text-[14px] font-semibold">Informations personnelles</h2>
                            <div className="space-y-4">
                                <Field label="Nom complet" required error={errors.full_name}>
                                    <input
                                        className={inputCls(errors.full_name)}
                                        placeholder="ex: Jean Dupont"
                                        value={data.full_name}
                                        onChange={(e) => setData('full_name', e.target.value)}
                                    />
                                </Field>

                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Email" required error={errors.email}>
                                        <input
                                            type="email"
                                            className={inputCls(errors.email)}
                                            placeholder="jean@example.com"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                        />
                                    </Field>

                                    <Field label="Téléphone" error={errors.phone}>
                                        <input
                                            className={inputCls(errors.phone)}
                                            placeholder="+33 6 00 00 00 00"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                        />
                                    </Field>
                                </div>

                                <Field label="Localisation" error={errors.location}>
                                    <input
                                        className={inputCls(errors.location)}
                                        placeholder="ex: Paris, France"
                                        value={data.location}
                                        onChange={(e) => setData('location', e.target.value)}
                                    />
                                </Field>

                                <Field label="LinkedIn" error={errors.linkedin_url}>
                                    <input
                                        className={inputCls(errors.linkedin_url)}
                                        placeholder="https://linkedin.com/in/..."
                                        value={data.linkedin_url}
                                        onChange={(e) => setData('linkedin_url', e.target.value)}
                                    />
                                </Field>
                            </div>
                        </div>

                        <div className="border-ds-border bg-ds-surface rounded-2xl border p-5">
                            <h2 className="text-ds-text mb-4 text-[14px] font-semibold">Expérience</h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Poste actuel" error={errors.current_title}>
                                        <input
                                            className={inputCls(errors.current_title)}
                                            placeholder="ex: Développeur Senior"
                                            value={data.current_title}
                                            onChange={(e) => setData('current_title', e.target.value)}
                                        />
                                    </Field>

                                    <Field label="Entreprise actuelle" error={errors.current_company}>
                                        <input
                                            className={inputCls(errors.current_company)}
                                            placeholder="ex: Acme Corp"
                                            value={data.current_company}
                                            onChange={(e) => setData('current_company', e.target.value)}
                                        />
                                    </Field>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Années d'expérience" error={errors.experience_years}>
                                        <input
                                            type="number"
                                            min={0}
                                            className={inputCls(errors.experience_years)}
                                            placeholder="ex: 5"
                                            value={data.experience_years}
                                            onChange={(e) => setData('experience_years', e.target.value)}
                                        />
                                    </Field>

                                    <Field label="Niveau d'éducation" error={errors.education_level}>
                                        <input
                                            className={inputCls(errors.education_level)}
                                            placeholder="ex: Bac+5"
                                            value={data.education_level}
                                            onChange={(e) => setData('education_level', e.target.value)}
                                        />
                                    </Field>
                                </div>

                                <Field label="Titre / Accroche" error={errors.headline}>
                                    <input
                                        className={inputCls(errors.headline)}
                                        placeholder="ex: Ingénieur Full Stack passionné par l'IA"
                                        value={data.headline}
                                        onChange={(e) => setData('headline', e.target.value)}
                                    />
                                </Field>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="space-y-5">
                        <div className="border-ds-border bg-ds-surface rounded-2xl border p-5">
                            <h2 className="text-ds-text mb-4 text-[14px] font-semibold">Sourcing & Statut</h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Source" error={errors.source}>
                                        <select
                                            className={inputCls(errors.source)}
                                            value={data.source}
                                            onChange={(e) => setData('source', e.target.value)}
                                        >
                                            <option value="">— Choisir —</option>
                                            <option value="linkedin">LinkedIn</option>
                                            <option value="indeed">Indeed</option>
                                            <option value="apify">Apify</option>
                                            <option value="cv">CV</option>
                                        </select>
                                    </Field>

                                    <Field label="Statut" required error={errors.status}>
                                        <select
                                            className={inputCls(errors.status)}
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                        >
                                            {statuses.map((s) => (
                                                <option key={s.value} value={s.value}>
                                                    {s.label}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                </div>

                                <Field label="URL Source" error={errors.source_url}>
                                    <input
                                        className={inputCls(errors.source_url)}
                                        placeholder="https://..."
                                        value={data.source_url}
                                        onChange={(e) => setData('source_url', e.target.value)}
                                    />
                                </Field>

                                <div className="flex items-center gap-2">
                                    <input
                                        id="open_to_work"
                                        type="checkbox"
                                        className="border-ds-border accent-ds-accent h-4 w-4 rounded"
                                        checked={data.open_to_work}
                                        onChange={(e) => setData('open_to_work', e.target.checked)}
                                    />
                                    <label htmlFor="open_to_work" className="text-ds-text2 cursor-pointer text-[13px]">
                                        Open to work
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="border-ds-border bg-ds-surface rounded-2xl border p-5">
                            <h2 className="text-ds-text mb-4 text-[14px] font-semibold">Résumé</h2>
                            <Field label="Résumé / Notes" error={errors.summary}>
                                <textarea
                                    className={`${inputCls(errors.summary)} resize-none`}
                                    placeholder="Résumé du profil, notes de sourcing…"
                                    rows={6}
                                    value={data.summary}
                                    onChange={(e) => setData('summary', e.target.value)}
                                />
                            </Field>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Link
                                href={route('dashboard.candidats.index')}
                                className="border-ds-border text-ds-text2 hover:bg-ds-surface hover:text-ds-text flex-1 rounded-lg border py-2.5 text-center text-[13px] font-medium transition"
                            >
                                Annuler
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-ds-accent flex-1 rounded-lg py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#7C74FF] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {processing ? 'Création…' : 'Créer le candidat →'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
