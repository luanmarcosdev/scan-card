import express from "express";
import { ExpenseCategoryController } from "../controllers/expense-category.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();
const controller = new ExpenseCategoryController();

router.use('/expense-categories', authMiddleware);

router.get('/expense-categories', controller.findAll.bind(controller));
router.post('/expense-categories', controller.create.bind(controller));
router.get('/expense-categories/:id', controller.findOne.bind(controller));
router.put('/expense-categories/:id', controller.update.bind(controller));
router.delete('/expense-categories/:id', controller.delete.bind(controller));

export default router;
