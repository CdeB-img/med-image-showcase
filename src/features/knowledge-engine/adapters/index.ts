import knowledgeGraphAdapter from "./knowledge-graph-adapter";
import p4rAdapter from "./p4r-adapter";
import p5Adapter from "./p5-adapter";
import reasoningBookAdapter from "./reasoning-book-adapter";

export const KNOWLEDGE_ADAPTERS = Object.freeze([
  knowledgeGraphAdapter,
  p4rAdapter,
  p5Adapter,
  reasoningBookAdapter,
].sort((left, right) => left.adapterId.localeCompare(right.adapterId)));

