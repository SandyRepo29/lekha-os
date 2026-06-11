import { IntegrationHubNav } from "@/components/integration-hub/integration-hub-nav";

export default function IntegrationHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <IntegrationHubNav />
      {children}
    </div>
  );
}
