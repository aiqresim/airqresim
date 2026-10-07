import { Router, type IRouter } from "express";
import { CreateContactMessageBody } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { contactMessages } from "@workspace/db/schema";
import { rateLimit } from "../security";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/contact", rateLimit("contact", 10), async (req, res) => {
  const parsed = CreateContactMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid contact request" });
    return;
  }

  const [row] = await db
    .insert(contactMessages)
    .values({
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name,
      subject: parsed.data.subject,
      message: parsed.data.message,
    })
    .returning({
      id: contactMessages.id,
      status: contactMessages.status,
      createdAt: contactMessages.createdAt,
    });

  logger.info(
    { subject: parsed.data.subject, contactMessageId: row.id },
    "Contact message stored",
  );

  res.status(201).json(row);
});

export default router;