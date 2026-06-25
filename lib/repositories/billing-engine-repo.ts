import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// â”€â”€â”€ Payment Transactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function createTransaction(data: {
  orgId: string
  invoiceId?: string | null
  subscriptionId?: string | null
  providerSlug: string
  amountCents: number
  currency: string
  status: string
  paymentMethod?: string | null
  providerReference?: string | null
  notes?: string | null
  metadata?: Record<string, unknown> | null
}): Promise<{ id: string }> {
  const rows = await db.execute(sql`
    INSERT INTO payment_transactions (
      organization_id, invoice_id, subscription_id, provider_slug,
      amount_cents, currency, status, payment_method,
      provider_reference, notes, metadata
    ) VALUES (
      ${data.orgId},
      ${data.invoiceId ?? null},
      ${data.subscriptionId ?? null},
      ${data.providerSlug},
      ${data.amountCents},
      ${data.currency},
      ${data.status},
      ${data.paymentMethod ?? null},
      ${data.providerReference ?? null},
      ${data.notes ?? null},
      ${data.metadata ? JSON.stringify(data.metadata) : null}
    )
    RETURNING id
  `)
  return { id: (rows[0] as { id: string }).id }
}

export async function updateTransaction(
  id: string,
  data: Partial<{
    status: string
    providerReference: string
    paymentProofUrl: string
    notes: string
    verifiedBy: string
    verifiedAt: Date
    rejectedBy: string
    rejectedAt: Date
    rejectionReason: string
    metadata: Record<string, unknown>
  }>
): Promise<void> {
  const parts: string[] = []
  if (data.status !== undefined) parts.push(`status = '${data.status}'`)
  if (data.providerReference !== undefined) parts.push(`provider_reference = '${data.providerReference}'`)
  if (data.paymentProofUrl !== undefined) parts.push(`payment_proof_url = '${data.paymentProofUrl}'`)
  if (data.notes !== undefined) parts.push(`notes = '${data.notes.replace(/'/g, "''")}'`)
  if (data.verifiedBy !== undefined) parts.push(`verified_by = '${data.verifiedBy}'`)
  if (data.verifiedAt !== undefined) parts.push(`verified_at = '${data.verifiedAt.toISOString()}'`)
  if (data.rejectedBy !== undefined) parts.push(`rejected_by = '${data.rejectedBy}'`)
  if (data.rejectedAt !== undefined) parts.push(`rejected_at = '${data.rejectedAt.toISOString()}'`)
  if (data.rejectionReason !== undefined) parts.push(`rejection_reason = '${data.rejectionReason.replace(/'/g, "''")}'`)
  if (data.metadata !== undefined) parts.push(`metadata = '${JSON.stringify(data.metadata)}'::jsonb`)
  if (parts.length === 0) return
  parts.push("updated_at = now()")
  await db.execute(sql.raw(`UPDATE payment_transactions SET ${parts.join(", ")} WHERE id = '${id}'`))
}

export async function getTransaction(id: string): Promise<unknown> {
  const rows = await db.execute(sql`
    SELECT pt.*, o.name AS org_name
    FROM payment_transactions pt
    LEFT JOIN organizations o ON o.id = pt.organization_id
    WHERE pt.id = ${id}
    LIMIT 1
  `)
  return rows[0] ?? null
}

export async function listTransactionsByOrg(
  orgId: string,
  filters?: { status?: string; limit?: number }
): Promise<unknown[]> {
  const limit = filters?.limit ?? 50
  if (filters?.status) {
    const rows = await db.execute(sql`
      SELECT * FROM payment_transactions
      WHERE organization_id = ${orgId} AND status = ${filters.status}
      ORDER BY created_at DESC LIMIT ${limit}
    `)
    return rows
  }
  const rows = await db.execute(sql`
    SELECT * FROM payment_transactions
    WHERE organization_id = ${orgId}
    ORDER BY created_at DESC LIMIT ${limit}
  `)
  return rows
}

export async function listPendingTransactions(limit = 100): Promise<unknown[]> {
  const rows = await db.execute(sql`
    SELECT pt.*, o.name AS org_name
    FROM payment_transactions pt
    LEFT JOIN organizations o ON o.id = pt.organization_id
    WHERE pt.status IN ('pending', 'pending_verification')
    ORDER BY pt.created_at ASC LIMIT ${limit}
  `)
  return rows
}

// â”€â”€â”€ Finance Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function recordFinanceAction(data: {
  orgId: string
  transactionId?: string | null
  invoiceId?: string | null
  actorId?: string | null
  action: string
  notes?: string | null
  amountCents?: number | null
  metadata?: Record<string, unknown> | null
}): Promise<void> {
  await db.execute(sql`
    INSERT INTO finance_actions (
      organization_id, transaction_id, invoice_id, actor_id,
      action, notes, amount_cents, metadata
    ) VALUES (
      ${data.orgId},
      ${data.transactionId ?? null},
      ${data.invoiceId ?? null},
      ${data.actorId ?? null},
      ${data.action},
      ${data.notes ?? null},
      ${data.amountCents ?? null},
      ${data.metadata ? JSON.stringify(data.metadata) : null}
    )
  `)
}

export async function listFinanceActions(filters?: {
  orgId?: string
  transactionId?: string
  invoiceId?: string
  limit?: number
}): Promise<unknown[]> {
  const limit = filters?.limit ?? 100
  if (filters?.transactionId) {
    const rows = await db.execute(sql`
      SELECT fa.*, p.full_name AS actor_name
      FROM finance_actions fa LEFT JOIN profiles p ON p.id = fa.actor_id
      WHERE fa.transaction_id = ${filters.transactionId}
      ORDER BY fa.created_at DESC LIMIT ${limit}
    `)
    return rows
  }
  if (filters?.invoiceId) {
    const rows = await db.execute(sql`
      SELECT fa.*, p.full_name AS actor_name
      FROM finance_actions fa LEFT JOIN profiles p ON p.id = fa.actor_id
      WHERE fa.invoice_id = ${filters.invoiceId}
      ORDER BY fa.created_at DESC LIMIT ${limit}
    `)
    return rows
  }
  if (filters?.orgId) {
    const rows = await db.execute(sql`
      SELECT fa.*, p.full_name AS actor_name
      FROM finance_actions fa LEFT JOIN profiles p ON p.id = fa.actor_id
      WHERE fa.organization_id = ${filters.orgId}
      ORDER BY fa.created_at DESC LIMIT ${limit}
    `)
    return rows
  }
  const rows = await db.execute(sql`
    SELECT fa.*, p.full_name AS actor_name
    FROM finance_actions fa LEFT JOIN profiles p ON p.id = fa.actor_id
    ORDER BY fa.created_at DESC LIMIT ${limit}
  `)
  return rows
}

// â”€â”€â”€ Coupons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getCouponByCode(code: string): Promise<unknown> {
  const rows = await db.execute(sql`
    SELECT * FROM coupons WHERE code = ${code.toUpperCase()} LIMIT 1
  `)
  return rows[0] ?? null
}

export async function incrementCouponUses(couponId: string): Promise<void> {
  await db.execute(sql`
    UPDATE coupons SET uses_count = uses_count + 1 WHERE id = ${couponId}
  `)
}

export async function listCoupons(activeOnly = false): Promise<unknown[]> {
  if (activeOnly) {
    const rows = await db.execute(sql`
      SELECT * FROM coupons
      WHERE is_active = true AND (valid_until IS NULL OR valid_until > now())
        AND (max_uses IS NULL OR uses_count < max_uses)
      ORDER BY created_at DESC
    `)
    return rows
  }
  const rows = await db.execute(sql`SELECT * FROM coupons ORDER BY created_at DESC`)
  return rows
}

// â”€â”€â”€ Credits â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getOrgCredits(orgId: string): Promise<unknown[]> {
  const rows = await db.execute(sql`
    SELECT * FROM billing_credits WHERE organization_id = ${orgId} ORDER BY created_at DESC
  `)
  return rows
}

export async function createCredit(data: {
  orgId: string
  amountCents: number
  currency: string
  description: string
  type: string
  expiresAt?: Date | null
  appliedToInvoiceId?: string | null
  createdBy?: string | null
}): Promise<{ id: string }> {
  const rows = await db.execute(sql`
    INSERT INTO billing_credits (
      organization_id, amount_cents, currency, description,
      type, expires_at, applied_to_invoice_id, created_by
    ) VALUES (
      ${data.orgId}, ${data.amountCents}, ${data.currency}, ${data.description},
      ${data.type}, ${data.expiresAt ?? null}, ${data.appliedToInvoiceId ?? null}, ${data.createdBy ?? null}
    ) RETURNING id
  `)
  return { id: (rows[0] as { id: string }).id }
}

export async function getOrgCreditBalance(orgId: string): Promise<number> {
  const rows = await db.execute(sql`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'credit' THEN amount_cents ELSE 0 END), 0) AS total_credits,
      COALESCE(SUM(CASE WHEN type = 'debit' THEN amount_cents ELSE 0 END), 0) AS total_debits
    FROM billing_credits
    WHERE organization_id = ${orgId}
      AND (expires_at IS NULL OR expires_at > now())
      AND applied_to_invoice_id IS NULL
  `)
  const row = rows[0] as { total_credits: string; total_debits: string }
  return Math.max(0, Number(row.total_credits) - Number(row.total_debits))
}

// â”€â”€â”€ Tax Rates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getTaxRate(slug: string): Promise<unknown> {
  const rows = await db.execute(sql`SELECT * FROM tax_rates WHERE slug = ${slug} LIMIT 1`)
  return rows[0] ?? null
}

export async function listTaxRates(country?: string): Promise<unknown[]> {
  if (country) {
    const rows = await db.execute(sql`
      SELECT * FROM tax_rates WHERE country = ${country} AND is_active = true ORDER BY name ASC
    `)
    return rows
  }
  const rows = await db.execute(sql`SELECT * FROM tax_rates WHERE is_active = true ORDER BY country, name`)
  return rows
}

// â”€â”€â”€ Payment Providers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function listPaymentProviders(activeOnly = false): Promise<unknown[]> {
  if (activeOnly) {
    const rows = await db.execute(sql`SELECT * FROM payment_providers WHERE is_active = true ORDER BY name ASC`)
    return rows
  }
  const rows = await db.execute(sql`SELECT * FROM payment_providers ORDER BY name ASC`)
  return rows
}

export async function getPaymentProvider(slug: string): Promise<unknown> {
  const rows = await db.execute(sql`SELECT * FROM payment_providers WHERE slug = ${slug} LIMIT 1`)
  return rows[0] ?? null
}

// â”€â”€â”€ Bank Details â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getPrimaryBankDetails(): Promise<unknown> {
  const rows = await db.execute(sql`
    SELECT * FROM bank_details WHERE is_primary = true AND is_active = true LIMIT 1
  `)
  return rows[0] ?? null
}

// â”€â”€â”€ Invoices (extended) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function updateInvoiceStatus(
  invoiceId: string,
  status: string,
  extra?: { paidAt?: Date; paymentReference?: string }
): Promise<void> {
  const parts = [`status = '${status}'`, "updated_at = now()"]
  if (extra?.paidAt) parts.push(`paid_at = '${extra.paidAt.toISOString()}'`)
  if (extra?.paymentReference) parts.push(`payment_reference = '${extra.paymentReference}'`)
  await db.execute(sql.raw(`UPDATE invoices SET ${parts.join(", ")} WHERE id = '${invoiceId}'`))
}

export async function updateInvoiceFull(
  invoiceId: string,
  data: Partial<{
    status: string
    paymentProviderSlug: string
    taxAmountCents: number
    taxRate: number
    taxName: string
    discountAmountCents: number
    couponCode: string
    purchaseOrderNumber: string
    paymentTerms: string
    subtotalCents: number
    totalCents: number
    amountCents: number
    paidAt: Date
    paymentReference: string
  }>
): Promise<void> {
  const parts: string[] = ["updated_at = now()"]
  if (data.status !== undefined) parts.push(`status = '${data.status}'`)
  if (data.paymentProviderSlug !== undefined) parts.push(`payment_provider_slug = '${data.paymentProviderSlug}'`)
  if (data.taxAmountCents !== undefined) parts.push(`tax_amount_cents = ${data.taxAmountCents}`)
  if (data.taxRate !== undefined) parts.push(`tax_rate = ${data.taxRate}`)
  if (data.taxName !== undefined) parts.push(`tax_name = '${data.taxName}'`)
  if (data.discountAmountCents !== undefined) parts.push(`discount_amount_cents = ${data.discountAmountCents}`)
  if (data.couponCode !== undefined) parts.push(`coupon_code = '${data.couponCode}'`)
  if (data.subtotalCents !== undefined) parts.push(`subtotal_cents = ${data.subtotalCents}`)
  if (data.totalCents !== undefined) parts.push(`total_cents = ${data.totalCents}`)
  if (data.amountCents !== undefined) parts.push(`amount_cents = ${data.amountCents}`)
  if (data.paidAt !== undefined) parts.push(`paid_at = '${data.paidAt.toISOString()}'`)
  if (data.paymentReference !== undefined) parts.push(`payment_reference = '${data.paymentReference}'`)
  await db.execute(sql.raw(`UPDATE invoices SET ${parts.join(", ")} WHERE id = '${invoiceId}'`))
}

export async function listInvoicesByOrg(orgId: string, limit = 50): Promise<unknown[]> {
  const rows = await db.execute(sql`
    SELECT i.*, bp.name AS plan_name
    FROM invoices i LEFT JOIN billing_plans bp ON bp.id = i.plan_id
    WHERE i.organization_id = ${orgId}
    ORDER BY i.created_at DESC LIMIT ${limit}
  `)
  return rows
}

export async function listAllInvoices(filters?: {
  status?: string
  limit?: number
  offset?: number
}): Promise<unknown[]> {
  const limit = filters?.limit ?? 50
  const offset = filters?.offset ?? 0
  if (filters?.status) {
    const rows = await db.execute(sql`
      SELECT i.*, o.name AS org_name, bp.name AS plan_name
      FROM invoices i
      LEFT JOIN organizations o ON o.id = i.organization_id
      LEFT JOIN billing_plans bp ON bp.id = i.plan_id
      WHERE i.status = ${filters.status}
      ORDER BY i.created_at DESC LIMIT ${limit} OFFSET ${offset}
    `)
    return rows
  }
  const rows = await db.execute(sql`
    SELECT i.*, o.name AS org_name, bp.name AS plan_name
    FROM invoices i
    LEFT JOIN organizations o ON o.id = i.organization_id
    LEFT JOIN billing_plans bp ON bp.id = i.plan_id
    ORDER BY i.created_at DESC LIMIT ${limit} OFFSET ${offset}
  `)
  return rows
}

export async function getInvoiceById(invoiceId: string): Promise<unknown> {
  const rows = await db.execute(sql`
    SELECT i.*, o.name AS org_name, bp.name AS plan_name
    FROM invoices i
    LEFT JOIN organizations o ON o.id = i.organization_id
    LEFT JOIN billing_plans bp ON bp.id = i.plan_id
    WHERE i.id = ${invoiceId} LIMIT 1
  `)
  return rows[0] ?? null
}

export async function listInvoicesPendingVerification(limit = 50): Promise<unknown[]> {
  const rows = await db.execute(sql`
    SELECT i.*, o.name AS org_name, bp.name AS plan_name
    FROM invoices i
    LEFT JOIN organizations o ON o.id = i.organization_id
    LEFT JOIN billing_plans bp ON bp.id = i.plan_id
    WHERE i.status = 'pending_verification'
    ORDER BY i.created_at ASC LIMIT ${limit}
  `)
  return rows
}

// â”€â”€â”€ Subscriptions (extended) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: string,
  extra?: {
    gracePeriodEndsAt?: Date
    suspendedAt?: Date
    cancelledAt?: Date
    currentPeriodStart?: Date
    currentPeriodEnd?: Date
  }
): Promise<void> {
  const parts = [`status = '${status}'`, "updated_at = now()"]
  if (extra?.gracePeriodEndsAt) parts.push(`grace_period_ends_at = '${extra.gracePeriodEndsAt.toISOString()}'`)
  if (extra?.suspendedAt) parts.push(`suspended_at = '${extra.suspendedAt.toISOString()}'`)
  if (extra?.cancelledAt) parts.push(`cancelled_at = '${extra.cancelledAt.toISOString()}'`)
  if (extra?.currentPeriodStart) parts.push(`current_period_start = '${extra.currentPeriodStart.toISOString()}'`)
  if (extra?.currentPeriodEnd) parts.push(`current_period_end = '${extra.currentPeriodEnd.toISOString()}'`)
  await db.execute(sql.raw(`UPDATE subscriptions SET ${parts.join(", ")} WHERE id = '${subscriptionId}'`))
}

export async function activateSubscriptionByOrgId(
  orgId: string,
  data: { status: string; currentPeriodStart: string; currentPeriodEnd: string; planSlug?: string }
): Promise<void> {
  const parts = [
    `status = '${data.status}'`,
    `current_period_start = '${data.currentPeriodStart}'`,
    `current_period_end = '${data.currentPeriodEnd}'`,
    "updated_at = now()",
  ]
  await db.execute(sql.raw(`UPDATE subscriptions SET ${parts.join(", ")} WHERE organization_id = '${orgId}'`))
}

export async function findTransactionById(id: string): Promise<unknown> {
  return getTransaction(id)
}

export async function getOrgSubscription(orgId: string): Promise<unknown> {
  const rows = await db.execute(sql`
    SELECT s.*, bp.name AS plan_name, bp.price_yearly, bp.max_users, bp.max_vendors, bp.max_storage_gb
    FROM subscriptions s LEFT JOIN billing_plans bp ON bp.id = s.plan_id
    WHERE s.organization_id = ${orgId} LIMIT 1
  `)
  return rows[0] ?? null
}

// â”€â”€â”€ Revenue stats for finance dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getRevenueStats(): Promise<{
  paidThisMonth: number
  pendingCount: number
  activeSubscriptions: number
  invoicesThisMonth: number
}> {
  const rows = await db.execute(sql`
    SELECT
      COALESCE(SUM(CASE WHEN status = 'paid' AND date_trunc('month', paid_at) = date_trunc('month', now()) THEN amount_cents ELSE 0 END), 0) AS paid_this_month,
      COUNT(CASE WHEN status = 'pending_verification' THEN 1 END) AS pending_count,
      COUNT(CASE WHEN date_trunc('month', created_at) = date_trunc('month', now()) THEN 1 END) AS invoices_this_month
    FROM invoices
  `)
  const subRows = await db.execute(sql`
    SELECT COUNT(*) AS active FROM subscriptions WHERE status IN ('trial', 'active', 'enterprise')
  `)
  const r = rows[0] as Record<string, string>
  const s = subRows[0] as { active: string }
  return {
    paidThisMonth: Number(r.paid_this_month ?? 0),
    pendingCount: Number(r.pending_count ?? 0),
    invoicesThisMonth: Number(r.invoices_this_month ?? 0),
    activeSubscriptions: Number(s.active ?? 0),
  }
}


