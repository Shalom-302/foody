"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FoodyButton } from "@/components/foody/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { apiErrorMessage } from "@/lib/api/client";
import { formatPhone } from "@/lib/format";
import { authApi } from "@/services/foody";
import { useAuthStore } from "@/store/auth";
import { BackedByKortex } from "@/components/foody/backed-by-kortex";

const CODE_LENGTH = 6;
// Mirrors backend normalize_pseudo (the API stays the authority).
const PSEUDO_RE = /^[0-9A-Za-zÀ-ÖØ-öø-ÿ][0-9A-Za-zÀ-ÖØ-öø-ÿ._\- ]{1,28}[0-9A-Za-zÀ-ÖØ-öø-ÿ]$/;

/** Only same-site paths: never redirect to an attacker-supplied URL. */
function safeNext(next: string | null): string {
    return next && next.startsWith("/") && !next.startsWith("//") ? next : "/mon-compte";
}

export function WhatsappLogin() {
    const router = useRouter();
    const params = useSearchParams();
    const hydrated = useHydrated();
    const next = safeNext(params.get("next"));
    const { user, setSession, setUser } = useAuthStore();

    const [step, setStep] = useState<"phone" | "code" | "pseudo">("phone");
    const [phone, setPhone] = useState("");
    const [normalized, setNormalized] = useState("");
    const [code, setCode] = useState("");
    const [pseudo, setPseudo] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);
    const codeRef = useRef<HTMLInputElement>(null);

    // Logged in: go on, unless the account still has no pseudo.
    useEffect(() => {
        if (!hydrated || !user) return;
        if (user.pseudo) router.replace(next);
        else setStep("pseudo");
    }, [hydrated, user, next, router]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const request = useMutation({
        mutationFn: (p: string) => authApi.requestOtp(p),
        onSuccess: (data) => {
            setNormalized(data.phone);
            setStep("code");
            setCode("");
            setError(null);
            setCooldown(data.resend_in);
            setTimeout(() => codeRef.current?.focus(), 50);
        },
        onError: (e) => setError(apiErrorMessage(e, "Envoi du code impossible pour le moment.")),
    });

    const verify = useMutation({
        mutationFn: () => authApi.verifyOtp(normalized, code),
        onSuccess: (data) => {
            setError(null);
            setSession(data.access_token, data.user);
            if (data.needs_pseudo) setStep("pseudo");
            else router.replace(next);
        },
        onError: (e) => {
            setError(apiErrorMessage(e, "Vérification impossible pour le moment."));
            setCode("");
        },
    });

    const savePseudo = useMutation({
        mutationFn: (value: string) => authApi.updateMe({ pseudo: value }),
        onSuccess: (_, value) => {
            if (user) setUser({ ...user, pseudo: value });
            router.replace(next);
        },
        onError: (e) => setError(apiErrorMessage(e, "Ce pseudo n'a pas pu être enregistré.")),
    });

    useEffect(() => {
        if (step === "code" && code.length === CODE_LENGTH && !verify.isPending) verify.mutate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code]);

    const cleanPseudo = pseudo.trim().replace(/\s+/g, " ");
    const pseudoValid = PSEUDO_RE.test(cleanPseudo);

    return (
        <div className="mx-auto flex max-w-md flex-col px-4 py-10 md:py-16">
            <div className="rounded-[2rem] bg-white p-6 shadow-lift sm:p-8">
                {step === "pseudo" ? (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            setError(null);
                            if (pseudoValid) savePseudo.mutate(cleanPseudo);
                        }}
                    >
                        <span className="flex size-14 items-center justify-center rounded-2xl bg-butter text-cocoa">
                            <Sparkles className="size-7" />
                        </span>
                        <h1 className="mt-5 text-2xl font-bold">Choisis ton pseudo</h1>
                        <p className="mt-2 text-sm text-mist">
                            C&apos;est le nom affiché sur tes commandes. Tu pourras le changer dans ton compte.
                        </p>
                        <label htmlFor="pseudo" className="mt-6 block text-sm font-medium">Pseudo</label>
                        <input
                            id="pseudo"
                            autoFocus
                            autoComplete="nickname"
                            maxLength={30}
                            value={pseudo}
                            onChange={(e) => setPseudo(e.target.value)}
                            placeholder="Awa_Gourmande"
                            className="mt-2 h-13 w-full rounded-2xl border border-cocoa/15 bg-cream px-4 text-base outline-none focus:border-sun focus:ring-2 focus:ring-sun/30"
                        />
                        <p className="mt-2 text-xs text-mist">3 à 30 caractères : lettres, chiffres, espaces, « . », « _ » ou « - ».</p>
                        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                        <FoodyButton type="submit" size="lg" className="mt-6 w-full" loading={savePseudo.isPending} disabled={!pseudoValid}>
                            C&apos;est parti
                        </FoodyButton>
                    </form>
                ) : (
                    <>
                        <span className="flex size-14 items-center justify-center rounded-2xl bg-[#25D366]/15 text-[#128C7E]">
                            <MessageCircle className="size-7" />
                        </span>

                        {step === "phone" ? (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    setError(null);
                                    request.mutate(phone);
                                }}
                            >
                                <h1 className="mt-5 text-2xl font-bold">Connexion avec WhatsApp</h1>
                                <p className="mt-2 text-sm text-mist">
                                    Recevez un code sur WhatsApp. Pas de mot de passe, votre compte est créé automatiquement.
                                </p>
                                <label htmlFor="phone" className="mt-6 block text-sm font-medium">Numéro WhatsApp</label>
                                <div className="mt-2 flex h-13 items-center rounded-2xl border border-cocoa/15 bg-cream px-4 focus-within:border-sun focus-within:ring-2 focus-within:ring-sun/30">
                                    <span className="pr-3 text-sm font-medium text-mist">🇨🇮 +225</span>
                                    <input
                                        id="phone"
                                        type="tel"
                                        inputMode="tel"
                                        autoComplete="tel"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="07 00 00 00 00"
                                        className="h-full flex-1 bg-transparent text-base outline-none placeholder:text-mist/60"
                                    />
                                </div>
                                <p className="mt-2 text-xs text-mist">Autre pays ? Saisissez le numéro avec son indicatif (+33…).</p>
                                {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                                <FoodyButton type="submit" size="lg" className="mt-6 w-full" loading={request.isPending} disabled={phone.replace(/\D/g, "").length < 8}>
                                    Recevoir mon code
                                </FoodyButton>
                            </form>
                        ) : (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (code.length === CODE_LENGTH) verify.mutate();
                                }}
                            >
                                <button type="button" onClick={() => setStep("phone")} className="mt-5 inline-flex cursor-pointer items-center gap-1 text-sm text-mist hover:text-cocoa">
                                    <ArrowLeft className="size-4" /> Changer de numéro
                                </button>
                                <h1 className="mt-3 text-2xl font-bold">Entrez votre code</h1>
                                <p className="mt-2 text-sm text-mist">
                                    Code envoyé sur WhatsApp au <span className="font-semibold text-cocoa">{formatPhone(normalized)}</span>.
                                </p>
                                <label htmlFor="otp" className="sr-only">Code à {CODE_LENGTH} chiffres</label>
                                <input
                                    id="otp"
                                    ref={codeRef}
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    pattern="\d*"
                                    maxLength={CODE_LENGTH}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
                                    className="mt-6 h-16 w-full rounded-2xl border border-cocoa/15 bg-cream text-center font-display text-3xl font-semibold tracking-[0.5em] outline-none focus:border-sun focus:ring-2 focus:ring-sun/30"
                                    placeholder="••••••"
                                />
                                {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                                <FoodyButton type="submit" size="lg" className="mt-6 w-full" loading={verify.isPending} disabled={code.length !== CODE_LENGTH}>
                                    Valider
                                </FoodyButton>
                                <button
                                    type="button"
                                    disabled={cooldown > 0 || request.isPending}
                                    onClick={() => request.mutate(normalized)}
                                    className="mt-4 w-full cursor-pointer text-center text-sm font-medium text-cocoa underline disabled:cursor-default disabled:text-mist disabled:no-underline"
                                >
                                    {cooldown > 0 ? `Renvoyer le code dans ${cooldown} s` : "Renvoyer le code"}
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>
            <p className="mt-6 flex items-center justify-center gap-2 text-xs text-mist">
                <ShieldCheck className="size-4" /> FOODY ne vous demandera jamais ce code.
            </p>
            <BackedByKortex className="mx-auto mt-8 text-cocoa" />
        </div>
    );
}
