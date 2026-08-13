import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CORE_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_ROOT = path.resolve(CORE_ROOT, "../registry");
const readJson = (fileName) =>
  JSON.parse(fs.readFileSync(path.join(REGISTRY_ROOT, fileName), "utf8"));

const propertyRegistryDocument = readJson("property-registry.json");
export const FAILURE_DISPOSITION_REGISTRY = Object.freeze(
  readJson("failure-disposition-registry.json"),
);

export const PROPERTY_REGISTRY = Object.freeze(
  Object.fromEntries(
    propertyRegistryDocument.properties.map((property) => [property.id, Object.freeze(property)]),
  ),
);

export const PROPERTY_ORDER = Object.freeze(
  propertyRegistryDocument.properties.map((property) => property.id),
);

export const ABSOLUTE_PROPERTY_IDS = Object.freeze(
  propertyRegistryDocument.properties
    .filter((property) => property.absolute)
    .map((property) => property.id),
);

export const STATISTICAL_PROPERTY_IDS = Object.freeze(
  propertyRegistryDocument.properties
    .filter((property) => !property.absolute)
    .map((property) => property.id),
);
