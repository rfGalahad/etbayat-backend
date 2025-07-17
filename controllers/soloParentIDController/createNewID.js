import pool from '../../config/database.js';
import * as soloParentIDModel from '../../models/soloParentIDModel.js';



export const createNewID = async (req, res) => {

  const connection = await pool.getConnection();
  
  try {
    const soloParentID = await soloParentIDModel.generateSoloParentId(connection);
    
    res.status(200).json({ 
      success: true, 
      soloParentID: soloParentID 
    });
    
  } catch (error) {
    console.error('Error generating Solo Parent ID:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating Solo Parent ID', 
      error: error.message 
    });
  } finally {
    connection.release();
  }
};

