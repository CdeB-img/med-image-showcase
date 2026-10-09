/** Fingerprints of the structural catalogs produced by the native, explicit
 * Project installer and migrations 002–005. PostgreSQL rehearsal checks this
 * contract against real catalogs; it is not a migration registry or installer. */
export const runtimeSchemaFingerprints = {
  public_project_snapshot: "1779091599f3e8ea27f3c3b9966275c0744680c60765dd25d0c761ff1defc375",
  doc_generation: "175f3d6a1cdb8ad333f1968ade2dbda9c9600d1b328778205f2b4d039ac4c0c9",
  doc_generation_body: "1acf86c6649ea488597a2e55f4fc984f61ac866ec0f7b223d3676d48837a5cdd",
  doc_working_revision: "50a57c90b263384b859bf20e6a179cd6a4c93bb853708190ae807ddac61a5327",
  doc_studio_finalization_intent: "4644d3571c619e2875229a3eb294a755bceb11edab3bce1e4ee2b2036678a67b",
} as const;
export type RuntimeSchemaTable = keyof typeof runtimeSchemaFingerprints;
