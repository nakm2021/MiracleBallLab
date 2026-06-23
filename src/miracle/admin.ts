export const ADMIN_UNLOCK_STORAGE_KEY = "miracleAdminUnlocked";
export const ADMIN_PASSCODE_SHA256 = "e8a86901814993b1da9c180e735c2064c95886b8aeb7f70819d8201a4fbcb60d";

export async function sha256Hex(value: string): Promise<string> {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyAdminPasscode(value: string): Promise<boolean> {
    return await sha256Hex(value) === ADMIN_PASSCODE_SHA256;
}
