import pool from '../../config/database.js';



export const getAllPWDApplications = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
          pa.pwdApplicationID,
          pa.applicantID,
          pa.dateApplied,
          pi.populationID,
          pi.firstName,
          pi.middleName,
          pi.lastName,
          pi.suffix
        FROM pwdApplication pa
        LEFT JOIN PersonalInformation pi ON pa.applicantID = pi.applicantID
        ORDER BY dateApplied ASC;`
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching Application data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching Application data', 
      error: error.message 
    });
  }
}