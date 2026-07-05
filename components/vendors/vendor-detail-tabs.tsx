"use client";

import { Tabs } from "@/components/ui/tabs";
import {
  type VendorTabProps,
  OverviewPanel,
  AssessmentsPanel,
  RisksPanel,
  CompliancePanel,
  EvidencePanel,
  AuditsPanel,
  ContractsPanel,
  MonitoringPanel,
  TrustScorePanel,
  ActivityPanel,
  LifecyclePanel,
  ContactsPanel,
  TimelinePanel,
} from "./vendor-detail-tab-panels";

type Props = VendorTabProps;

export function VendorDetailTabs(props: Props) {
  const {
    assessments, checklist, docs, expiredCount, openRequests,
    vendorRisks = [], vendorContracts = [],
  } = props;

  const tabs = [
    { id: "overview", label: "Overview" },
    {
      id: "assessments",
      label: "Assessments",
      count: assessments.length > 0 ? assessments.length : undefined,
    },
    {
      id: "risks",
      label: "Risks",
      count: vendorRisks.length > 0 ? vendorRisks.length : undefined,
      badge: vendorRisks.some((r) => r.riskLevel === "critical" || r.category === "critical") ? "danger" as const : undefined,
    },
    {
      id: "compliance",
      label: "Compliance",
      count: checklist ? checklist.requiredTotal - checklist.requiredDone : undefined,
      badge: checklist && checklist.completionScore < 100 ? "warn" as const : undefined,
    },
    {
      id: "evidence",
      label: "Evidence",
      count: docs.length,
      badge: expiredCount > 0 ? "danger" as const : undefined,
    },
    { id: "audits", label: "Audits" },
    {
      id: "contracts",
      label: "Contracts",
      count: vendorContracts.length > 0 ? vendorContracts.length : undefined,
    },
    { id: "monitoring", label: "Monitoring" },
    { id: "trust-score", label: "Trust Score™" },
    {
      id: "activity",
      label: "Activity",
      count: openRequests > 0 ? openRequests : undefined,
      badge: openRequests > 0 ? "warn" as const : undefined,
    },
    { id: "lifecycle", label: "Lifecycle" },
    { id: "contacts",  label: "Contacts" },
    { id: "timeline",  label: "Timeline" },
  ];

  return (
    <Tabs tabs={tabs} defaultTab="overview">
      {(activeTab) => (
        <>
          {activeTab === "overview" && <OverviewPanel {...props} />}
          {activeTab === "assessments" && <AssessmentsPanel {...props} />}
          {activeTab === "risks" && <RisksPanel {...props} />}
          {activeTab === "compliance" && <CompliancePanel {...props} />}
          {activeTab === "evidence" && <EvidencePanel {...props} />}
          {activeTab === "audits" && <AuditsPanel />}
          {activeTab === "contracts" && <ContractsPanel {...props} />}
          {activeTab === "monitoring" && <MonitoringPanel />}
          {activeTab === "trust-score" && <TrustScorePanel {...props} />}
          {activeTab === "activity" && <ActivityPanel {...props} />}
          {activeTab === "lifecycle" && <LifecyclePanel {...props} />}
          {activeTab === "contacts" && <ContactsPanel {...props} />}
          {activeTab === "timeline" && <TimelinePanel {...props} />}
        </>
      )}
    </Tabs>
  );
}
