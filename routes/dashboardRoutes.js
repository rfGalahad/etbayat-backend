import express from 'express';
import * as dashboardController from '../controllers/dashboardController/index.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/getTotal/:year', dashboardController.getTotal);
router.get('/barangayStats/:year', dashboardController.getBarangayStats);




export default router; 