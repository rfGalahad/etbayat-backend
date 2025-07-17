import express from 'express';
import * as pwdIDControllers from '../controllers/pwdIDController/index.js';
import { authenticateToken } from '../middlewares/auth.js';
import { uploadToMemory, processImageForDatabase } from '../middlewares/multer.js';




const router = express.Router();

router.post('/submit', 
  authenticateToken,
  uploadToMemory.fields([
    { name: 'photoID', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]), 
  processImageForDatabase,  
  pwdIDControllers.createPWDApplication
);

router.put('/update', 
  authenticateToken,
  uploadToMemory.fields([
    { name: 'photoID', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]), 
  processImageForDatabase,  
  pwdIDControllers.updatePWDApplication
);

router.get('/list', authenticateToken, pwdIDControllers.getAllPWDApplications);

router.get('/view/:pwdApplicationID', authenticateToken, pwdIDControllers.getPWDApplicationDetails);

router.delete('/delete/:populationID/:pwdApplicationID', authenticateToken, pwdIDControllers.deletePWDApplication);

router.get('/get-personal-info/:populationID', authenticateToken, pwdIDControllers.getPopulationDetails);

router.post('/find', authenticateToken, pwdIDControllers.searchPWDApplicants);




export default router; 