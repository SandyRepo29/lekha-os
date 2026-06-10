export const dynamic = "force-dynamic";

import Link from "next/link";
import { GitBranch, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TEMPLATES = [
  {
    category: "Vendor Governance",
    color: "bg-blue-500/20 text-blue-400",
    items: [
      { name: "Vendor Onboarding", description: "End-to-end vendor intake, document collection, risk assessment and approval", trigger: "manual", nodes: ["Start", "Document Collection", "Risk Assessment", "Security Review", "Approval", "Activate Vendor", "End"] },
      { name: "Vendor Reassessment", description: "Periodic security assessment and compliance review for existing vendors", trigger: "scheduled", nodes: ["Start", "Notify Vendor", "Assessment", "Score Review", "Approval", "Update Records", "End"] },
      { name: "Vendor Termination", description: "Secure offboarding and data deletion workflow", trigger: "manual", nodes: ["Start", "Notify Vendor", "Data Deletion", "Access Revocation", "Final Audit", "Close Vendor", "End"] },
    ],
  },
  {
    category: "Risk Management",
    color: "bg-red-500/20 text-red-400",
    items: [
      { name: "Risk Review", description: "Periodic risk review with scoring update and treatment assignment", trigger: "scheduled", nodes: ["Start", "Risk Assessment", "Score Update", "Treatment Review", "Owner Approval", "Close", "End"] },
      { name: "Risk Escalation", description: "Escalate high-severity risks to executive leadership", trigger: "score_threshold", nodes: ["Start", "Notify Risk Owner", "Executive Review", "Board Notification", "Treatment Plan", "Monitor", "End"] },
      { name: "Risk Acceptance", description: "Formal risk acceptance workflow with documented business justification", trigger: "manual", nodes: ["Start", "Justification", "Manager Review", "CISO Approval", "Board Notification", "Log Acceptance", "End"] },
    ],
  },
  {
    category: "Policy Governance",
    color: "bg-purple-500/20 text-purple-400",
    items: [
      { name: "Policy Creation", description: "Draft, review, approve and publish new governance policies", trigger: "manual", nodes: ["Start", "Draft Policy", "Legal Review", "CISO Review", "Board Approval", "Publish", "End"] },
      { name: "Policy Attestation", description: "Collect employee acknowledgement of policy acceptance", trigger: "scheduled", nodes: ["Start", "Notify Employees", "Collect Attestations", "Chase Non-Compliant", "Report Results", "Close", "End"] },
      { name: "Policy Renewal", description: "Annual policy review and renewal with versioning", trigger: "date_reached", nodes: ["Start", "Owner Review", "Update Policy", "Approval", "Publish New Version", "Notify Teams", "End"] },
    ],
  },
  {
    category: "Privacy & DPDP",
    color: "bg-teal-500/20 text-teal-400",
    items: [
      { name: "DSR Processing", description: "Handle Data Subject Requests within DPDP Act timelines (30 days)", trigger: "record_created", nodes: ["Start", "Verify Identity", "Locate Data", "Review Request", "Fulfil Request", "Notify Subject", "End"] },
      { name: "Privacy Assessment", description: "Privacy Impact Assessment for new data processing activities", trigger: "manual", nodes: ["Start", "Data Inventory", "Risk Assessment", "DPO Review", "Approval", "Implement Controls", "End"] },
    ],
  },
  {
    category: "Contract Governance",
    color: "bg-orange-500/20 text-orange-400",
    items: [
      { name: "Contract Review", description: "Legal, security and privacy review for new contracts", trigger: "manual", nodes: ["Start", "Legal Review", "Security Review", "Privacy Review", "Business Approval", "Sign Contract", "End"] },
      { name: "Contract Renewal", description: "Proactive renewal workflow triggered 90 days before expiry", trigger: "date_reached", nodes: ["Start", "Notify Owner", "Renewal Terms", "Negotiation", "Approval", "Execute Renewal", "End"] },
    ],
  },
  {
    category: "Issue Remediation",
    color: "bg-yellow-500/20 text-yellow-400",
    items: [
      { name: "Issue Assignment", description: "Automatically assign and track governance issues to owners", trigger: "record_created", nodes: ["Start", "Classify Issue", "Assign Owner", "Create Tasks", "Notify Owner", "Track Progress", "End"] },
      { name: "Critical Escalation", description: "Escalate critical issues to executive leadership within 24 hours", trigger: "score_threshold", nodes: ["Start", "Notify Owner", "24h Check", "Executive Alert", "Board Notification", "Remediation Plan", "End"] },
      { name: "Exception Approval", description: "Formal exception approval with business justification and expiry", trigger: "manual", nodes: ["Start", "Justification", "Risk Assessment", "Manager Approval", "CISO Sign-off", "Log Exception", "End"] },
    ],
  },
  {
    category: "Audit Management",
    color: "bg-indigo-500/20 text-indigo-400",
    items: [
      { name: "Audit Planning", description: "Scope, plan and kick off an audit program", trigger: "manual", nodes: ["Start", "Define Scope", "Select Controls", "Assign Auditors", "Kick Off", "Schedule", "End"] },
      { name: "CAPA Approval", description: "Review and approve corrective action plans for audit findings", trigger: "record_created", nodes: ["Start", "Review Finding", "Generate CAPA", "Owner Review", "Approval", "Assign Tasks", "End"] },
    ],
  },
];

export default async function WorkflowTemplatesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Workflow Templates™</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          Pre-built governance workflows — select a template to start from
        </p>
      </div>

      {TEMPLATES.map((group) => (
        <div key={group.category}>
          <h2 className="text-sm font-semibold text-[var(--color-ink-dim)] uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${group.color.split(" ")[0]}`} />
            {group.category}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((tpl) => (
              <Card key={tpl.name} className="p-5 flex flex-col gap-3 hover:bg-white/[0.03] transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${group.color}`}>
                    <GitBranch className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{tpl.name}</p>
                    <p className="text-xs text-[var(--color-ink-dim)] mt-0.5 line-clamp-2">{tpl.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {tpl.nodes.map((node, i) => (
                    <span key={i} className="flex items-center gap-0.5">
                      <span className="text-xs text-[var(--color-ink-faint)]">{node}</span>
                      {i < tpl.nodes.length - 1 && <ArrowRight className="h-2.5 w-2.5 text-[var(--color-ink-faint)]" />}
                    </span>
                  ))}
                </div>
                <div className="mt-auto">
                  <Link href={`/workflow-studio/new?template=${encodeURIComponent(tpl.name)}&module=custom&trigger=${tpl.trigger}`}>
                    <Button variant="outline" size="sm" className="w-full">Use Template</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
