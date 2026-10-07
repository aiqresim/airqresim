import { randomUUID } from "node:crypto";
import { and, desc, eq, gte } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  AccountLinkInput,
  ConfirmMockPaymentBody,
  CreateOrderBody,
  GetCountryParams,
  GetOrderParams,
  GetOrderQueryParams,
  GetPlanParams,
  ListCountriesQueryParams,
  ReceiveEsimWebhookBody,
  ReceivePaymentWebhookBody,
  RequestAccountLinkBody,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import {
  countries,
  esims,
  orderItems,
  orders,
  payments,
  plans,
  webhookEvents,
} from "@workspace/db/schema";
import { emailProvider, esimProvider, paymentProvider } from "../providers/mock";
import { rateLimit, verifySignature } from "../security";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const accountSessions = new Map<string, { email: string; expiresAt: number }>();

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function errorResponse(res: Response, error: unknown) {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  logger.error({ err: error }, "TravelSIM API request failed");
  res.status(500).json({ error: "Something went wrong" });
}

function accountEmail(req: Request): string | null {
  const token = req.cookies?.travelsim_account_session as string | undefined;
  if (!token) return null;
  const session = accountSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) accountSessions.delete(token);
    return null;
  }
  return session.email;
}

function planView(plan: typeof plans.$inferSelect, country: typeof countries.$inferSelect) {
  return {
    id: plan.id,
    countryId: plan.countryId,
    countrySlug: country.slug,
    countryName: country.name,
    flagEmoji: country.flagEmoji,
    dataGb: plan.dataGb,
    validityDays: plan.validityDays,
    speed: plan.speed,
    coverage: plan.coverage,
    networkOperator: plan.networkOperator,
    hotspotAllowed: plan.hotspotAllowed,
    sellingPriceCents: plan.sellingPriceCents,
    currency: plan.currency,
  };
}

router.get("/countries", async (req, res) => {
  try {
    const query = ListCountriesQueryParams.parse(req.query);
    const rows = await db.select().from(countries).where(eq(countries.isActive, true));
    const normalizedSearch = query.search?.trim().toLowerCase();
    const filtered = rows.filter((country) => {
      if (query.region && country.region !== query.region) return false;
      if (query.maxPriceCents !== undefined && country.minPriceCents > query.maxPriceCents) {
        return false;
      }
      if (
        normalizedSearch &&
        !country.name.toLowerCase().includes(normalizedSearch) &&
        !country.slug.includes(normalizedSearch)
      ) {
        return false;
      }
      return true;
    });

    const result = await Promise.all(
      filtered.map(async (country) => {
        const activePlans = await db
          .select({ id: plans.id })
          .from(plans)
          .where(and(eq(plans.countryId, country.id), eq(plans.isActive, true)));
        return {
          id: country.id,
          slug: country.slug,
          name: country.name,
          flagEmoji: country.flagEmoji,
          region: country.region,
          minPriceCents: country.minPriceCents,
          tips: country.tips ?? null,
          planCount: activePlans.length,
        };
      }),
    );
    res.json(result);
  } catch (error) {
    errorResponse(res, error);
  }
});

router.get("/countries/:slug/stats", async (req, res) => {
  try {
    const { slug } = GetCountryParams.parse(req.params);
    const [country] = await db
      .select({ id: countries.id })
      .from(countries)
      .where(and(eq(countries.slug, slug), eq(countries.isActive, true)))
      .limit(1);
    if (!country) throw new HttpError(404, "Country not found");

    // Orders placed since the first day of the current calendar month.
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const rows = await db
      .select({ orderId: orderItems.orderId })
      .from(orderItems)
      .innerJoin(plans, eq(plans.id, orderItems.planId))
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(
        and(
          eq(plans.countryId, country.id),
          gte(orders.createdAt, monthStart),
          eq(orders.paymentStatus, "succeeded"),
        ),
      );

    res.json({ slug, ordersThisMonth: rows.length });
  } catch (error) {
    errorResponse(res, error);
  }
});

router.get("/countries/:slug", async (req, res) => {
  try {
    const { slug } = GetCountryParams.parse(req.params);
    const [country] = await db
      .select()
      .from(countries)
      .where(and(eq(countries.slug, slug), eq(countries.isActive, true)))
      .limit(1);
    if (!country) throw new HttpError(404, "Country not found");

    const activePlans = await db
      .select()
      .from(plans)
      .where(and(eq(plans.countryId, country.id), eq(plans.isActive, true)));
    res.json({
      country: {
        id: country.id,
        slug: country.slug,
        name: country.name,
        flagEmoji: country.flagEmoji,
        region: country.region,
        minPriceCents: country.minPriceCents,
        tips: country.tips ?? null,
        planCount: activePlans.length,
      },
      plans: activePlans.map((plan) => planView(plan, country)),
    });
  } catch (error) {
    errorResponse(res, error);
  }
});

router.get("/plans/:id", async (req, res) => {
  try {
    const { id } = GetPlanParams.parse(req.params);
    const [row] = await db
      .select({ plan: plans, country: countries })
      .from(plans)
      .innerJoin(countries, eq(plans.countryId, countries.id))
      .where(and(eq(plans.id, id), eq(plans.isActive, true), eq(countries.isActive, true)))
      .limit(1);
    if (!row) throw new HttpError(404, "Plan not found");
    res.json(planView(row.plan, row.country));
  } catch (error) {
    errorResponse(res, error);
  }
});

router.post("/orders", rateLimit("orders", 30), async (req, res) => {
  try {
    const input = CreateOrderBody.parse(req.body);
    const result = await db.transaction(async (tx) => {
      const [row] = await tx
        .select({ plan: plans, country: countries })
        .from(plans)
        .innerJoin(countries, eq(plans.countryId, countries.id))
        .where(and(eq(plans.id, input.planId), eq(plans.isActive, true), eq(countries.isActive, true)))
        .limit(1);
      if (!row) throw new HttpError(400, "Selected plan is not available");

      const [order] = await tx
        .insert(orders)
        .values({
          email: input.email.toLowerCase(),
          name: input.name || null,
          customerCountry: input.customerCountry || null,
          status: "PAYMENT_PENDING",
          paymentStatus: "pending",
          esimStatus: "pending",
          totalCents: row.plan.sellingPriceCents,
          currency: row.plan.currency,
        })
        .returning();

      await tx.insert(orderItems).values({
        orderId: order.id,
        planId: row.plan.id,
        quantity: 1,
        unitPriceCents: row.plan.sellingPriceCents,
        snapshot: {
          countryName: row.country.name,
          countrySlug: row.country.slug,
          flagEmoji: row.country.flagEmoji,
          dataGb: row.plan.dataGb,
          validityDays: row.plan.validityDays,
          speed: row.plan.speed,
          coverage: row.plan.coverage,
          networkOperator: row.plan.networkOperator,
          hotspotAllowed: row.plan.hotspotAllowed,
          supplierCostCents: row.plan.supplierCostCents,
          sellingPriceCents: row.plan.sellingPriceCents,
          currency: row.plan.currency,
        },
      });

      const payment = await paymentProvider.createPayment(
        order.id,
        row.plan.sellingPriceCents,
        row.plan.currency,
      );
      await tx.insert(payments).values({
        orderId: order.id,
        provider: payment.provider,
        providerPaymentId: payment.providerPaymentId,
        amountCents: payment.amountCents,
        currency: payment.currency,
        status: payment.status,
      });
      return {
        orderId: order.id,
        publicId: order.publicId,
        accessToken: order.accessToken,
        totalCents: order.totalCents,
        currency: order.currency,
        status: order.status,
        email: order.email,
        countryName: row.country.name,
        countrySlug: row.country.slug,
        planSummary: `${row.plan.dataGb} GB · ${row.plan.validityDays} days`,
      };
    });

    await emailProvider.send("order-confirmation", {
      email: result.email,
      publicId: result.publicId,
      accessToken: result.accessToken,
      countryName: result.countryName,
      countrySlug: result.countrySlug,
      planSummary: result.planSummary,
      totalCents: result.totalCents,
      currency: result.currency,
      appUrl: process.env.APP_URL ?? "http://localhost:3000",
    });
    res.status(201).json({
      orderId: result.orderId,
      publicId: result.publicId,
      accessToken: result.accessToken,
      totalCents: result.totalCents,
      currency: result.currency,
      status: result.status,
    });
  } catch (error) {
    errorResponse(res, error);
  }
});

router.get("/orders/:publicId", async (req, res) => {
  try {
    const { publicId } = GetOrderParams.parse(req.params);
    const { token } = GetOrderQueryParams.parse(req.query);
    if (!token) throw new HttpError(403, "Order access token is required");

    const [row] = await db
      .select({ order: orders, item: orderItems, plan: plans, country: countries, esim: esims })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .innerJoin(plans, eq(plans.id, orderItems.planId))
      .innerJoin(countries, eq(countries.id, plans.countryId))
      .leftJoin(esims, eq(esims.orderId, orders.id))
      .where(eq(orders.publicId, publicId))
      .limit(1);
    if (!row) throw new HttpError(404, "Order not found");
    if (row.order.accessToken !== token) throw new HttpError(403, "Invalid order access token");

    res.json({
      publicId: row.order.publicId,
      email: row.order.email,
      name: row.order.name,
      countryName: row.country.name,
      flagEmoji: row.country.flagEmoji,
      dataGb: row.plan.dataGb,
      validityDays: row.plan.validityDays,
      speed: row.plan.speed,
      coverage: row.plan.coverage,
      networkOperator: row.plan.networkOperator,
      hotspotAllowed: row.plan.hotspotAllowed,
      totalCents: row.order.totalCents,
      currency: row.order.currency,
      status: row.order.status,
      paymentStatus: row.order.paymentStatus,
      esimStatus: row.order.esimStatus,
      createdAt: row.order.createdAt,
      qrPayload: row.esim?.qrPayload ?? null,
      activationCode: row.esim?.activationCode ?? null,
      smdpAddress: row.esim?.smdpAddress ?? null,
      matchingId: row.esim?.matchingId ?? null,
    });
  } catch (error) {
    errorResponse(res, error);
  }
});

router.post("/payments/mock/confirm", rateLimit("payments", 30), async (req, res) => {
  try {
    const input = ConfirmMockPaymentBody.parse(req.body);
    const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
    if (!order) throw new HttpError(404, "Order not found");
    if (order.accessToken !== input.accessToken) throw new HttpError(403, "Invalid order access token");

    const existingEsim = await db.select().from(esims).where(eq(esims.orderId, order.id)).limit(1);
    if (existingEsim[0] && order.paymentStatus === "succeeded") {
      res.json({
        publicId: order.publicId,
        accessToken: order.accessToken,
        status: order.status,
        paymentStatus: order.paymentStatus,
        esimStatus: order.esimStatus,
      });
      return;
    }

    const [item] = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).limit(1);
    if (!item) throw new HttpError(500, "Order item is missing");

    await db
      .update(payments)
      .set({ status: "succeeded", updatedAt: new Date() })
      .where(eq(payments.orderId, order.id));
    await db
      .update(orders)
      .set({ status: "ESIM_PROVISIONING", paymentStatus: "succeeded", updatedAt: new Date() })
      .where(eq(orders.id, order.id));

    try {
      const esim = await esimProvider.createEsim(item.id, item.planId);
      await db.insert(esims).values({
        orderId: order.id,
        orderItemId: item.id,
        provider: esim.provider,
        iccid: esim.iccid,
        activationCode: esim.activationCode,
        smdpAddress: esim.smdpAddress,
        matchingId: esim.matchingId,
        qrPayload: esim.qrPayload,
        status: "ready",
      });
      const [updatedOrder] = await db
        .update(orders)
        .set({ status: "ESIM_READY", esimStatus: "ready", updatedAt: new Date() })
        .where(eq(orders.id, order.id))
        .returning();

      const [country] = await db
        .select({ name: countries.name, slug: countries.slug, tips: countries.tips })
        .from(countries)
        .innerJoin(plans, eq(plans.countryId, countries.id))
        .where(eq(plans.id, item.planId))
        .limit(1);

      const emailContext = {
        email: updatedOrder.email,
        publicId: updatedOrder.publicId,
        accessToken: updatedOrder.accessToken,
        countryName: country?.name ?? "your destination",
        countrySlug: country?.slug ?? "",
        planSummary: `${item.snapshot.dataGb} GB · ${item.snapshot.validityDays} days`,
        totalCents: updatedOrder.totalCents,
        currency: updatedOrder.currency,
        appUrl: process.env.APP_URL ?? "http://localhost:3000",
      };

      // Mock scheduler: every reminder fires immediately after provisioning.
      await emailProvider.send("esim-ready", { ...emailContext, qrPayload: esim.qrPayload });
      await emailProvider.send("installation-reminder", emailContext);
      await emailProvider.send("pre-trip-reminder", { ...emailContext, tips: country?.tips ?? null });
      await emailProvider.send("post-trip-followup", emailContext);

      res.json({
        publicId: updatedOrder.publicId,
        accessToken: updatedOrder.accessToken,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
        esimStatus: updatedOrder.esimStatus,
      });
    } catch (error) {
      await db
        .update(orders)
        .set({ status: "FAILED", esimStatus: "failed", updatedAt: new Date() })
        .where(eq(orders.id, order.id));
      logger.error({ err: error, orderId: order.id }, "eSIM provisioning failed");
      throw new HttpError(502, "eSIM provisioning failed");
    }
  } catch (error) {
    errorResponse(res, error);
  }
});

router.get("/esim/status", rateLimit("esim-status", 60), async (req, res) => {
  try {
    // A malformed token must not surface as a 500: treat it as "forbidden".
    const parsedQuery = GetOrderQueryParams.safeParse(req.query);
    if (!parsedQuery.success || !parsedQuery.data.token) {
      throw new HttpError(403, "Order access token is required");
    }
    const token = parsedQuery.data.token;

    const [row] = await db
      .select({ order: orders, plan: plans })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .innerJoin(plans, eq(plans.id, orderItems.planId))
      .where(eq(orders.publicId, String(req.query.publicId ?? "")))
      .limit(1);

    if (!row) throw new HttpError(404, "Order not found");
    if (row.order.accessToken !== token) throw new HttpError(403, "Invalid order access token");
    if (row.order.esimStatus !== "ready" && row.order.esimStatus !== "activated") {
      throw new HttpError(409, "eSIM is not ready yet");
    }

    const status = await esimProvider.getEsimStatus(row.order.publicId, {
      dataGb: row.plan.dataGb,
      validityDays: row.plan.validityDays,
    });

    res.json(status);
  } catch (error) {
    errorResponse(res, error);
  }
});

router.post("/account/request-link", async (req, res) => {
  try {
    const { email } = RequestAccountLinkBody.parse(req.body);
    const token = randomUUID();
    accountSessions.set(token, { email: email.toLowerCase(), expiresAt: Date.now() + 15 * 60_000 });
    res.cookie("travelsim_account_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60_000,
    });
    logger.info({ email }, "Mock account link created");
    res.json({
      message: "You are signed in. Your orders are ready.",
      mockLink: `/account?token=${token}`,
    });
  } catch (error) {
    errorResponse(res, error);
  }
});

router.get("/account/orders", async (req, res) => {
  try {
    const email = accountEmail(req);
    if (!email) throw new HttpError(401, "Account access required");

    const rows = await db
      .select({ order: orders, item: orderItems, plan: plans, country: countries, esim: esims })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .innerJoin(plans, eq(plans.id, orderItems.planId))
      .innerJoin(countries, eq(countries.id, plans.countryId))
      .leftJoin(esims, eq(esims.orderId, orders.id))
      .where(eq(orders.email, email))
      .orderBy(desc(orders.createdAt));

    res.json(
      rows.map((row) => ({
        publicId: row.order.publicId,
        accessToken: row.order.accessToken,
        email: row.order.email,
        countryName: row.country.name,
        flagEmoji: row.country.flagEmoji,
        dataGb: row.plan.dataGb,
        validityDays: row.plan.validityDays,
        totalCents: row.order.totalCents,
        currency: row.order.currency,
        status: row.order.status,
        paymentStatus: row.order.paymentStatus,
        esimStatus: row.order.esimStatus,
        createdAt: row.order.createdAt,
      })),
    );
  } catch (error) {
    errorResponse(res, error);
  }
});

async function receiveWebhook(
  req: Request,
  res: Response,
  parser: typeof ReceivePaymentWebhookBody,
) {
  try {
    if (!verifySignature()) throw new HttpError(401, "Invalid webhook signature");
    const input = parser.parse(req.body);
    const inserted = await db
      .insert(webhookEvents)
      .values({
        provider: input.provider,
        eventId: input.eventId,
        payload: input.payload,
        processedAt: new Date(),
      })
      .onConflictDoNothing({
        target: [webhookEvents.provider, webhookEvents.eventId],
      })
      .returning({ id: webhookEvents.id });
    res.json({ accepted: true, duplicate: inserted.length === 0 });
  } catch (error) {
    errorResponse(res, error);
  }
}

router.post("/webhooks/payment", rateLimit("webhooks"), (req, res) =>
  receiveWebhook(req, res, ReceivePaymentWebhookBody),
);
router.post("/webhooks/esim", rateLimit("webhooks"), (req, res) =>
  receiveWebhook(req, res, ReceiveEsimWebhookBody),
);

export default router;