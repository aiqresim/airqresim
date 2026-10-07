import { logger } from "../lib/logger";

/** Envelope handed to the email provider for every transactional message. */
export interface EmailMessage {
  to: string;
  subject: string;
  /** Plain-text alternative. */
  text: string;
  /** Simple HTML body; tables + inline styles only for mail-client safety. */
  html: string;
}

export type EmailTemplateName =
  | "order-confirmation"
  | "esim-ready"
  | "installation-reminder"
  | "pre-trip-reminder"
  | "post-trip-followup";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Shared responsive shell for every email. */
function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#F8FAFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:24px 28px;border-bottom:1px solid #E2E8F0;">
          <span style="font-size:18px;font-weight:700;">AirQr</span>
          <span style="float:right;font-size:12px;color:#64748B;">eSIM for travelers</span>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;">${escapeHtml(title)}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #E2E8F0;font-size:12px;color:#64748B;">
          AirQr · This is a mock email and was not actually delivered.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0;"><a href="${escapeHtml(href)}" style="display:inline-block;background:#2563EB;color:#FFFFFF;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;">${escapeHtml(label)}</a></p>`;
}

function row(label: string, value: string): string {
  return `<p style="margin:0 0 8px;font-size:14px;"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;
}

function money(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

export interface OrderEmailContext {
  email: string;
  publicId: string;
  accessToken: string;
  countryName: string;
  countrySlug: string;
  planSummary: string;
  totalCents: number;
  currency: string;
  /** App base URL used to build deep links. */
  appUrl: string;
}
export function orderConfirmationEmail(ctx: OrderEmailContext): EmailMessage {
  const orderUrl = `${ctx.appUrl}/order/${ctx.publicId}?token=${encodeURIComponent(ctx.accessToken)}`;
  const text = [
    `Thanks for your order, ${ctx.email}.`,
    `Order: ${ctx.publicId}`,
    `Country: ${ctx.countryName}`,
    `Plan: ${ctx.planSummary}`,
    `Total: ${money(ctx.totalCents, ctx.currency)}`,
    `View your order: ${orderUrl}`,
  ].join("\n");

  return {
    to: ctx.email,
    subject: `Your AirQr order is confirmed — ${ctx.countryName} eSIM`,
    text,
    html: layout(
      "Your order is confirmed",
      `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Thanks for your order. We are preparing your eSIM now.</p>
       ${row("Order", ctx.publicId)}
       ${row("Country", ctx.countryName)}
       ${row("Plan", ctx.planSummary)}
       ${row("Total", money(ctx.totalCents, ctx.currency))}
       ${button(orderUrl, "View your order")}`,
    ),
  };
}

export function esimReadyEmail(ctx: OrderEmailContext & { qrPayload: string }): EmailMessage {
  const orderUrl = `${ctx.appUrl}/order/${ctx.publicId}?token=${encodeURIComponent(ctx.accessToken)}`;
  const installUrl = `${ctx.appUrl}/how-to-install`;
  const text = [
    `Your ${ctx.countryName} eSIM is ready.`,
    `Activation payload: ${ctx.qrPayload}`,
    `Open your eSIM: ${orderUrl}`,
    `Installation guide: ${installUrl}`,
  ].join("\n");

  return {
    to: ctx.email,
    subject: "Your eSIM is ready! 🌍",
    text,
    html: layout(
      "Your eSIM is ready! 🌍",
      `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Scan the activation QR code in your order page to install it.</p>
       <p style="margin:0 0 16px;font-size:13px;word-break:break-all;background:#F1F5F9;border:1px solid #E2E8F0;border-radius:10px;padding:12px;"><strong>Activation payload</strong><br><span style="color:#334155;">${escapeHtml(ctx.qrPayload)}</span></p>
       ${button(orderUrl, "Open your eSIM")}
       ${button(installUrl, "Installation guide")}`,
    ),
  };
}

export function installationReminderEmail(ctx: OrderEmailContext): EmailMessage {
  const installUrl = `${ctx.appUrl}/how-to-install`;
  const orderUrl = `${ctx.appUrl}/order/${ctx.publicId}?token=${encodeURIComponent(ctx.accessToken)}`;

  return {
    to: ctx.email,
    subject: "Don't forget to install your eSIM before your trip",
    text: [
      `Your ${ctx.countryName} eSIM is provisioned and waiting.`,
      `Scan the QR code before you fly: ${orderUrl}`,
      `Guide: ${installUrl}`,
    ].join("\n"),
    html: layout(
      "Don't forget to install your eSIM",
      `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Your eSIM is provisioned. Install it before departure so you are online as soon as you land.</p>
       <ol style="margin:0 0 16px;padding-left:20px;font-size:14px;line-height:1.8;">
         <li>Open the order page on another screen.</li>
         <li>Scan the QR code with your phone camera.</li>
         <li>Turn on data roaming for the eSIM line after you land.</li>
       </ol>
       ${button(orderUrl, "Open your eSIM")}
       ${button(installUrl, "Installation guide")}`,
    ),
  };
}
export function preTripReminderEmail(ctx: OrderEmailContext & { tips?: string | null }): EmailMessage {
  const orderUrl = `${ctx.appUrl}/order/${ctx.publicId}?token=${encodeURIComponent(ctx.accessToken)}`;

  return {
    to: ctx.email,
    subject: `Getting ready for ${ctx.countryName}?`,
    text: [
      `Your trip to ${ctx.countryName} is coming up.`,
      ctx.tips ?? "",
      "Checklist: install eSIM, enable roaming, download offline maps.",
      `Open your order: ${orderUrl}`,
    ]
      .filter(Boolean)
      .join("\n"),
    html: layout(
      `Getting ready for ${ctx.countryName}?`,
      `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">A few things to do before you fly.</p>
       ${ctx.tips ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#334155;">${escapeHtml(ctx.tips)}</p>` : ""}
       <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;line-height:1.8;">
         <li>Install the eSIM and test it</li>
         <li>Remember to enable data roaming after landing</li>
         <li>Download offline maps</li>
       </ul>
       ${button(orderUrl, "Open your order")}`,
    ),
  };
}

export function postTripFollowupEmail(ctx: OrderEmailContext): EmailMessage {
  const destUrl = `${ctx.appUrl}/countries`;

  return {
    to: ctx.email,
    subject: `How was your trip to ${ctx.countryName}?`,
    text: [
      `We hope you stayed connected across ${ctx.countryName}.`,
      "Tell us how it went and use code WELCOME10 on your next eSIM order.",
      `Browse destinations: ${destUrl}`,
    ].join("\n"),
    html: layout(
      `How was your trip to ${ctx.countryName}?`,
      `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">We hope you stayed connected the whole way. Help us improve by telling us about your experience.</p>
       <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">As a thank you, use code <strong>WELCOME10</strong> on your next eSIM order.</p>
       ${button(destUrl, "Browse destinations")}`,
    ),
  };
}

const TEMPLATE_BUILDERS: Record<
  EmailTemplateName,
  (ctx: OrderEmailContext & { qrPayload?: string; tips?: string | null }) => EmailMessage
> = {
  "order-confirmation": (ctx) => orderConfirmationEmail(ctx),
  "esim-ready": (ctx) => esimReadyEmail({ ...ctx, qrPayload: ctx.qrPayload ?? "" }),
  "installation-reminder": (ctx) => installationReminderEmail(ctx),
  "pre-trip-reminder": (ctx) => preTripReminderEmail({ ...ctx, tips: ctx.tips }),
  "post-trip-followup": (ctx) => postTripFollowupEmail(ctx),
};

export function buildEmail(
  template: EmailTemplateName,
  ctx: OrderEmailContext & { qrPayload?: string; tips?: string | null },
): EmailMessage {
  return TEMPLATE_BUILDERS[template](ctx);
}

/**
 * Mock delivery: nothing is sent, every message is logged so a future admin
 * view can list what would have gone out.
 */
export function logEmail(template: EmailTemplateName, message: EmailMessage): void {
  logger.info(
    { to: message.to, subject: message.subject, template },
    "email would be sent",
  );
}