import { logger } from "../lib/logger";
import { buildEmail, logEmail, type EmailTemplateName, type OrderEmailContext } from "./email-templates";
import type {
  EmailProvider,
  EsimProvider,
  EsimResult,
  EsimStatus,
  Payment,
  PaymentProvider,
} from "./types";

export class MockPaymentProvider implements PaymentProvider {
  async createPayment(orderId: string, amountCents: number, currency: string): Promise<Payment> {
    return {
      provider: "mock",
      providerPaymentId: `mock-payment-${orderId}`,
      amountCents,
      currency,
      status: "pending",
    };
  }

  async getPaymentStatus(): Promise<"pending"> {
    return "pending";
  }

  async refundPayment(): Promise<{ status: "refunded" }> {
    return { status: "refunded" };
  }
}

export class MockEsimProvider implements EsimProvider {
  async createEsim(orderItemId: string, planId: string): Promise<EsimResult> {
    logger.info({ orderItemId, planId }, "Mock eSIM provisioned");
    const activationCode = "MOCK-ACTIVATION-CODE-123";
    const smdpAddress = "mock.smdp.io";
    return {
      provider: "mock",
      iccid: `MOCK-ICCID-${orderItemId.slice(0, 8)}`,
      activationCode,
      smdpAddress,
      matchingId: "MOCK-MATCH-001",
      qrPayload: `LPA:1$${smdpAddress}$${activationCode}`,
    };
  }

  async getEsimStatus(
    publicId: string,
    plan: { dataGb: number; validityDays: number },
  ): Promise<EsimStatus> {
    // Deterministic pseudo-telemetry derived from the order id, so repeated
    // calls for the same order report a consistent value.
    const seed = [...publicId].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const usedFraction = ((seed % 20) + 1) / 100; // 1%–20% consumed
    const dataRemainingGb = Number((plan.dataGb * (1 - usedFraction)).toFixed(1));
    const validityRemainingDays = Math.max(0, plan.validityDays - (seed % plan.validityDays));

    const status: EsimStatus = {
      state: dataRemainingGb <= 0 ? "exhausted" : "active",
      dataRemainingGb,
      validityRemainingDays,
      lastSeenAt: new Date().toISOString(),
    };

    logger.info({ publicId, ...status }, "Mock eSIM status");
    return status;
  }
}

export class MockEmailProvider implements EmailProvider {
  async send(
    template: EmailTemplateName,
    context: OrderEmailContext & { qrPayload?: string; tips?: string | null },
  ): Promise<void> {
    logEmail(template, buildEmail(template, context));
  }

  async sendOrderConfirmation(email: string, orderId: string): Promise<void> {
    logger.info({ email, orderId }, "Mock order confirmation email");
  }

  async sendEsimDelivery(email: string, orderId: string): Promise<void> {
    logger.info({ email, orderId }, "Mock eSIM delivery email");
  }
}

export const paymentProvider: PaymentProvider = new MockPaymentProvider();
export const esimProvider: EsimProvider = new MockEsimProvider();
export const emailProvider: EmailProvider = new MockEmailProvider();