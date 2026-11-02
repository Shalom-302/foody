import type { Metadata } from "next";
import { Suspense } from "react";
import { WhatsappLogin } from "@/components/auth/whatsapp-login";

export const metadata: Metadata = { title: "Connexion" };

export default function AuthPage() {
    return (
        <Suspense>
            <WhatsappLogin />
        </Suspense>
    );
}
