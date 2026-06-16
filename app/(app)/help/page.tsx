import { requireUser } from "@/lib/auth/session";
import { HelpDocsClient } from "@/components/help/help-docs-client";

export const dynamic = "force-dynamic";

export default async function HelpPage() {
  await requireUser();
  return <HelpDocsClient />;
}
