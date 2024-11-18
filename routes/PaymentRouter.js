import express from "express";
import {
  stripeWebhook,
  processPayment,
} from "../controllers/PaymentController.js";
const PaymentRouter = express.Router();
PaymentRouter.post("/payment_create", processPayment);
PaymentRouter.post(
  "/my-webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);
export default PaymentRouter;
