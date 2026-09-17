import emptyProviderAdapter from "./empty-provider-adapter.js";
import knowledgeGraphAdapter from "./knowledge-graph-adapter.js";
import p4rAdapter from "./p4r-adapter.js";
import p5Adapter from "./p5-adapter.js";
import reasoningBookAdapter from "./reasoning-book-adapter.js";
import referenceCorpusAdapter from "./reference-corpus-adapter.js";

export const KNOWLEDGE_ADAPTERS = Object.freeze([
  emptyProviderAdapter,
  knowledgeGraphAdapter,
  p4rAdapter,
  p5Adapter,
  reasoningBookAdapter,
  referenceCorpusAdapter,
].sort((left, right) => left.adapterId.localeCompare(right.adapterId)));
