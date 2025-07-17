// routes/surveyRoutes.js - Survey routes
import express from 'express';
import * as seniorCitizenIDControllers from '../controllers/seniorCitizenIDController/index.js';
import { authenticateToken } from '../middlewares/auth.js';
import { uploadToMemory, processImageForDatabase } from '../middlewares/multer.js';




const router = express.Router();

router.get('/generate', authenticateToken, seniorCitizenIDControllers.createNewID);

router.post('/submit',     
  authenticateToken,
  uploadToMemory.fields([
    { name: 'photoID', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]), 
  processImageForDatabase, 
  seniorCitizenIDControllers.createApplication
);

router.put('/update',     
  authenticateToken,
  uploadToMemory.fields([
    { name: 'photoID', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]), 
  processImageForDatabase, 
  seniorCitizenIDControllers.updateApplication
);

router.get('/list', authenticateToken, seniorCitizenIDControllers.getAllApplications);

router.get('/view/:scApplicationID', authenticateToken, seniorCitizenIDControllers.getApplicationDetails);

router.delete('/delete/:populationID/:scApplicationID', authenticateToken, seniorCitizenIDControllers.deleteApplication);

router.get('/get-personal-info/:populationID', authenticateToken, seniorCitizenIDControllers.getPopulationDetails);

router.post('/find', authenticateToken, seniorCitizenIDControllers.searchApplicants);

export default router; 