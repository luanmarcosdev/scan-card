import express from "express";
import { AuthController } from "../controllers/auth.controller";

const router = express.Router();
const controller = new AuthController();

router.post("/auth/register", controller.register.bind(controller));
router.post("/auth/login", controller.login.bind(controller));

export default router;
