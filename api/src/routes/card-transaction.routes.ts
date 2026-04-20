import express from "express";
import { CardTransactionController } from "../controllers/card-transaction.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();
const controller = new CardTransactionController();

router.use('/cards/:cardId/statements/:statementId/transactions', authMiddleware);

router.post('/cards/:cardId/statements/:statementId/transactions', controller.create.bind(controller));
router.get('/cards/:cardId/statements/:statementId/transactions', controller.findAll.bind(controller));
router.get('/cards/:cardId/statements/:statementId/transactions/:id', controller.findOne.bind(controller));
router.put('/cards/:cardId/statements/:statementId/transactions/:id', controller.update.bind(controller));
router.delete('/cards/:cardId/statements/:statementId/transactions/:id', controller.delete.bind(controller));

export default router;
