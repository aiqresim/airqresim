import { Router, type IRouter } from "express";
import contactRouter from "./contact";
import healthRouter from "./health";
import authRouter from "./auth";
import travelsimRouter from "./travelsim";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use(travelsimRouter);
router.use(contactRouter);
router.use("/admin", adminRouter);

export default router;
