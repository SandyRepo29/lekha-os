import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ExecutiveSummaryReport } from "@/lib/services/ai-insights-service";
import type { Vendor } from "@/lib/db/schema";

const s = StyleSheet.create({
  page:        { fontFamily: "Helvetica", fontSize: 10, padding: 48, backgroundColor: "#ffffff", color: "#1a1a2e" },
  // Header / cover
  headerBar:   { backgroundColor: "#4f46e5", borderRadius: 4, paddingTop: 24, paddingBottom: 24, paddingLeft: 32, paddingRight: 32, marginBottom: 32 },
  brandLine:   { fontSize: 11, fontFamily: "Helvetica-Bold", color: "rgba(255,255,255,0.6)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 },
  docTitle:    { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#ffffff", marginBottom: 4 },
  vendorName:  { fontSize: 16, color: "rgba(255,255,255,0.85)", marginBottom: 12 },
  metaRow:     { flexDirection: "row", gap: 16 },
  metaItem:    { flexDirection: "row", alignItems: "center" },
  metaDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)", marginRight: 6 },
  metaText:    { fontSize: 9, color: "rgba(255,255,255,0.7)" },
  // Sections
  section:     { marginBottom: 22 },
  sectionRule: { borderTopWidth: 1.5, borderTopColor: "#4f46e5", marginBottom: 10 },
  sectionTitle:{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#4f46e5", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 },
  body:        { fontSize: 10, lineHeight: 1.6, color: "#374151" },
  // Score badge
  scoreBadge:  { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  scoreBox:    { paddingTop: 8, paddingBottom: 8, paddingLeft: 16, paddingRight: 16, borderRadius: 8, marginRight: 12 },
  scoreNum:    { fontSize: 28, fontFamily: "Helvetica-Bold" },
  scoreLabel:  { fontSize: 9, marginTop: 2 },
  scoreDetail: { flex: 1, fontSize: 9, color: "#6b7280", lineHeight: 1.5 },
  // Recommendations
  recRow:      { flexDirection: "row", marginBottom: 8 },
  recNum:      { width: 20, height: 20, borderRadius: 10, backgroundColor: "#4f46e5", marginRight: 10, flexShrink: 0 },
  recNumText:  { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff", textAlign: "center", paddingTop: 5 },
  recText:     { flex: 1, fontSize: 10, color: "#374151", lineHeight: 1.5, paddingTop: 2 },
  // Footer
  footer:      { position: "absolute", bottom: 28, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: "#9ca3af", borderTopWidth: 0.5, borderTopColor: "#e5e7eb", borderTopStyle: "solid", paddingTop: 8 },
  // Confidential banner
  confBanner:  { backgroundColor: "#f3f4f6", borderRadius: 4, paddingTop: 6, paddingBottom: 6, paddingLeft: 12, paddingRight: 12, marginBottom: 24, flexDirection: "row", alignItems: "center" },
  confText:    { fontSize: 8, color: "#6b7280", letterSpacing: 0.5 },
});

function scoreColor(score: number) {
  if (score >= 80) return "#059669";
  if (score >= 60) return "#4f46e5";
  if (score >= 40) return "#d97706";
  return "#dc2626";
}

function scoreLabel(score: number) {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "Improving";
  if (score >= 40) return "Needs Attention";
  return "Critical";
}

type Props = {
  vendor: Vendor;
  report: ExecutiveSummaryReport;
  orgName: string;
  generatedBy: string;
};

export function ExecutiveSummaryPdf({ vendor, report, orgName, generatedBy }: Props) {
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const sc = scoreColor(vendor.complianceScore);

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.headerBar}>
          <Text style={s.brandLine}>Lekha OS · Executive Compliance Summary</Text>
          <Text style={s.docTitle}>Vendor Dossier</Text>
          <Text style={s.vendorName}>{vendor.name}</Text>
          <View style={s.metaRow}>
            <View style={s.metaItem}><View style={s.metaDot} /><Text style={s.metaText}>{orgName}</Text></View>
            <View style={s.metaItem}><View style={s.metaDot} /><Text style={s.metaText}>Prepared by {generatedBy}</Text></View>
            <View style={s.metaItem}><View style={s.metaDot} /><Text style={s.metaText}>{date}</Text></View>
          </View>
        </View>

        {/* Confidential */}
        <View style={s.confBanner}>
          <Text style={s.confText}>CONFIDENTIAL — FOR INTERNAL USE ONLY. AI-GENERATED USING LEKHA OS.</Text>
        </View>

        {/* Compliance Score Banner */}
        <View style={s.scoreBadge}>
          <View style={[s.scoreBox, { backgroundColor: sc + "18", borderWidth: 1, borderColor: sc + "44", borderStyle: "solid" }]}>
            <Text style={[s.scoreNum, { color: sc }]}>{vendor.complianceScore}</Text>
            <Text style={[s.scoreLabel, { color: sc }]}>{scoreLabel(vendor.complianceScore)}</Text>
          </View>
          <View style={s.scoreDetail}>
            <Text>{`Risk Level: ${vendor.riskLevel.charAt(0).toUpperCase() + vendor.riskLevel.slice(1)}`}</Text>
            <Text>{`Category: ${vendor.category ?? "—"}`}</Text>
            {vendor.ownerName && <Text>{`Internal Owner: ${vendor.ownerName}${vendor.ownerDepartment ? " · " + vendor.ownerDepartment : ""}`}</Text>}
          </View>
        </View>

        {/* Section 1: Executive Overview */}
        <View style={s.section}>
          <View style={s.sectionRule} /><Text style={s.sectionTitle}>Executive Overview</Text>
          <Text style={s.body}>{report.executiveOverview}</Text>
        </View>

        {/* Section 2: Compliance Analysis */}
        <View style={s.section}>
          <View style={s.sectionRule} /><Text style={s.sectionTitle}>Compliance Analysis</Text>
          <Text style={s.body}>{report.complianceAnalysis}</Text>
        </View>

        {/* Section 3: Risk Assessment */}
        <View style={s.section}>
          <View style={s.sectionRule} /><Text style={s.sectionTitle}>Risk Assessment</Text>
          <Text style={s.body}>{report.riskAssessment}</Text>
        </View>

        {/* Section 4: Governance Status */}
        <View style={s.section}>
          <View style={s.sectionRule} /><Text style={s.sectionTitle}>Governance Status</Text>
          <Text style={s.body}>{report.governanceStatus}</Text>
        </View>

        {/* Section 5: Key Recommendations */}
        <View style={s.section}>
          <View style={s.sectionRule} /><Text style={s.sectionTitle}>Key Recommendations</Text>
          {report.keyRecommendations.map((rec, i) => (
            <View key={i} style={s.recRow}>
              <View style={s.recNum}><Text style={s.recNumText}>{i + 1}</Text></View>
              <Text style={s.recText}>{rec}</Text>
            </View>
          ))}
        </View>

        {/* Section 6: Conclusion */}
        <View style={s.section}>
          <View style={s.sectionRule} /><Text style={s.sectionTitle}>Conclusion</Text>
          <Text style={s.body}>{report.conclusion}</Text>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text>Lekha OS — Trust. Governance. Compliance.</Text>
          <Text>{date}</Text>
        </View>
      </Page>
    </Document>
  );
}
