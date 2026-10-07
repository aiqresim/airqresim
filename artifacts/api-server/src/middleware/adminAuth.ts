import { type Request, type Response, type NextFunction } from "express";
import { createHash } from "node:crypto";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@workspace/db";
import { adminSessions, adminUsers } from "@workspace/db/schema";

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function getAdminSession(req: Request): Promise<{ adminId: string } | null> {
  const token = req.cookies?.admin_session as string | undefined;
  if (!token) return null;

  const tokenHash = createHash("sha256").update(token).digest("hex");

  const session = await db
    .select({ adminId: adminSessions.adminId })
    .from(adminSessions)
    .where(
      and(
        eq(adminSessions.tokenHash, tokenHash),
        gte(adminSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!session || session.length === 0) {
    return null;
  }

  return { adminId: session[0].adminId };
}

export async function getAdminFromSession(req: Request) {
  const session = await getAdminSession(req);
  if (!session) return null;

  const admin = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, session.adminId))
    .limit(1);

  return admin.length > 0 ? admin[0] : null;
}

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  getAdminSession(req)
    .then((session) => {
      if (!session) {
        throw new HttpError(401, "Unauthorized");
      }
      (req as any).adminId = session.adminId;
      next();
    })
    .catch((error) => {
      if (error instanceof HttpError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      console.error("Admin auth failed", error);
      res.status(500).json({ error: "Something went wrong" });
    });
}