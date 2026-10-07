
import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { createHash, randomUUID } from "node:crypto";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { db } from "@workspace/db";
import {
  adminSessions,
  adminUsers,
  countries,
  orders,
  plans,
  users,
} from "@workspace/db/schema";

const router: IRouter = Router();

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

async function getAdminSession(req: Request) {
  const token = (req as any).cookies?.admin_session as string | undefined;
  if (!token) return null;
  const tokenHash = sha256(token);
  const rows = await db
    .select({ adminId: adminSessions.adminId })
    .from(adminSessions)
    .where(
      and(
        eq(adminSessions.tokenHash, tokenHash),
        gt(adminSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (rows.length === 0) return null;
  return rows[0].adminId;
}

async function adminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const adminId = await getAdminSession(req);
  if (!adminId) {
    res.status(401).json({ error: "Admin access required" });
    return;
  }
  (req as any).adminId = adminId;
  next();
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminHash = process.env.ADMIN_PASSWORD_HASH;
    if (!adminEmail || !adminHash) {
      res.status(500).json({ error: "Admin not configured" });
      return;
    }
    if (String(email).toLowerCase() !== adminEmail.toLowerCase()) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const ok = await bcrypt.compare(String(password), adminHash);
    if (!ok) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    let adminId: string;
    const existing = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.email, adminEmail))
      .limit(1);
    if (existing.length > 0) {
      adminId = existing[0].id;
    } else {
      const inserted = await db
        .insert(adminUsers)
        .values({ email: adminEmail, passwordHash: adminHash })
        .returning({ id: adminUsers.id });
      adminId = inserted[0].id;
    }

    const token = randomUUID() + randomUUID();
    const tokenHash = sha256(token);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.insert(adminSessions).values({ adminId, tokenHash, expiresAt });

    res.cookie("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });
    res.json({ admin: { id: adminId, email: adminEmail } });
  } catch (e) {
    console.error("[admin/login]", e);
    res.status(500).json({ error: "Internal error" });
  }
});

router.post("/logout", async (req, res) => {
  const token = (req as any).cookies?.admin_session as string | undefined;
  if (token) {
    await db.delete(adminSessions).where(eq(adminSessions.tokenHash, sha256(token)));
  }
  res.clearCookie("admin_session", { path: "/" });
  res.json({ ok: true });
});

router.get("/me", async (req, res) => {
  const adminId = await getAdminSession(req);
  if (!adminId) {
    res.status(401).json({ admin: null });
    return;
  }
  const rows = await db
    .select({ id: adminUsers.id, email: adminUsers.email })
    .from(adminUsers)
    .where(eq(adminUsers.id, adminId))
    .limit(1);
  if (rows.length === 0) {
    res.status(401).json({ admin: null });
    return;
  }
  res.json({ admin: rows[0] });
});

router.get("/stats", adminAuth, async (_req, res) => {
  try {
    const allOrders = await db
      .select({
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        totalCents: orders.totalCents,
      })
      .from(orders);

    let totalRevenue = 0;
    let successOrders = 0;
    let failedOrders = 0;
    for (const o of allOrders) {
      if (o.paymentStatus === "succeeded") {
        totalRevenue += o.totalCents;
        successOrders += 1;
      }
      if (o.status === "FAILED") failedOrders += 1;
    }

    const usersCount = await db.select({ c: sql<number>`count(*)` }).from(users);

    res.json({
      totalOrders: allOrders.length,
      totalRevenueCents: totalRevenue,
      totalUsers: Number(usersCount[0]?.c ?? 0),
      successOrders,
      failedOrders,
    });
  } catch (e) {
    console.error("[admin/stats]", e);
    res.status(500).json({ error: "Internal error" });
  }
});

router.get("/orders", adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const offset = (page - 1) * limit;

    const rows = await db
      .select({
        id: orders.id,
        publicId: orders.publicId,
        email: orders.email,
        name: orders.name,
        customerCountry: orders.customerCountry,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        esimStatus: orders.esimStatus,
        totalCents: orders.totalCents,
        currency: orders.currency,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await db.select({ c: sql<number>`count(*)` }).from(orders);

    res.json({
      orders: rows,
      total: Number(total[0]?.c ?? 0),
      page,
      limit,
    });
  } catch (e) {
    console.error("[admin/orders]", e);
    res.status(500).json({ error: "Internal error" });
  }
});

router.get("/orders/:publicId", adminAuth, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(orders)
      .where(sql`${orders.publicId} = ${req.params.publicId}`)
      .limit(1);
    if (rows.length === 0) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json({ order: rows[0] });
  } catch (e) {
    console.error("[admin/orders/:publicId]", e);
    res.status(500).json({ error: "Internal error" });
  }
});

router.get("/customers", adminAuth, async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        country: users.country,
        createdAt: users.createdAt,
        ordersCount: sql<number>`count(${orders.id})`,
        totalCents: sql<number>`coalesce(sum(${orders.totalCents}), 0)`,
      })
      .from(users)
      .leftJoin(orders, eq(orders.email, users.email))
      .groupBy(users.id)
      .orderBy(desc(users.createdAt))
      .limit(200);

    res.json({ customers: rows });
  } catch (e) {
    console.error("[admin/customers]", e);
    res.status(500).json({ error: "Internal error" });
  }
});

router.get("/products", adminAuth, async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: plans.id,
        dataGb: plans.dataGb,
        validityDays: plans.validityDays,
        speed: plans.speed,
        supplierCostCents: plans.supplierCostCents,
        sellingPriceCents: plans.sellingPriceCents,
        currency: plans.currency,
        isActive: plans.isActive,
        countryName: countries.name,
        countrySlug: countries.slug,
        countryFlag: countries.flagEmoji,
      })
      .from(plans)
      .leftJoin(countries, eq(plans.countryId, countries.id))
      .orderBy(countries.name, plans.dataGb);

    res.json({ products: rows });
  } catch (e) {
    console.error("[admin/products]", e);
    res.status(500).json({ error: "Internal error" });
  }
});

router.patch("/products/plans/:id", adminAuth, async (req, res) => {
  try {
    const { sellingPriceCents, isActive } = req.body ?? {};
    const updates: { sellingPriceCents?: number; isActive?: boolean } = {};
    if (typeof sellingPriceCents === "number" && sellingPriceCents > 0) {
      updates.sellingPriceCents = Math.round(sellingPriceCents);
    }
    if (typeof isActive === "boolean") {
      updates.isActive = isActive;
    }
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "Nothing to update" });
      return;
    }
    await db.update(plans).set(updates).where(sql`${plans.id} = ${req.params.id}`);
    res.json({ ok: true });
  } catch (e) {
    console.error("[admin/products/plans/:id]", e);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;