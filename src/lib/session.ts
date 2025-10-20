// src/lib/session.ts
// Tiny signed-token helpers using Web Crypto (no node:crypto imports)

type Payload = {
    email: string;
    exp: number; // unix seconds
};

const enc = new TextEncoder();

/** base64url helpers */
function b64url(buf: ArrayBuffer | Uint8Array) {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const b64 = Buffer.from(bin, "binary").toString("base64");
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlFromString(s: string) {
    return b64url(enc.encode(s));
}

/** import an HMAC-SHA256 key from a secret */
async function hmacKey(secret: string) {
    return crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
    );
}

/** HMAC-SHA256 sign and return base64url */
async function hmacSign(secret: string, data: string) {
    const key = await hmacKey(secret);
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
    return b64url(sig);
}

export async function createSignedToken(
    payload: { email: string },
    opts?: { expiresInSeconds?: number }
): Promise<string> {
    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error("AUTH_SECRET missing");

    const header = { alg: "HS256", typ: "JWT" };
    const exp =
        Math.floor(Date.now() / 1000) + (opts?.expiresInSeconds ?? 60 * 60 * 24 * 7);

    const body: Payload = { email: payload.email, exp };

    const h = b64urlFromString(JSON.stringify(header));
    const p = b64urlFromString(JSON.stringify(body));
    const toSign = `${h}.${p}`;
    const s = await hmacSign(secret, toSign);

    return `${toSign}.${s}`;
}

export async function verifySignedToken(
    token: string | undefined | null
): Promise<{ valid: boolean; payload?: Payload }> {
    if (!token) return { valid: false };
    const secret = process.env.AUTH_SECRET;
    if (!secret) return { valid: false };

    const parts = token.split(".");
    if (parts.length !== 3) return { valid: false };

    const [h, p, s] = parts;
    const toSign = `${h}.${p}`;
    const expected = await hmacSign(secret, toSign);

    if (s !== expected) return { valid: false };

    // decode payload
    try {
        const json = Buffer.from(p.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
            "utf8"
        );
        const payload = JSON.parse(json) as Payload;
        if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
            return { valid: false };
        }
        return { valid: true, payload };
    } catch {
        return { valid: false };
    }
}
