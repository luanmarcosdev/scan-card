import express from "express";
import { CardStatementController } from "../controllers/card-statement.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();
const controller = new CardStatementController();

router.use('/card-statements', authMiddleware);

// passo 5: adicionar multer como middleware no POST
router.post('/card-statements', controller.create.bind(controller));
router.get('/card-statements', controller.findAll.bind(controller));
router.get('/card-statements/:id', controller.findOne.bind(controller));
router.put('/card-statements/:id', controller.update.bind(controller));
router.delete('/card-statements/:id', controller.delete.bind(controller));

export default router;
