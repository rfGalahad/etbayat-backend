// routes/authRoutes.js - Authentication routes
import express from 'express';
import * as activityLogController from '../controllers/activityLogController/index.js';

const router = express.Router();

router.get("/view", activityLogController.getActivityLog);
router.post("/add", activityLogController.addActivity);
router.delete("/delete/:activityLogID", activityLogController.deleteActivity);


export default router;