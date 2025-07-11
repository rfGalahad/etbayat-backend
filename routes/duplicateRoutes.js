// routes/duplicateRoutes.js
import express from 'express';
import { checkDuplicates } from '../controllers/duplicateController.js';

const router = express.Router();

// Get potential duplicates with filtering and pagination
router.get('/duplicates', checkDuplicates);

export default router;