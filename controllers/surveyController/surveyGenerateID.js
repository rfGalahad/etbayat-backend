import pool from '../../config/database.js';
import * as surveyModel from '../../models/surveyModel.js';


export const newSurveyID = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const surveyId = await surveyModel.generateSurveyId(connection);
    
    res.status(200).json({ 
      success: true, 
      surveyId: surveyId 
    });
    
  } catch (error) {
    console.error('Error generating survey ID:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating survey ID', 
      error: error.message 
    });
  } finally {
    connection.release();
  }
};










