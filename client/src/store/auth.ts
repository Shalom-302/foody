import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { User } from "@/types/foody";

type AuthState = {
    accessToken: string | null;
    user: User | null;
    setSession: (accessToken: string, user: User) => void;
    setAccessToken: (accessToken: string) => void;
    setUser: (user: User) => void;
    clear: () => void;
};

// The access token is kept in localStorage; the refresh token lives in an
// httpOnly cookie set by the API and is never readable from JavaScript.
export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            user: null,
            setSession: (accessToken, user) => set({ accessToken, user }),
            setAccessToken: (accessToken) => set({ accessToken }),
            setUser: (user) => set({ user }),
            clear: () => set({ accessToken: null, user: null }),
        }),
        { name: "foody-auth", storage: createJSONStorage(() => localStorage) },
    ),
);

export const isAdmin = (user: User | null) => !!user?.roles?.some((r) => r.name === "admin");
