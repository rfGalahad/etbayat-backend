import pool from '../../config/database.js';



export const deleteAccount = async (req, res) => {
  
  const connection = await pool.getConnection();
  const userID = req.params.userID;

  try {

    await connection.query('DELETE FROM users WHERE userID = ?', [userID]);
  
    res.status(200).json({ 
      success: true, 
      message: 'Account deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting Account:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting Account', 
      error: error.message 
    });
  } finally {
    connection.release();
  }
};