// Serves the files uploaded from /admin (product photos, GLB models) stored in
// MinIO, which has no public route on Dokploy. The API builds their URLs as
// `${MINIO_CLOUD_URL}/<bucket>/<file>` with MINIO_CLOUD_URL=https://<domain>/media.
import type { NextRequest } from "next/server";

const MINIO_URL = (process.env.MINIO_INTERNAL_URL || "http://localhost:9000").replace(/\/$/, "");
const BUCKET = process.env.MINIO_BUCKET_NAME || "foody";

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
    const parts = (await params).path;
    // Only the shop bucket, no dot segments.
    if (parts.length < 2 || parts[0] !== BUCKET || parts.some((p) => p === "." || p === ".." || p === "")) {
        return new Response("Not found", { status: 404 });
    }
    let upstream: Response;
    try {
        upstream = await fetch(`${MINIO_URL}/${parts.map(encodeURIComponent).join("/")}`, { cache: "no-store" });
    } catch {
        return new Response("Storage unavailable", { status: 502 });
    }
    if (!upstream.ok) return new Response("Not found", { status: 404 });
    const headers = new Headers({
        "content-type": upstream.headers.get("content-type") || "application/octet-stream",
        // Upload names are unique (uuid): safe to cache for a long time.
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
    });
    const length = upstream.headers.get("content-length");
    if (length) headers.set("content-length", length);
    return new Response(upstream.body, { status: 200, headers });
}

export const dynamic = "force-dynamic";
