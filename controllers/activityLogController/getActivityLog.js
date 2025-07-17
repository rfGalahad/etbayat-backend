import pool from '../../config/database.js';



export const getActivityLog = async (req, res) => {
  try {

    const [rows] = await pool.query(`SELECT * FROM ActivityLog ORDER BY timestamp DESC`);

    res.status(200).json(rows);

  } catch (error) {
    console.error('Error getting activity log:', error);
    res.status(500).json({ message: 'Server error' });
  }
};