"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
    const [client] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
                },
            }),
    );
    return (
        <QueryClientProvider client={client}>
            {children}
            <Toaster
                position="top-center"
                toastOptions={{
                    classNames: {
                        toast: "!rounded-2xl !border-butter !bg-white !text-cocoa !shadow-lift",
                    },
                }}
            />
        </QueryClientProvider>
    );
}
