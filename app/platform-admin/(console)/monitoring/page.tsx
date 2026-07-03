export const dynamic = "force-dynamic";
import { StubPage } from "../_stubs/stub-page";
export default function Page() {
  return StubPage({ title: "Monitoring", description: "Platform-wide error rates, latency, and alert feed." });
}
