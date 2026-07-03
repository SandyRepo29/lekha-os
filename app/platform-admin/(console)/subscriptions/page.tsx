export const dynamic = "force-dynamic";
import { StubPage } from "../_stubs/stub-page";
export default function Page() {
  return StubPage({ title: "Subscriptions", description: "All active subscriptions, trial expirations, and plan changes." });
}
