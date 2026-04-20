import express from "express";
import { CardStatementController } from "../controllers/card-statement.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = express.Router();
const controller = new CardStatementController();

router.use('/cards/:cardId/statements', authMiddleware);

router.post('/cards/:cardId/statements', upload.array('images'), controller.create.bind(controller));
router.get('/cards/:cardId/statements', controller.findAll.bind(controller));
router.get('/cards/:cardId/statements/:id', controller.findOne.bind(controller));
router.put('/cards/:cardId/statements/:id', controller.update.bind(controller));
router.delete('/cards/:cardId/statements/:id', controller.delete.bind(controller));

export default router;
