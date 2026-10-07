export const documentTextSha256 = async (text: string) => {
  if (!globalThis.crypto?.subtle) throw new Error("DOC_ARCHIVE_HASH_UNAVAILABLE");
  const hash = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, "0")).join("");
};
