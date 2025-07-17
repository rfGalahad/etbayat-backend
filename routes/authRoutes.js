// routes/authRoutes.js - Authentication routes
import express from 'express';
import * as authController from '../controllers/authController/index.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.post("/login", authController.login);

router.post("/add-account", authController.createAccount);
router.post("/register-batch", authController.createAccountsBatch);
router.delete('/delete-account/:userID', authenticateToken, authController.deleteAccount);
router.get('/manage-accounts', authenticateToken, authController.getAllAccounts);

router.get('/last-sequence', authController.getLastUserSequence);

router.put('/users/:userID', authenticateToken, authController.updateUserProfile);
router.put('/users/:userID/password', authenticateToken, authController.changePassword);



export default router; 