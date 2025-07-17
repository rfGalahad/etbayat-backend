// routes/surveyRoutes.js - Survey routes
import express from 'express';
import * as soloParentIDControllers from '../controllers/soloParentIDController/index.js';
import { authenticateToken } from '../middlewares/auth.js';
import { uploadToMemory, processImageForDatabase } from '../middlewares/multer.js';

const router = express.Router();

router.get('/generate', authenticateToken, soloParentIDControllers.createNewID);

router.post('/submit', 
  authenticateToken, 
  uploadToMemory.fields([
    { name: 'photoID', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]), 
  processImageForDatabase,  
  soloParentIDControllers.createApplication
);

router.put('/update', 
  authenticateToken, 
  uploadToMemory.fields([
    { name: 'photoID', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]), 
  processImageForDatabase,  
  soloParentIDControllers.updateApplication
);

router.get('/list', authenticateToken, soloParentIDControllers.getAllApplications);

router.get('/view/:spApplicationID', authenticateToken, soloParentIDControllers.getApplicationDetails);

router.delete('/delete/:populationID/:spApplicationID', authenticateToken, soloParentIDControllers.deleteApplication);

router.get('/get-personal-info/:populationID', authenticateToken, soloParentIDControllers.getPopulationDetails);

router.post('/find', authenticateToken, soloParentIDControllers.searchApplicants);

export default router; 