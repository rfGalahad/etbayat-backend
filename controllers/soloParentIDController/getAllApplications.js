import pool from '../../config/database.js';



export const getAllApplications = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
          sp.spApplicationID,
          sp.applicantID,
          sp.dateApplied,
          pi.populationID,
          pi.firstName,
          pi.middleName,
          pi.lastName,
          pi.suffix
        FROM SoloParentApplication sp
        LEFT JOIN PersonalInformation pi ON sp.applicantID = pi.applicantID
        ORDER BY dateApplied ASC;`);

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