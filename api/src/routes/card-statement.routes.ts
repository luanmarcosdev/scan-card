import express from "express";
import { CardStatementController } from "../controllers/card-statement.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = express.Router();
const controller = new CardStatementController();

router.use('/card-statements', authMiddleware);

router.post('/card-statements', upload.array('images'), controller.create.bind(controller));
router.get('/card-statements', controller.findAll.bind(controller));
router.get('/card-statements/:id', controller.findOne.bind(controller));
router.put('/card-statements/:id', controller.update.bind(controller));
router.delete('/card-statements/:id', controller.delete.bind(controller));

export default router;
