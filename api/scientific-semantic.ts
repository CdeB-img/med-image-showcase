import { SCIENTIFIC_INTERPRETATION_API_VERSION } from "../src/features/scientific-interpretation/transport.js";
import { handleScientificInterpretation, type ApiRequest, type ApiResponse } from "./scientific-interpretation.js";

/** @deprecated Runtime-neutral clients must use /api/scientific-interpretation. */
export default async function deprecatedScientificSemanticAlias(request: ApiRequest, response: ApiResponse) {
  response.setHeader("deprecation", "true");
  response.setHeader("link", "</api/scientific-interpretation>; rel=successor-version");
  const body = request.body && typeof request.body === "object" ? request.body as Record<string, unknown> : {};
  if (body.apiVersion !== SCIENTIFIC_INTERPRETATION_API_VERSION && Array.isArray(body.messages)) {
    request = {
      ...request,
      body: {
        apiVersion: SCIENTIFIC_INTERPRETATION_API_VERSION,
        conversation: {
          conversationId: typeof body.sessionId === "string" ? body.sessionId : "legacy-api-session",
          language: body.language === "en" ? "en" : "fr",
          turns: body.messages.map((message, index) => {
            const value = message && typeof message === "object" ? message as Record<string, unknown> : {};
            return {
              turnId: typeof value.messageId === "string" ? value.messageId : `legacy-turn-${index}`,
              role: value.role === "ASSISTANT" ? "NOXIA" : "USER",
              content: typeof value.content === "string" ? value.content : "",
              createdAt: typeof value.createdAt === "string" ? value.createdAt : undefined,
            };
          }),
        },
        previousContribution: null,
      },
    };
  }
  return handleScientificInterpretation(request, response);
}
