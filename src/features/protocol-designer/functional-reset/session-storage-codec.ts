import { logicalDigest } from "@/features/knowledge-engine/canonical";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type Token = null | boolean | number | ["s" | "r", number];
type Node = ["array", Token[]] | ["object", Array<[number, Token]>];
const FORMAT = "NOXIA_SESSION_DICTIONARY_V1";

/** Lossless physical encoding only: repeated source snapshots remain independent immutable JSON values after loading. */
export const encodeSessionStorage = (session: unknown): string => {
  const raw = JSON.stringify(session);
  if (raw.length < 262_144) return raw;
  const strings: string[] = []; const stringIds = new Map<string, number>();
  const nodes: Node[] = []; const nodeIds = new Map<string, number>();
  const stringId = (value: string) => {
    const found = stringIds.get(value);
    if (found !== undefined) return found;
    const id = strings.length; strings.push(value); stringIds.set(value, id); return id;
  };
  const encode = (value: Json): Token => {
    if (typeof value === "string") return ["s", stringId(value)];
    if (value === null) return null;
    if (typeof value === "boolean" || typeof value === "number") return value;
    const fingerprint = JSON.stringify(value);
    const found = nodeIds.get(fingerprint);
    if (found !== undefined) return ["r", found];
    const node: Node = Array.isArray(value) ? ["array", value.map(encode)]
      : ["object", Object.entries(value).map(([key, child]) => [stringId(key), encode(child)])];
    const id = nodes.length; nodes.push(node); nodeIds.set(fingerprint, id); return ["r", id];
  };
  const root = encode(JSON.parse(raw) as Json);
  const packed = JSON.stringify({ format: FORMAT, originalLength: raw.length, digest: logicalDigest(raw), strings, nodes, root });
  return packed.length < raw.length ? packed : raw;
};

export const decodeSessionStorage = (raw: string): unknown => {
  const parsed = JSON.parse(raw);
  if (parsed?.format !== FORMAT) return parsed;
  if (!Array.isArray(parsed.strings) || !parsed.strings.every((value: unknown) => typeof value === "string")
    || !Array.isArray(parsed.nodes) || !Number.isSafeInteger(parsed.originalLength) || parsed.originalLength < 0) throw new Error("SESSION_DICTIONARY_INVALID");
  const strings = parsed.strings as string[]; const nodes = parsed.nodes as unknown[];
  const cache = new Map<number, Json>();
  const readString = (id: unknown) => {
    if (!Number.isSafeInteger(id) || Number(id) < 0 || Number(id) >= strings.length) throw new Error("SESSION_DICTIONARY_STRING_INVALID");
    return strings[Number(id)]!;
  };
  const decode = (token: unknown, upperBound: number): Json => {
    if (token === null) return null;
    if (typeof token === "boolean" || typeof token === "number" && Number.isFinite(token)) return token;
    if (!Array.isArray(token) || token.length !== 2) throw new Error("SESSION_DICTIONARY_TOKEN_INVALID");
    if (token[0] === "s") return readString(token[1]);
    const id = token[1];
    // Child nodes always precede their parents. Forward/self references are invalid.
    if (token[0] !== "r" || !Number.isSafeInteger(id) || id < 0 || id >= upperBound) throw new Error("SESSION_DICTIONARY_REFERENCE_INVALID");
    const retained = cache.get(id); if (retained !== undefined) return retained;
    const node = nodes[id];
    if (!Array.isArray(node) || node.length !== 2 || !Array.isArray(node[1])) throw new Error("SESSION_DICTIONARY_NODE_INVALID");
    let value: Json;
    if (node[0] === "array") value = node[1].map((child) => decode(child, id));
    else if (node[0] === "object") value = Object.fromEntries(node[1].map((pair) => {
      if (!Array.isArray(pair) || pair.length !== 2) throw new Error("SESSION_DICTIONARY_PROPERTY_INVALID");
      return [readString(pair[0]), decode(pair[1], id)];
    }));
    else throw new Error("SESSION_DICTIONARY_NODE_INVALID");
    cache.set(id, value); return value;
  };
  const decoded = JSON.stringify(decode(parsed.root, nodes.length));
  if (decoded.length !== parsed.originalLength || logicalDigest(decoded) !== parsed.digest) throw new Error("SESSION_DICTIONARY_INTEGRITY_MISMATCH");
  // Do not introduce object aliases between historically independent versions.
  return JSON.parse(decoded);
};
