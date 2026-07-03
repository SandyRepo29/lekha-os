export const dynamic = "force-dynamic";
import { StubPage } from "../_stubs/stub-page";
export default function Page() {
  return StubPage({ title: "All Users", description: "Cross-tenant user directory with search and filtering." });
}
