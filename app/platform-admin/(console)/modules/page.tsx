export const dynamic = "force-dynamic";
import { StubPage } from "../_stubs/stub-page";
export default function Page() {
  return StubPage({ title: "Module Registry", description: "All 32 AUDT modules with version and health status." });
}
