import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles } from "./pdf-styles";
import type { Audit, AuditFinding, CorrectiveAction } from "@/lib/db/schema";

type Props = {
  orgName: string;
  generatedBy: string;
  audit: Audit;
  findings: AuditFinding[];
  capas: CorrectiveAction[];
  executiveReport: string | null;
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
    status === "closed"      ? styles.badgeGreen  :
    status === "completed"   ? styles.badgeGreen  : styles.badgeGray;
  return <View style={[styles.badge, s]}><Text>{status.toUpperCase()}</Text></View>;
}

export function AuditReport({ orgName, generatedBy, audit, findings, capas, executiveReport }: Props) {
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const critical = findings.filter((f) => f.severity === "critical").length;
  const high     = findings.filter((f) => f.severity === "high").length;
  const open     = findings.filter((f) => f.status === "open").length;
  const capasOpen = capas.filter((c) => c.status !== "completed").length;

  const findingsBySeverity = ["critical", "high", "medium", "low"].map((sev) => ({
    sev,
    items: findings.filter((f) => f.severity === sev),
  })).filter((g) => g.items.length > 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>Lekha OS</Text>
            <Text style={styles.brandTag}>Trust, Governance & Compliance OS</Text>
          </View>
          <View style={styles.reportTitle}>
            <Text style={styles.reportName}>Audit Report</Text>
            <Text style={styles.reportMeta}>{orgName} · {date}</Text>
            <Text style={styles.reportMeta}>Prepared by {generatedBy}</Text>
          </View>
        </View>

        {/* Audit info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audit Overview</Text>
          <View style={{ marginBottom: 6 }}>
            <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 4 }}>{audit.name}</Text>
            <Text style={{ fontSize: 9, color: "#646a82", marginBottom: 2 }}>
              Type: {audit.auditType?.replace("_", " ").toUpperCase()} · Status: {audit.status?.toUpperCase()}
            </Text>
            {audit.auditorName && (
              <Text style={{ fontSize: 9, color: "#646a82", marginBottom: 2 }}>Auditor: {audit.auditorName}</Text>
            )}
            {(audit.startDate || audit.endDate) && (
              <Text style={{ fontSize: 9, color: "#646a82", marginBottom: 2 }}>
                Period: {audit.startDate ? new Date(audit.startDate).toLocaleDateString("en-IN") : "—"} to {audit.endDate ? new Date(audit.endDate).toLocaleDateString("en-IN") : "—"}
              </Text>
            )}
          </View>
          {audit.scope && (
            <View style={{ marginBottom: 4 }}>
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 2 }}>Scope</Text>
              <Text style={{ fontSize: 9, color: "#646a82" }}>{audit.scope}</Text>
            </View>
          )}
          {audit.objective && (
            <View style={{ marginBottom: 4 }}>
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 2 }}>Objective</Text>
              <Text style={{ fontSize: 9, color: "#646a82" }}>{audit.objective}</Text>
            </View>
          )}
        </View>

        {/* Summary grid */}
        <View style={[styles.summaryGrid, { marginBottom: 20 }]}>
          {[
            { label: "Total Findings", value: findings.length },
            { label: "Critical / High", value: `${critical} / ${high}` },
            { label: "Open Findings", value: open },
            { label: "Open CAPAs", value: capasOpen },
          ].map((item, i) => (
            <View key={i} style={[styles.summaryCard, i === 3 ? { marginRight: 0 } : {}]}>
              <Text style={styles.summaryValue}>{item.value}</Text>
              <Text style={styles.summaryLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Executive summary */}
        {executiveReport && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Executive Summary</Text>
            <Text style={{ fontSize: 9, color: "#646a82", lineHeight: 1.5 }}>{executiveReport}</Text>
          </View>
        )}

        {/* Findings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Findings ({findings.length})</Text>
          {findings.length === 0 ? (
            <Text style={{ fontSize: 9, color: "#9aa0b5" }}>No findings recorded for this audit.</Text>
          ) : (
            findingsBySeverity.map(({ sev, items }) => (
              <View key={sev} style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#646a82", marginBottom: 4, textTransform: "uppercase" }}>
                  {sev} ({items.length})
                </Text>
                {items.map((f) => (
                  <View key={f.id} style={{ marginBottom: 8, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: sev === "critical" || sev === "high" ? "#ef4444" : sev === "medium" ? "#f59e0b" : "#9aa0b5", borderLeftStyle: "solid" }}>
                    <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 2 }}>{f.title}</Text>
                    <Text style={{ fontSize: 8, color: "#646a82", marginBottom: 2 }}>{f.description}</Text>
                    {f.recommendation && (
                      <Text style={{ fontSize: 8, color: "#4f46e5" }}>→ {f.recommendation}</Text>
                    )}
                  </View>
                ))}
              </View>
            ))
          )}
        </View>

        {/* CAPAs */}
        {capas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Corrective Actions ({capas.length})</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCellBold, { flex: 3 }]}>Title</Text>
                <Text style={[styles.tableCellBold, { flex: 1.5 }]}>Due Date</Text>
                <Text style={[styles.tableCellBold, { flex: 1 }]}>Status</Text>
              </View>
              {capas.map((c) => (
                <View key={c.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 3 }]}>{c.title}</Text>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>
                    {c.dueDate ? new Date(c.dueDate).toLocaleDateString("en-IN") : "—"}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <StatusBadge status={c.status} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Lekha OS · Confidential</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
