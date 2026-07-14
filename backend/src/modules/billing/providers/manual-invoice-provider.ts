import type {
  PaymentProviderAdapter,
  CreatePaymentParams,
  CapturePaymentParams,
  RefundPaymentParams,
  PaymentResult,
} from "../payment-adapter"

export const manualInvoiceProvider: PaymentProviderAdapter = {
  slug: "manual_invoice",
  name: "Manual Invoice",
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
          "Transfer the exact invoice amount. Include invoice number as payment reference. Email proof to finance@audt.tech",
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

  async verifyPayment(_transactionId: string, _providerReference: string): Promise<PaymentResult> {
    return { success: true, status: "verified" }
  },
}
