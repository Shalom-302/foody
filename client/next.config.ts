import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    poweredByHeader: false,
    // Self-contained server bundle for the Docker image (see Dockerfile).
    output: "standalone",
    // Pin the workspace root: without it Next can pick up a lockfile higher in
    // the tree and trace the wrong files into the standalone build.
    outputFileTracingRoot: path.join(__dirname),
    // A production build and a running `next dev` share `.next`; set
    // NEXT_DIST_DIR to build elsewhere while the dev server keeps running.
    distDir: process.env.NEXT_DIST_DIR || ".next",
    // three ships untranspiled ESM in its examples/addons, which drei pulls in.
    transpilePackages: ["three"],
    images: {
        remotePatterns: [
            // Placeholder product photos (Unsplash) and uploads stored in MinIO.
            { protocol: "https", hostname: "images.unsplash.com" },
            { protocol: "http", hostname: "localhost", port: "9000" },
        ],
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "X-Frame-Options", value: "DENY" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=(), payment=()" },
                ],
            },
            // Public caching only for immutable static assets: a blanket
            // `s-maxage` would let a CDN serve personalised pages to others.
            {
                source: "/_next/static/:path*",
                headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
            },
        ];
    },
};

export default nextConfig;
