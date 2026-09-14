export const PROTOCOL_DESIGNER_PUBLIC_RUNTIME_POLICY = "PROTOCOL_DESIGNER_PUBLIC_RUNTIME_DISABLED_V1" as const;

export type ProtocolDesignerRuntimeEnvironment = Readonly<Record<string, string | undefined>>;

export const isProtocolDesignerProductionRuntime = (environment: ProtocolDesignerRuntimeEnvironment) => (
  environment.VERCEL_ENV === "production"
  || environment.NODE_ENV === "production"
  || environment.NOXIA_DEPLOYMENT_ENV === "production"
);

export const protocolDesignerProviderCallsAllowed = (environment: ProtocolDesignerRuntimeEnvironment) => (
  !isProtocolDesignerProductionRuntime(environment)
);

export const protocolDesignerPublicUiEnabled = (developmentMode: boolean) => developmentMode;
