import pool from '../../config/database.js';



export const getBarangayStats = async (req, res) => {

  const year = parseInt(req.params.year);

  try {
    const [surveys] = await pool.query(
      `SELECT barangay, COUNT(*) AS count 
       FROM Surveys 
       WHERE YEAR(surveyDate) = ? 
       GROUP BY barangay`,
      [year]
    );

    const [population] = await pool.query(
      `SELECT s.barangay, COUNT(*) AS count 
       FROM Population p
       LEFT JOIN Surveys s ON s.surveyID = p.surveyID
       WHERE YEAR(s.surveyDate) = ?
       GROUP BY s.barangay`,
      [year]
    );

    res.json({ surveys, population });
  } catch (error) {
    console.error('Error fetching barangay stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
