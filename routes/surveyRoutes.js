// routes/surveyRoutes.js - Survey routes
import express from 'express';
import * as surveyController from '../controllers/surveyController/index.js';

import { authenticateToken } from '../middlewares/auth.js';
import { uploadToMemory, processImageForDatabase } from '../middlewares/multer.js';




const router = express.Router();

router.get('/generate', authenticateToken, surveyController.newSurveyID);

router.post('/submit', 
  authenticateToken, 
  uploadToMemory.fields([
    {name: 'houseImages', maxCount: 10 },
    {name: 'photo', maxCount: 1 },
    {name: 'signature', maxCount: 1 }
  ]),
  processImageForDatabase,
  surveyController.submitSurvey
);

router.put('/update', 
  authenticateToken, 
  uploadToMemory.fields([
    {name: 'houseImages', maxCount: 10 },
    {name: 'photo', maxCount: 1 },
    {name: 'signature', maxCount: 1 }
  ]),
  processImageForDatabase,
  surveyController.updateSurvey
);

router.get('/list/:username/:position', authenticateToken, surveyController.listSurvey);

router.get('/view/:surveyID', authenticateToken, surveyController.viewSurvey);

router.delete('/delete/:surveyID', authenticateToken, surveyController.deleteSurvey);



export default router; 