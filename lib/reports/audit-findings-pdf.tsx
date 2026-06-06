import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles } from "./pdf-styles";
import type { Audit, AuditFinding } from "@/lib/db/schema";

type Props = {
  orgName: string;
  generatedBy: string;
  audit: Audit;
  findings: AuditFinding[];
};

function SeverityBadge({ severity }: { severity: string }) {
  const s =
    severity === "critical" ? styles.badgeRed :
    severity === "high"     ? styles.badgeRed :
    severity === "medium"   ? styles.badgeYellow : styles.badgeGray;
  return <View style={[styles.badge, s]}><Text>{severity.toUpperCase()}</Text></View>;
}

function StatusBadge({ status }: { status: string }) {
  const s =
    status === "open"        ? styles.badgeRed    :
    status === "remediating" ? styles.badgeYellow :
    status === "closed"      ? styles.badgeGreen  : styles.badgeGray;
  return <View style={[styles.badge, s]}><Text>{status.toUpperCase()}</Text></View>;
}

export function AuditFindingsReport({ orgName, generatedBy, audit, findings }: Props) {
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const critical = findings.filter((f) => f.severity === "critical").length;
  const high     = findings.filter((f) => f.severity === "high").length;
  const open     = findings.filter((f) => f.status === "open").length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>Lekha OS</Text>
            <Text style={styles.brandTag}>Trust, Governance & Compliance OS</Text>
          </View>
          <View style={styles.reportTitle}>
            <Text style={styles.reportName}>Audit Findings Report</Text>
            <Text style={styles.reportMeta}>{orgName} · {date}</Text>
            <Text style={styles.reportMeta}>Prepared by {generatedBy}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 4 }}>{audit.name}</Text>
          <Text style={{ fontSize: 9, color: "#646a82" }}>
            {audit.auditType?.replace("_", " ").toUpperCase()} · {findings.length} findings · {open} open · {critical} critical · {high} high
          </Text>
        </View>

        <View style={[styles.summaryGrid, { marginBottom: 20 }]}>
          {[
            { label: "Total",    value: findings.length },
            { label: "Critical", value: critical },
            { label: "High",     value: high },
            { label: "Open",     value: open },
          ].map((item, i) => (
            <View key={i} style={[styles.summaryCard, i === 3 ? { marginRight: 0 } : {}]}>
              <Text style={styles.summaryValue}>{item.value}</Text>
              <Text style={styles.summaryLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {findings.length === 0 ? (
          <Text style={{ fontSize: 9, color: "#9aa0b5" }}>No findings recorded.</Text>
        ) : (
          <View style={styles.section}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCellBold, { flex: 3 }]}>Finding</Text>
                <Text style={[styles.tableCellBold, { flex: 1 }]}>Severity</Text>
                <Text style={[styles.tableCellBold, { flex: 1 }]}>Status</Text>
              </View>
              {findings.map((f) => (
                <View key={f.id} style={styles.tableRow} wrap={false}>
                  <View style={{ flex: 3, paddingRight: 8 }}>
                    <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 2 }}>{f.title}</Text>
                    <Text style={{ fontSize: 8, color: "#646a82", marginBottom: 2 }}>{f.description}</Text>
                    {f.recommendation && (
                      <Text style={{ fontSize: 8, color: "#4f46e5" }}>→ {f.recommendation}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}><SeverityBadge severity={f.severity} /></View>
                  <View style={{ flex: 1 }}><StatusBadge status={f.status} /></View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>Lekha OS · Confidential</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
