"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { FoodyButton } from "@/components/foody/button";
import { OrderStatusBadge } from "@/components/orders/order-status";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { apiErrorMessage } from "@/lib/api/client";
import { formatDate, formatFCFA, formatPhone } from "@/lib/format";
import { authApi, orderApi } from "@/services/foody";
import { useAuthStore } from "@/store/auth";

export default function AccountPage() {
    const { ready, user } = useRequireAuth();
    const router = useRouter();
    const { setUser, clear } = useAuthStore();
    const [name, setName] = useState<string | null>(null);

    const { data: orders, isLoading } = useQuery({
        queryKey: ["my-orders"],
        queryFn: () => orderApi.mine(),
        enabled: ready,
    });

    const saveName = useMutation({
        mutationFn: (pseudo: string) => authApi.updateMe({ pseudo }),
        onSuccess: (_, pseudo) => {
            if (user) setUser({ ...user, pseudo });
            setName(null);
            toast.success("Pseudo mis à jour");
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
    });

    const logout = async () => {
        try {
            await authApi.logout();
        } catch {
            // The local session is dropped either way.
        }
        clear();
        router.replace("/");
    };

    if (!ready || !user) return <div className="min-h-[50vh]" />;

    return (
        <div className="mx-auto max-w-4xl px-4 pt-6 pb-10 md:px-6 md:pt-10">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Salut {user.pseudo} 👋</h1>
                <FoodyButton variant="ghost" size="sm" onClick={logout}>
                    <LogOut /> Déconnexion
                </FoodyButton>
            </div>

            <section className="mt-6 rounded-3xl bg-white p-5 shadow-soft sm:p-6">
                <h2 className="font-display text-lg font-semibold">Profil</h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                        <dt className="text-sm text-mist">Pseudo</dt>
                        <dd className="mt-1">
                            {name === null ? (
                                <span className="flex items-center gap-3">
                                    <span className="font-display text-lg font-semibold">{user.pseudo}</span>
                                    <button type="button" className="cursor-pointer text-sm font-semibold underline" onClick={() => setName(user.pseudo ?? "")}>
                                        Modifier
                                    </button>
                                </span>
                            ) : (
                                <form
                                    className="flex gap-2"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        saveName.mutate(name.trim());
                                    }}
                                >
                                    <input autoFocus minLength={3} maxLength={30} required value={name} onChange={(e) => setName(e.target.value)} className="h-10 flex-1 rounded-xl border border-cocoa/15 px-3 outline-none focus:border-sun" />
                                    <FoodyButton size="sm" type="submit" loading={saveName.isPending}>OK</FoodyButton>
                                </form>
                            )}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm text-mist">Numéro WhatsApp</dt>
                        <dd className="mt-1 font-medium">{formatPhone(user.phone)}</dd>
                    </div>
                </dl>
            </section>

            <section className="mt-6">
                <h2 className="font-display text-lg font-semibold">Mes commandes</h2>
                {isLoading && <div className="mt-4 h-24 animate-pulse rounded-3xl bg-honey" />}
                {orders && orders.items.length === 0 && (
                    <div className="mt-4 rounded-3xl bg-honey p-6 text-center">
                        <p className="text-cocoa/80">Vous n&apos;avez pas encore commandé.</p>
                        <FoodyButton asChild className="mt-4"><Link href="/boutique">Découvrir la boutique</Link></FoodyButton>
                    </div>
                )}
                <ul className="mt-4 space-y-3">
                    {orders?.items.map((o) => (
                        <li key={o.id}>
                            <Link href={`/mon-compte/commandes/${o.id}`} className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-soft transition hover:shadow-lift sm:p-5">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-display font-semibold">{o.order_number}</span>
                                        <OrderStatusBadge status={o.status} />
                                    </div>
                                    <p className="mt-1 truncate text-sm text-mist">
                                        {formatDate(o.created_time)} · {o.items.reduce((n, i) => n + i.quantity, 0)} article(s)
                                    </p>
                                </div>
                                <span className="font-semibold">{formatFCFA(o.total)}</span>
                                <ChevronRight className="size-5 text-mist" />
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
