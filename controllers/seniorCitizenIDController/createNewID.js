import pool from '../../config/database.js';
import * as seniorCitizenIDModel from '../../models/seniorCitizenIDModel.js';



export const createNewID = async (req, res) => {

  const connection = await pool.getConnection();
  
  try {
    const seniorCitizenID = await seniorCitizenIDModel.generateSeniorCitizenId(connection);
    
    res.status(200).json({ 
      success: true, 
      seniorCitizenID: seniorCitizenID 
    });
    
  } catch (error) {
    console.error('Error generating Senior Citizen ID:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating Senior Citizen ID', 
      error: error.message 
    });
  } finally {
    connection.release();
  }
};
