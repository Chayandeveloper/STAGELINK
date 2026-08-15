import express from 'express';
import { 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  getStats 
} from '../controllers/adminController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect, admin);

router.route('/users')
  .get(getUsers);

router.route('/users/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

router.get('/stats', getStats);

export default router;
