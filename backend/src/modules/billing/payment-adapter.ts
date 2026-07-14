// Core payment provider adapter interface — all providers implement this

export type PaymentMethod = 'bank_transfer' | 'upi' | 'card' | 'cheque' | 'wire' | 'po' | 'net_banking' | 'wallet' | 'ach' | 'sepa'

export type TransactionStatus = 'pending' | 'pending_verification' | 'verified' | 'failed' | 'cancelled' | 'refunded'

export type InvoiceStatus = 'draft' | 'issued' | 'awaiting_payment' | 'partially_paid' | 'pending_verification' | 'paid' | 'cancelled' | 'refunded'

export type SubscriptionStatus = 'trial' | 'active' | 'grace_period' | 'suspended' | 'expired' | 'cancelled' | 'enterprise'

export interface CreatePaymentParams {
  orgId: string
  invoiceId: string
  amountCents: number
  currency: string
  paymentMethod: PaymentMethod
  customerName: string
  customerEmail: string
  description?: string
  metadata?: Record<string, unknown>
}

export interface CapturePaymentParams {
  providerReference: string
  amountCents: number
  metadata?: Record<string, unknown>
}

export interface RefundPaymentParams {
  transactionId: string
  amountCents?: number
  reason: string
}

export interface PaymentResult {
  success: boolean
  transactionId?: string
  providerReference?: string
  status: TransactionStatus
  checkoutUrl?: string
  bankDetails?: BankDetails
  error?: string
}

export interface BankDetails {
  accountName: string
  bankName: string
  accountNumber: string
  ifscCode?: string
  swiftCode?: string
  accountType?: string
  currency: string
  instructions?: string
}

export interface CheckoutParams {
  orgId: string
  planSlug: string
  priceId?: string
  successUrl: string
  cancelUrl: string
}

export interface PortalParams {
  orgId: string
  returnUrl: string
}

export interface PaymentProviderAdapter {
  slug: string
  name: string
  supportsOnline: boolean
  supportsOffline: boolean

  createPayment(params: CreatePaymentParams): Promise<PaymentResult>
  capturePayment(params: CapturePaymentParams): Promise<PaymentResult>
  cancelPayment(transactionId: string): Promise<PaymentResult>
  refundPayment(params: RefundPaymentParams): Promise<PaymentResult>
  verifyPayment(transactionId: string, providerReference: string): Promise<PaymentResult>

  generateCheckout?(params: CheckoutParams): Promise<{ url: string }>
  generatePortal?(params: PortalParams): Promise<{ url: string }>
}

// ─── Provider registry ────────────────────────────────────────────────────────

const _registry = new Map<string, PaymentProviderAdapter>()

export function registerProvider(adapter: PaymentProviderAdapter): void {
  _registry.set(adapter.slug, adapter)
}

export function getProvider(slug: string): PaymentProviderAdapter {
  const adapter = _registry.get(slug)
  if (!adapter) {
    throw new Error(`Payment provider not found: "${slug}". Registered: ${[..._registry.keys()].join(', ') || 'none'}`)
  }
  return adapter
}

export function listProviders(): PaymentProviderAdapter[] {
  return [..._registry.values()]
}
