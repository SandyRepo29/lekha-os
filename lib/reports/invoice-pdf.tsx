import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: "#1a1a2e", padding: 48, backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 },
  brand: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#4f46e5", letterSpacing: 2 },
  brandTagline: { fontSize: 8, color: "#9ca3af", marginTop: 2 },
  invoiceLabel: { fontSize: 28, fontFamily: "Helvetica-Bold", color: "#111827", textAlign: "right" },
  invoiceNumber: { fontSize: 11, color: "#6b7280", marginTop: 4, textAlign: "right" },
  sectionLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e5e7eb", marginVertical: 24 },
  thinDivider: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6", marginVertical: 8 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  metaBox: { width: "30%" },
  metaLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  metaValue: { fontSize: 10, color: "#111827" },
  billTo: { backgroundColor: "#f9fafb", borderRadius: 6, padding: 16, marginBottom: 28, borderWidth: 1, borderColor: "#e5e7eb" },
  tableHeader: { flexDirection: "row", backgroundColor: "#f3f4f6", padding: "8 12", borderRadius: 4, marginBottom: 4 },
  tableHeaderText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.8 },
  tableRow: { flexDirection: "row", padding: "10 12", borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  tableCell: { fontSize: 10, color: "#374151" },
  col_desc: { flex: 3 },
  col_qty: { flex: 1, textAlign: "center" },
  col_unit: { flex: 1.5, textAlign: "right" },
  col_total: { flex: 1.5, textAlign: "right" },
  totalsBox: { alignItems: "flex-end", marginTop: 16, marginBottom: 28 },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 6, width: 280 },
  totalLabel: { fontSize: 10, color: "#6b7280", flex: 2 },
  totalValue: { fontSize: 10, color: "#374151", flex: 1, textAlign: "right" },
  grandTotal: { flexDirection: "row", justifyContent: "flex-end", backgroundColor: "#4f46e5", padding: "10 14", borderRadius: 6, marginTop: 8, width: 280 },
  grandLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#ffffff", flex: 2 },
  grandValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#ffffff", flex: 1, textAlign: "right" },
  statusBadge: { backgroundColor: "#dbeafe", borderRadius: 4, paddingVertical: 3, paddingHorizontal: 8, alignSelf: "flex-start" },
  statusText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1d4ed8", textTransform: "uppercase", letterSpacing: 0.5 },
  paidBadge: { backgroundColor: "#d1fae5" },
  paidText: { color: "#065f46" },
  paymentBox: { backgroundColor: "#eff6ff", borderRadius: 6, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: "#bfdbfe" },
  paymentTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1d4ed8", marginBottom: 8 },
  paymentRow: { flexDirection: "row", marginBottom: 3 },
  paymentKey: { fontSize: 9, color: "#3b82f6", width: 130 },
  paymentVal: { fontSize: 9, color: "#1e3a5f", flex: 1 },
  noteBox: { backgroundColor: "#fefce8", borderRadius: 6, padding: 12, borderWidth: 1, borderColor: "#fde68a", marginBottom: 24 },
  noteText: { fontSize: 9, color: "#78350f" },
  footer: { position: "absolute", bottom: 32, left: 48, right: 48, borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 12, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: "#9ca3af" },
});

export type InvoicePdfData = {
  invoiceNumber: string;
  status: string;
  createdAt: Date;
  dueAt: Date | null;
  paidAt?: Date | null;
  orgName: string;
  planName: string;
  billingName: string | null;
  billingEmail: string | null;
  billingGstin?: string | null;
  amountCents: number;
  currency: string;
  notes?: string | null;
};

function fmt(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function InvoicePdf({ data }: { data: InvoicePdfData }) {
  const isINR = data.currency === "INR";
  const symbol = isINR ? "₹" : "$";
  const subtotal = data.amountCents / 100;
  const gstPercent = isINR ? 18 : null;
  const gstAmt = gstPercent ? subtotal * (gstPercent / 100) : 0;
  const total = subtotal + gstAmt;
  const isPaid = data.status === "paid";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>AUDT</Text>
            <Text style={styles.brandTagline}>Governance Built on Proof.</Text>
          </View>
          <View>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{data.invoiceNumber}</Text>
            <View style={[styles.statusBadge, isPaid ? styles.paidBadge : {}]}>
              <Text style={[styles.statusText, isPaid ? styles.paidText : {}]}>
                {data.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Dates row */}
        <View style={styles.metaRow}>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Invoice Date</Text>
            <Text style={styles.metaValue}>{fmt(new Date(data.createdAt))}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Due Date</Text>
            <Text style={styles.metaValue}>{data.dueAt ? fmt(new Date(data.dueAt)) : "—"}</Text>
          </View>
          {isPaid && data.paidAt && (
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Paid On</Text>
              <Text style={styles.metaValue}>{fmt(new Date(data.paidAt))}</Text>
            </View>
          )}
        </View>

        {/* Bill To */}
        <View style={styles.billTo}>
          <Text style={styles.metaLabel}>Bill To</Text>
          <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: "#111827", marginBottom: 4 }}>
            {data.billingName ?? data.orgName}
          </Text>
          {data.billingEmail && <Text style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>{data.billingEmail}</Text>}
          {data.billingGstin && <Text style={{ fontSize: 9, color: "#9ca3af" }}>GSTIN: {data.billingGstin}</Text>}
        </View>

        {/* Line items table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.col_desc]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.col_qty]}>Qty</Text>
          <Text style={[styles.tableHeaderText, styles.col_unit]}>Unit Price</Text>
          <Text style={[styles.tableHeaderText, styles.col_total]}>Amount</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.col_desc]}>{data.planName} — Annual Subscription</Text>
          <Text style={[styles.tableCell, styles.col_qty]}>1</Text>
          <Text style={[styles.tableCell, styles.col_unit]}>{symbol}{subtotal.toLocaleString("en-IN")}</Text>
          <Text style={[styles.tableCell, styles.col_total]}>{symbol}{subtotal.toLocaleString("en-IN")}</Text>
        </View>

        {/* Totals */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{symbol}{subtotal.toLocaleString("en-IN")}</Text>
          </View>
          {gstPercent ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST ({gstPercent}%)</Text>
              <Text style={styles.totalValue}>{symbol}{gstAmt.toLocaleString("en-IN")}</Text>
            </View>
          ) : (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>As applicable</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandLabel}>Total Due</Text>
            <Text style={styles.grandValue}>{symbol}{total.toLocaleString("en-IN")}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Payment instructions */}
        <View style={styles.paymentBox}>
          <Text style={styles.paymentTitle}>Bank Transfer Instructions</Text>
          <View style={styles.paymentRow}><Text style={styles.paymentKey}>Account Name</Text><Text style={styles.paymentVal}>AUDT Technologies Pvt. Ltd.</Text></View>
          <View style={styles.paymentRow}><Text style={styles.paymentKey}>Reference</Text><Text style={styles.paymentVal}>{data.invoiceNumber}</Text></View>
          <View style={[styles.paymentRow, { marginTop: 8 }]}><Text style={styles.paymentKey}>After payment</Text><Text style={styles.paymentVal}>Email UTR/transaction ID to billing@audt.tech to activate your subscription.</Text></View>
        </View>

        {data.notes && (
          <View style={styles.noteBox}>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#92400e", marginBottom: 4 }}>Note</Text>
            <Text style={styles.noteText}>{data.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>AUDT — audt.tech · billing@audt.tech</Text>
          <Text style={styles.footerText}>{data.invoiceNumber}</Text>
        </View>
      </Page>
    </Document>
  );
}
