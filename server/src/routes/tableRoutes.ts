import express from 'express';
import { createTable, getTablesByRestaurant, updateTable, deleteTable } from '../controllers/tableController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
  .post(protect, createTable);

router.route('/restaurant/:restaurantId')
  .get(getTablesByRestaurant);

router.route('/:id')
  .put(protect, updateTable)
  .delete(protect, deleteTable);

export default router;
