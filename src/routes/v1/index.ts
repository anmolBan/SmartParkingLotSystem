import express from 'express';
import adminRouter from "../admin/index.js";
import parkingRouter from "../parking/index.js";

const router = express.Router();

router.use('/admin', adminRouter);
router.use('/parking', parkingRouter);

export default router;