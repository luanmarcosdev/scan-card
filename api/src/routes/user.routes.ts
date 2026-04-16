import express from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();
const controller = new UserController();

router.use('/users', authMiddleware);

router.post('/users', controller.createUser.bind(controller));
router.get('/users/me', controller.findUser.bind(controller));
router.put('/users/me', controller.updateUser.bind(controller));
router.delete('/users/me', controller.deleteUser.bind(controller));

export default router;