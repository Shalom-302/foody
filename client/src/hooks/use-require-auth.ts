"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { isAdmin, useAuthStore } from "@/store/auth";

/**
 * Client-side gate: sends visitors to /auth (then back here). It only shapes
 * the UI: the API enforces authentication and the admin role on every call.
 */
export function useRequireAuth({ admin = false } = {}) {
    const hydrated = useHydrated();
    const router = useRouter();
    const pathname = usePathname();
    const user = useAuthStore((s) => s.user);

    const allowed = !!user && (!admin || isAdmin(user));

    useEffect(() => {
        if (!hydrated) return;
        if (!user) router.replace(`/auth?next=${encodeURIComponent(pathname)}`);
        else if (admin && !isAdmin(user)) router.replace("/");
    }, [hydrated, user, admin, pathname, router]);

    return { ready: hydrated && allowed, user };
}
