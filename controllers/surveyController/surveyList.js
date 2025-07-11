import pool from '../../config/database.js';

export const listSurvey = async (req, res) => {

  const { username, position } = req.params;

  console.log('Position', position);

  try {
    let query = `
      SELECT 
        sr.surveyID,
        sr.respondent,
        sr.interviewer,
        sr.surveyDate,
        sr.barangay
      FROM 
        Surveys sr
    `;

    const params = [];

    if (position === 'Barangay Official') {
      query += ` WHERE sr.interviewer = ?`;
      params.push(username);
    }

    query += ` ORDER BY sr.surveyDate DESC`;

    const [rows] = await pool.query(query, params);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching survey data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching survey data', 
      error: error.message 
    });
  }
}