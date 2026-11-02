// Server- and client-safe (no browser globals): imported by server components too.

// Browser: same-origin `/api/v1`, proxied by app/api/v1 to the API (one image
// fits any domain). Set NEXT_PUBLIC_API_URL only to bypass the proxy.
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

// Server components call the API directly over the internal network.
export const SERVER_API_URL = `${(process.env.API_INTERNAL_URL || "http://localhost:8000").replace(/\/$/, "")}/api/v1`;
