import type {
  PaymentProviderAdapter,
  CreatePaymentParams,
  CapturePaymentParams,
  RefundPaymentParams,
  PaymentResult,
} from "../payment-adapter"

// NEFT/RTGS UTR: 16–22 uppercase alphanumeric chars
const UTR_REGEX = /^[A-Z0-9]{16,22}$/

export const bankTransferProvider: PaymentProviderAdapter = {
  slug: "bank_transfer",
  name: "Bank Transfer (NEFT / RTGS / IMPS)",
  supportsOnline: false,
  supportsOffline: true,

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    return {
      success: true,
      status: "pending",
      bankDetails: {
        accountName: "AUDT Technologies Pvt Ltd",
        bankName: "HDFC Bank",
        accountNumber: "Contact finance@audt.tech for account details",
        currency: params.currency,
        instructions:
          "Transfer via NEFT/RTGS/IMPS. Include invoice number as remarks. Share UTR number after transfer.",
      },
    }
  },

  async capturePayment(_params: CapturePaymentParams): Promise<PaymentResult> {
    return { success: true, status: "pending_verification" }
  },

  async cancelPayment(_transactionId: string): Promise<PaymentResult> {
    return { success: true, status: "cancelled" }
  },

  async refundPayment(_params: RefundPaymentParams): Promise<PaymentResult> {
    return { success: true, status: "refunded" }
  },

  async verifyPayment(_transactionId: string, providerReference: string): Promise<PaymentResult> {
    const utr = (providerReference ?? "").trim().toUpperCase()
    if (!utr) {
      return { success: false, status: "failed", error: "UTR number is required to verify a bank transfer." }
    }
    if (!UTR_REGEX.test(utr)) {
      return {
        success: false,
        status: "failed",
        error: `Invalid UTR format: "${utr}". Expected 16–22 uppercase alphanumeric characters.`,
      }
    }
    return { success: true, status: "verified", providerReference: utr }
  },
}
