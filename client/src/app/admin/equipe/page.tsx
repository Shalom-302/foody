"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FoodyButton } from "@/components/foody/button";
import { apiErrorMessage } from "@/lib/api/client";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { formatDate, formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils/cn";
import { adminApi } from "@/services/foody";
import { useAuthStore } from "@/store/auth";
import type { Customer } from "@/types/foody";

export default function AdminTeamPage() {
    const queryClient = useQueryClient();
    const me = useAuthStore((s) => s.user);
    const [q, setQ] = useState("");
    const [adminsOnly, setAdminsOnly] = useState(false);
    const [page, setPage] = useState(1);
    const search = useDebounce(q, 300);

    const query = { q: search || undefined, admins: adminsOnly || undefined, page };
    const { data, isLoading } = useQuery({
        queryKey: ["admin-customers", query],
        queryFn: () => adminApi.customers(query),
        placeholderData: keepPreviousData,
    });

    const refreshList = () => queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
    const block = useMutation({
        mutationFn: (c: Customer) => adminApi.setCustomerStatus(c.id, !c.status),
        onSuccess: (c) => {
            refreshList();
            toast.success(c.status ? `${c.pseudo ?? formatPhone(c.phone)} est débloqué` : `${c.pseudo ?? formatPhone(c.phone)} est bloqué et déconnecté`);
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
    });
    const remove = useMutation({
        mutationFn: (c: Customer) => adminApi.deleteCustomer(c.id),
        onSuccess: () => {
            refreshList();
            toast.success("Compte supprimé (ses commandes sont conservées)");
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
    });

    const toggle = useMutation({
        mutationFn: (c: Customer) => adminApi.setAdmin(c.id, !c.is_admin),
        onSuccess: (c) => {
            queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
            toast.success(c.is_admin ? `${c.pseudo ?? formatPhone(c.phone)} est maintenant admin` : `Accès admin retiré à ${c.pseudo ?? formatPhone(c.phone)}`);
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
    });

    return (
        <div>
            <h1 className="text-2xl font-bold">Clients & équipe</h1>
            <p className="mt-1 max-w-2xl text-sm text-mist">
                Un client devient admin d&apos;un clic : il voit alors l&apos;administration à sa prochaine visite. Pour qu&apos;une
                personne apparaisse ici, elle doit s&apos;être connectée une fois avec son numéro WhatsApp.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
                <input
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setPage(1); }}
                    placeholder="Pseudo, nom ou téléphone"
                    className="h-10 min-w-56 flex-1 rounded-xl border border-cocoa/10 bg-white px-3 text-sm outline-none focus:border-sun"
                />
                <button
                    type="button"
                    aria-pressed={adminsOnly}
                    onClick={() => { setAdminsOnly((v) => !v); setPage(1); }}
                    className={cn("h-10 cursor-pointer rounded-xl border px-4 text-sm font-medium", adminsOnly ? "border-sun bg-sun" : "border-cocoa/10 bg-white hover:bg-honey")}
                >
                    Admins uniquement
                </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-3xl bg-white shadow-soft">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-left text-sm">
                        <thead className="bg-honey text-xs tracking-wide text-cocoa/70 uppercase">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Client</th>
                                <th className="px-4 py-3 font-semibold">WhatsApp</th>
                                <th className="px-4 py-3 font-semibold">Inscrit le</th>
                                <th className="px-4 py-3 font-semibold">Rôle</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-cocoa/5">
                            {data?.items.map((c) => {
                                const isMe = c.id === me?.id;
                                return (
                                    <tr key={c.id}>
                                        <td className="px-4 py-3">
                                            <span className="font-semibold">{c.pseudo ?? <span className="text-mist italic">sans pseudo</span>}</span>
                                            {c.full_name && <span className="block text-xs text-mist">{c.full_name}</span>}
                                        </td>
                                        <td className="px-4 py-3 tabular-nums">{formatPhone(c.phone)}</td>
                                        <td className="px-4 py-3 text-mist">{c.join_time ? formatDate(c.join_time) : "—"}</td>
                                        <td className="px-4 py-3">
                                            {!c.status ? (
                                                <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">Bloqué</span>
                                            ) : c.is_admin ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-sun px-2.5 py-1 text-xs font-semibold"><ShieldCheck className="size-3.5" /> Admin</span>
                                            ) : (
                                                <span className="text-xs text-mist">Client</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {isMe ? (
                                                <span className="text-xs text-mist">C&apos;est vous</span>
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                <FoodyButton
                                                    size="sm"
                                                    variant={c.is_admin ? "danger" : "outline"}
                                                    loading={toggle.isPending && toggle.variables?.id === c.id}
                                                    disabled={toggle.isPending}
                                                    onClick={() => {
                                                        if (c.is_admin && !window.confirm(`Retirer l'accès admin à ${c.pseudo ?? formatPhone(c.phone)} ?`)) return;
                                                        toggle.mutate(c);
                                                    }}
                                                >
                                                    {c.is_admin ? "Retirer l'accès admin" : "Rendre admin"}
                                                </FoodyButton>
                                                <FoodyButton
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={block.isPending}
                                                    onClick={() => {
                                                        if (c.status && !window.confirm(`Bloquer ${c.pseudo ?? formatPhone(c.phone)} ? Il sera déconnecté et ne pourra plus commander.`)) return;
                                                        block.mutate(c);
                                                    }}
                                                >
                                                    {c.status ? "Bloquer" : "Débloquer"}
                                                </FoodyButton>
                                                <FoodyButton
                                                    size="sm"
                                                    variant="danger"
                                                    aria-label="Supprimer le compte"
                                                    disabled={remove.isPending}
                                                    onClick={() => window.confirm(`Supprimer le compte de ${c.pseudo ?? formatPhone(c.phone)} ? Ses commandes passées sont conservées.`) && remove.mutate(c)}
                                                >
                                                    <Trash2 />
                                                </FoodyButton>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {isLoading && <div className="h-32 animate-pulse bg-cream" />}
                {data && data.items.length === 0 && <p className="p-8 text-center text-mist">Aucun client trouvé.</p>}
            </div>

            {data && data.total_pages > 1 && (
                <div className="mt-4 flex items-center justify-end gap-3 text-sm">
                    <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="cursor-pointer rounded-full bg-white px-4 py-2 shadow-soft disabled:opacity-40">Précédent</button>
                    <span className="text-mist">{page} / {data.total_pages}</span>
                    <button type="button" disabled={page >= data.total_pages} onClick={() => setPage((p) => p + 1)} className="cursor-pointer rounded-full bg-white px-4 py-2 shadow-soft disabled:opacity-40">Suivant</button>
                </div>
            )}
        </div>
    );
}
