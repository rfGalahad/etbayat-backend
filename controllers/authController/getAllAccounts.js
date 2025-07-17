import pool from '../../config/database.js';


export const getAllAccounts = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM users
      WHERE position != 'Admin'
      ORDER BY userID ASC;
    `);
    
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching accounts data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching accounts data', 
      error: error.message 
    });
  }
}