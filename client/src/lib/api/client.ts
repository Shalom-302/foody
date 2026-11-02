import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth";
import type { ApiResponse } from "@/types/foody";
import { API_URL } from "./config";

export { API_URL };

export const api = axios.create({
    baseURL: API_URL,
    // Sends the httpOnly refresh cookie to /auth/refresh.
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
    const token = useAuthStore.getState().accessToken;
    if (!token) return null;
    try {
        const res = await axios.post<ApiResponse<{ access_token: string }>>(
            `${API_URL}/auth/refresh`,
            null,
            { withCredentials: true, headers: { Authorization: `Bearer ${token}` } },
        );
        const fresh = res.data.data.access_token;
        useAuthStore.getState().setAccessToken(fresh);
        return fresh;
    } catch {
        useAuthStore.getState().clear();
        return null;
    }
}

api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
        const isAuthCall = original?.url?.startsWith("/auth/whatsapp") || original?.url === "/auth/refresh";
        if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
            original._retry = true;
            refreshing ??= refreshAccessToken().finally(() => {
                refreshing = null;
            });
            const fresh = await refreshing;
            if (fresh) {
                original.headers.Authorization = `Bearer ${fresh}`;
                return api(original);
            }
        }
        return Promise.reject(error);
    },
);

/** The API's French message, or a generic fallback. */
export function apiErrorMessage(error: unknown, fallback = "Une erreur est survenue. Réessayez."): string {
    if (axios.isAxiosError(error)) {
        const msg = (error.response?.data as { msg?: string } | undefined)?.msg;
        if (error.response?.status === 422) return "Vérifiez les informations saisies.";
        if (msg && error.response && error.response.status < 500) return msg;
        if (!error.response) return "Connexion impossible. Vérifiez votre réseau.";
    }
    return fallback;
}

export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
    const res = await promise;
    return res.data.data;
}
