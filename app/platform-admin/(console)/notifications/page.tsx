export const dynamic = "force-dynamic";
import { StubPage } from "../_stubs/stub-page";
export default function Page() {
  return StubPage({ title: "Notifications", description: "Send platform-wide or org-targeted notifications to tenants." });
}
