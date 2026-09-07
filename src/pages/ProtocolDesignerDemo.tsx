import ProtocolDesignerWorkspace from "@/features/protocol-designer/functional-reset/ProtocolDesignerWorkspace";
import { createScientificTraceCaptureConfiguration } from "@/features/protocol-designer/scientific-execution-trace";

const protocolDesignerTraceCaptureConfigurationFromSearch = (search: string) => {
  const requested = new URLSearchParams(search).get("traceCaptureLevel");
  return requested === "LEVEL_2_DIAGNOSTIC"
    ? createScientificTraceCaptureConfiguration({
      captureLevel: "LEVEL_2_DIAGNOSTIC",
      captureReason: "MANUAL_DIAGNOSTIC",
    })
    : createScientificTraceCaptureConfiguration();
};

export default function ProtocolDesignerDemo() {
  const captureConfiguration = protocolDesignerTraceCaptureConfigurationFromSearch(
    typeof window === "undefined" ? "" : window.location.search,
  );
  return <ProtocolDesignerWorkspace traceCaptureConfiguration={captureConfiguration} />;
}
