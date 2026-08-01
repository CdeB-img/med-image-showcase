import {
  KNOWLEDGE_GRAPH_NAMESPACE,
  KNOWLEDGE_GRAPH_UPDATED_AT,
  KNOWLEDGE_GRAPH_VERSION,
} from "./schema.mjs";
import { createLegacyRelationId, createRelationIdentity } from "./relation-identity.mjs";

export const entity = (entityType, slug, preferredLabel, {
  aliases = [],
  description,
  sourceRefs,
  evidenceStatus = "UNKNOWN",
  status = "active",
  visibility = "internal",
  properties = {},
} = {}) => ({
  entityId: `${KNOWLEDGE_GRAPH_NAMESPACE}:${entityType.toLowerCase()}:${slug}`,
  entityType,
  namespace: KNOWLEDGE_GRAPH_NAMESPACE,
  preferredLabel,
  aliases,
  description,
  status,
  version: KNOWLEDGE_GRAPH_VERSION,
  visibility,
  sourceRefs,
  evidenceStatus,
  createdFrom: sourceRefs[0],
  updatedAt: KNOWLEDGE_GRAPH_UPDATED_AT,
  properties,
});

export const relation = (relationType, sourceId, targetId, {
  sourceRefs,
  description,
  evidenceStatus = "UNKNOWN",
  status = "active",
  properties = {},
  identityDiscriminator = null,
} = {}) => {
  const identity = createRelationIdentity({
    relationType,
    sourceEntityId: sourceId,
    targetEntityId: targetId,
    discriminator: identityDiscriminator,
  });
  return {
    relationId: identity.relationId,
    relationIdentityVersion: identity.relationIdentityVersion,
    relationIdentityDigest: identity.relationIdentityDigest,
    identityDiscriminator: identity.identityDiscriminator,
    legacyRelationIds: [createLegacyRelationId({ relationType, sourceEntityId: sourceId, targetEntityId: targetId })],
    relationType,
    sourceId,
    targetId,
    description,
    status,
    version: KNOWLEDGE_GRAPH_VERSION,
    sourceRefs,
    evidenceStatus,
    createdFrom: sourceRefs[0],
    updatedAt: KNOWLEDGE_GRAPH_UPDATED_AT,
    properties,
  };
};
