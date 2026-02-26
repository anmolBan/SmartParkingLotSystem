import { Router } from "express";
import v1router from "./v1/index.js";

const router = Router();

router.use("/v1", v1router);
export default router;
