import { useEffect, useState } from "react";

/** False during SSR and the first client render: guards localStorage-backed stores. */
export function useHydrated(): boolean {
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => setHydrated(true), []);
    return hydrated;
}
