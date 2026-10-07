import { randomUUID, createHash } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@workspace/db";
import { users, sessions } from "@workspace/db/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

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
  console.error("Auth request failed", error);
  res.status(500).json({ error: "Something went wrong" });
}

const RegisterInput = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
  country: z.string().optional(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Необходимо принять условия" }),
  }),
  marketingConsent: z.boolean().optional(),
});

const LoginInput = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

function createSession(userId: string) {
  const token = randomUUID();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return { token, tokenHash, expiresAt };
}

async function getSessionUserId(req: Request): Promise<string | null> {
  const token = req.cookies?.session as string | undefined;
  if (!token) return null;

  const tokenHash = createHash("sha256").update(token).digest("hex");

  const session = await db
    .select()
    .from(sessions)
    .where(
      and(eq(sessions.tokenHash, tokenHash), gte(sessions.expiresAt, new Date())),
    )
    .limit(1);

  if (!session || session.length === 0) {
    return null;
  }

  return session[0].userId;
}

async function getUserFromSession(req: Request) {
  const userId = await getSessionUserId(req);
  if (!userId) return null;

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user.length > 0 ? user[0] : null;
}

router.post("/register", async (req, res) => {
  try {
    const input = RegisterInput.parse(req.body);

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      throw new HttpError(409, "Email уже зарегистрирован");
    }

    const passwordHash = await hashPassword(input.password);

    const [user] = await db
      .insert(users)
      .values({
        email: input.email.toLowerCase(),
        passwordHash,
        name: input.name || null,
        country: input.country || null,
        acceptedTermsAt: new Date(),
        marketingConsent: input.marketingConsent ?? false,
      })
      .returning();

    const { token, tokenHash, expiresAt } = createSession(user.id);

    await db.insert(sessions).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    res.cookie("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        country: user.country,
      },
    });
  } catch (error) {
    errorResponse(res, error);
  }
});

router.post("/login", async (req, res) => {
  try {
    const input = LoginInput.parse(req.body);

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email.toLowerCase()))
      .limit(1);

    if (existingUser.length === 0) {
      throw new HttpError(401, "Неверный email или пароль");
    }

    const user = existingUser[0];
    
    // Try bcrypt compare first (for new passwords)
    const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
    
    // If bcrypt fails, try SHA256 (for legacy passwords)
    let legacyValid = false;
    if (!passwordValid) {
      const sha256Hash = createHash("sha256").update(input.password).digest("hex");
      legacyValid = sha256Hash === user.passwordHash;
      
      // If legacy password is valid, upgrade it to bcrypt
      if (legacyValid) {
        const newHash = await bcrypt.hash(input.password, 10);
        await db.update(users)
          .set({ passwordHash: newHash })
          .where(eq(users.id, user.id));
      }
    }

    if (!passwordValid && !legacyValid) {
      throw new HttpError(401, "Неверный email или пароль");
    }

    const { token, tokenHash, expiresAt } = createSession(user.id);

    await db.insert(sessions).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    res.cookie("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        country: user.country,
      },
    });
  } catch (error) {
    errorResponse(res, error);
  }
});

router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies?.session as string | undefined;
    if (token) {
      const tokenHash = createHash("sha256").update(token).digest("hex");
      await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
    }

    res.clearCookie("session", {
      path: "/",
    });

    res.json({ ok: true });
  } catch (error) {
    errorResponse(res, error);
  }
});

router.get("/me", async (req, res) => {
  try {
    const user = await getUserFromSession(req);
    if (!user) {
      throw new HttpError(401, "Unauthorized");
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        country: user.country,
      },
    });
  } catch (error) {
    errorResponse(res, error);
  }
});

export function requireAuth(req: Request, res: Response, next: () => void) {
  getSessionUserId(req)
    .then((userId) => {
      if (!userId) {
        throw new HttpError(401, "Unauthorized");
      }
      next();
    })
    .catch((error) => {
      errorResponse(res, error);
    });
}

export default router;