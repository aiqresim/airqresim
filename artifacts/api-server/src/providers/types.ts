import type { EmailTemplateName, OrderEmailContext } from "./email-templates";

export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export type Payment = {
  provider: string;
  providerPaymentId: string;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
};

export type EsimResult = {
  provider: string;
  iccid: string;
  activationCode: string;
  smdpAddress: string;
  matchingId: string;
  qrPayload: string;
};

export interface PaymentProvider {
  createPayment(orderId: string, amountCents: number, currency: string): Promise<Payment>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  refundPayment(paymentId: string): Promise<{ status: "refunded" }>;
}

export interface EsimProvider {
  createEsim(orderItemId: string, planId: string): Promise<EsimResult>;
  /**
   * Live connectivity snapshot. The mock returns a plausible reading rather
   * than real carrier telemetry.
   */
  getEsimStatus(publicId: string, plan: { dataGb: number; validityDays: number }): Promise<EsimStatus>;
}

export type EsimStatus = {
  state: "active" | "inactive" | "exhausted";
  dataRemainingGb: number;
  validityRemainingDays: number;
  lastSeenAt: string;
};

export interface EmailProvider {
  sendOrderConfirmation(email: string, orderId: string): Promise<void>;
  sendEsimDelivery(email: string, orderId: string): Promise<void>;
  /**
   * Sends one of the five lifecycle emails. Reminder emails are triggered by
   * the mock scheduler immediately instead of after a real delay.
   */
  send(
    template: EmailTemplateName,
    context: OrderEmailContext & { qrPayload?: string; tips?: string | null },
  ): Promise<void>;
}