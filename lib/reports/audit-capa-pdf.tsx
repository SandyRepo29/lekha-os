import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles } from "./pdf-styles";
import type { Audit, CorrectiveAction } from "@/lib/db/schema";

type Props = {
  orgName: string;
  generatedBy: string;
  audit: Audit;
  capas: CorrectiveAction[];
};

function StatusBadge({ status }: { status: string }) {
  const s =
    status === "open"        ? styles.badgeRed    :
    status === "in_progress" ? styles.badgeYellow :
    status === "completed"   ? styles.badgeGreen  :
    status === "overdue"     ? styles.badgeRed    : styles.badgeGray;
  return <View style={[styles.badge, s]}><Text>{status.replace("_", " ").toUpperCase()}</Text></View>;
}

export function AuditCapaReport({ orgName, generatedBy, audit, capas }: Props) {
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const open      = capas.filter((c) => c.status !== "completed").length;
  const completed = capas.filter((c) => c.status === "completed").length;
  const overdue   = capas.filter((c) => {
    if (c.status === "completed") return false;
    return c.dueDate ? new Date(c.dueDate) < new Date() : false;
  }).length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>Lekha OS</Text>
            <Text style={styles.brandTag}>Trust, Governance & Compliance OS</Text>
          </View>
          <View style={styles.reportTitle}>
            <Text style={styles.reportName}>CAPA Tracker Report</Text>
            <Text style={styles.reportMeta}>{orgName} · {date}</Text>
            <Text style={styles.reportMeta}>Prepared by {generatedBy}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 4 }}>{audit.name}</Text>
          <Text style={{ fontSize: 9, color: "#646a82" }}>
            {capas.length} corrective actions · {open} open · {overdue} overdue · {completed} completed
          </Text>
        </View>

        <View style={[styles.summaryGrid, { marginBottom: 20 }]}>
          {[
            { label: "Total CAPAs", value: capas.length },
            { label: "Open",        value: open },
            { label: "Overdue",     value: overdue },
            { label: "Completed",   value: completed },
          ].map((item, i) => (
            <View key={i} style={[styles.summaryCard, i === 3 ? { marginRight: 0 } : {}]}>
              <Text style={styles.summaryValue}>{item.value}</Text>
              <Text style={styles.summaryLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {capas.length === 0 ? (
          <Text style={{ fontSize: 9, color: "#9aa0b5" }}>No corrective actions recorded.</Text>
        ) : (
          <View style={styles.section}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCellBold, { flex: 3 }]}>Corrective Action</Text>
                <Text style={[styles.tableCellBold, { flex: 1.5 }]}>Due Date</Text>
                <Text style={[styles.tableCellBold, { flex: 1 }]}>Status</Text>
              </View>
              {capas.map((c) => (
                <View key={c.id} style={styles.tableRow} wrap={false}>
                  <View style={{ flex: 3, paddingRight: 8 }}>
                    <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 2 }}>{c.title}</Text>
                    {c.description && (
                      <Text style={{ fontSize: 8, color: "#646a82" }}>{c.description}</Text>
                    )}
                    {c.completionNotes && (
                      <Text style={{ fontSize: 8, color: "#4f46e5", marginTop: 2 }}>Note: {c.completionNotes}</Text>
                    )}
                  </View>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>
                    {c.dueDate ? new Date(c.dueDate).toLocaleDateString("en-IN") : "—"}
                  </Text>
                  <View style={{ flex: 1 }}><StatusBadge status={c.status} /></View>
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
