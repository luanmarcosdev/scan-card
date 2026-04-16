import express from "express";
import { CardController } from "../controllers/card.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();
const controller = new CardController();

router.use('/cards', authMiddleware);

router.get('/cards', controller.findAll.bind(controller));
router.post('/cards', controller.create.bind(controller));
router.get('/cards/:id', controller.findOne.bind(controller));
router.put('/cards/:id', controller.update.bind(controller));
router.delete('/cards/:id', controller.delete.bind(controller));

export default router;
