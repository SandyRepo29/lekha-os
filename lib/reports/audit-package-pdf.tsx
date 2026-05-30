import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles } from "./pdf-styles";
import type { Vendor, VendorDocument, VendorReview, Assessment } from "@/lib/db/schema";
import type { ChecklistResult } from "@/lib/services/template-service";

type Props = {
  orgName: string;
  generatedBy: string;
  vendor: Vendor;
  docs: VendorDocument[];
  reviews: VendorReview[];
  assessments: Assessment[];
  checklist: ChecklistResult | null;
  riskScore: { level: string; score: number };
};

const REVIEW_LABELS: Record<string, string> = {
  annual: "Annual", quarterly: "Quarterly", security: "Security", compliance: "Compliance",
};

export function AuditPackagePdf({ orgName, generatedBy, vendor, docs, reviews, assessments, checklist, riskScore }: Props) {
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const validDocs = docs.filter((d) => d.status === "valid").length;
  const expiredDocs = docs.filter((d) => d.status === "expired").length;
  const latestAssessment = assessments.find((a) => a.status === "completed");
  const latestReview = reviews[0];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>LEKHA OS</Text>
            <Text style={styles.brandTag}>Vendor Audit Package</Text>
          </View>
          <View style={styles.reportTitle}>
            <Text style={styles.reportName}>{vendor.name}</Text>
            <Text style={styles.reportMeta}>{orgName} · {date}</Text>
            <Text style={styles.reportMeta}>Prepared by {generatedBy}</Text>
          </View>
        </View>

        {/* Vendor summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendor Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}><Text style={styles.summaryValue}>{vendor.complianceScore}</Text><Text style={styles.summaryLabel}>Compliance Score</Text></View>
            <View style={styles.summaryCard}><Text style={styles.summaryValue}>{riskScore.score}</Text><Text style={styles.summaryLabel}>Risk Score ({riskScore.level})</Text></View>
            <View style={styles.summaryCard}><Text style={styles.summaryValue}>{validDocs}</Text><Text style={styles.summaryLabel}>Valid Documents</Text></View>
            <View style={styles.summaryCard}><Text style={styles.summaryValue}>{expiredDocs}</Text><Text style={styles.summaryLabel}>Expired Documents</Text></View>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCellBold, { flex: 0.5 }]}>Category</Text><Text style={styles.tableCell}>{vendor.category ?? "—"}</Text>
            <Text style={[styles.tableCellBold, { flex: 0.5 }]}>Status</Text><Text style={styles.tableCell}>{vendor.status}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCellBold, { flex: 0.5 }]}>Risk level</Text><Text style={styles.tableCell}>{vendor.riskLevel}</Text>
            <Text style={[styles.tableCellBold, { flex: 0.5 }]}>Owner</Text><Text style={styles.tableCell}>{vendor.ownerName ?? "Not assigned"}</Text>
          </View>
          {vendor.aiSummary && (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.sectionTitle, { fontSize: 9 }]}>AI Summary</Text>
              <Text style={{ fontSize: 9, color: "#646a82", lineHeight: 1.5 }}>{vendor.aiSummary}</Text>
            </View>
          )}
        </View>

        {/* Document inventory */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Document Inventory ({docs.length})</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellBold, { flex: 2 }]}>Document</Text>
              <Text style={styles.tableCellBold}>Status</Text>
              <Text style={styles.tableCellBold}>Issued</Text>
              <Text style={styles.tableCellBold}>Expires</Text>
            </View>
            {docs.map((d) => (
              <View key={d.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{d.documentType}</Text>
                <View style={styles.tableCell}><View style={[styles.badge, d.status === "valid" ? styles.badgeGreen : d.status === "expired" ? styles.badgeRed : styles.badgeYellow]}><Text>{d.status}</Text></View></View>
                <Text style={styles.tableCell}>{d.issuedOn ?? "—"}</Text>
                <Text style={styles.tableCell}>{d.expiresOn ?? "—"}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Checklist */}
        {checklist && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compliance Checklist ({checklist.templateName}) — {checklist.completionScore}%</Text>
            {checklist.items.filter((i) => i.isRequired).map((item) => (
              <View key={item.documentType} style={[styles.tableRow, { paddingVertical: 3 }]}>
                <Text style={[styles.tableCell, { flex: 0.15 }]}>{item.uploaded && item.status !== "expired" ? "✓" : "✗"}</Text>
                <Text style={{ flex: 1, fontSize: 9, color: item.uploaded ? "#1a1a2e" : "#646a82" }}>{item.documentType}</Text>
                <Text style={[styles.tableCell, { fontSize: 9, color: "#646a82" }]}>{item.status}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Assessment */}
        {latestAssessment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Latest Security Assessment</Text>
            <View style={styles.tableRow}>
              <Text style={styles.tableCellBold}>Title</Text><Text style={styles.tableCell}>{latestAssessment.title}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCellBold}>Score</Text><Text style={styles.tableCell}>{latestAssessment.score ?? "—"}/100</Text>
              <Text style={styles.tableCellBold}>Completed</Text><Text style={styles.tableCell}>{latestAssessment.completedAt ? new Date(latestAssessment.completedAt).toLocaleDateString("en-IN") : "—"}</Text>
            </View>
          </View>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Review History ({reviews.length})</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCellBold}>Type</Text>
                <Text style={styles.tableCellBold}>Status</Text>
                <Text style={styles.tableCellBold}>Date</Text>
                <Text style={[styles.tableCellBold, { flex: 2 }]}>Summary</Text>
              </View>
              {reviews.map((r) => (
                <View key={r.id} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{REVIEW_LABELS[r.reviewType] ?? r.reviewType}</Text>
                  <Text style={styles.tableCell}>{r.status}</Text>
                  <Text style={styles.tableCell}>{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{r.summary ?? "—"}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer}><Text>Lekha OS — Confidential Audit Package</Text><Text>{date}</Text></View>
      </Page>
    </Document>
  );
}
