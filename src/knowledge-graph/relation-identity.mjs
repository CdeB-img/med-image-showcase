import { KNOWLEDGE_GRAPH_NAMESPACE } from "./schema.mjs";
import { sha256Digest } from "./migration/stable-json.mjs";

export const RELATION_IDENTITY_VERSION = "2.0.0";
export const RELATION_IDENTITY_ALGORITHM = "noxia-full-endpoint-sha256-v2";

export const createLegacyRelationId = ({ relationType, sourceEntityId, targetEntityId }) => (
  `${KNOWLEDGE_GRAPH_NAMESPACE}:relation:${relationType.toLowerCase()}:${sourceEntityId.split(":").at(-1)}:${targetEntityId.split(":").at(-1)}`
);

export const createRelationIdentityMaterial = ({
  relationType,
  sourceEntityId,
  targetEntityId,
  discriminator = null,
}) => Object.freeze({
  algorithm: RELATION_IDENTITY_ALGORITHM,
  identityVersion: RELATION_IDENTITY_VERSION,
  namespace: KNOWLEDGE_GRAPH_NAMESPACE,
  sourceEntityId,
  relationType,
  targetEntityId,
  discriminator,
});

export const createRelationIdentity = (input) => {
  const material = createRelationIdentityMaterial(input);
  const digest = sha256Digest(material);
  return Object.freeze({
    relationId: `${KNOWLEDGE_GRAPH_NAMESPACE}:relation:v2:${input.relationType.toLowerCase()}:${digest}`,
    relationIdentityVersion: RELATION_IDENTITY_VERSION,
    relationIdentityDigest: digest,
    identityDiscriminator: input.discriminator ?? null,
    identityMaterial: material,
  });
};
