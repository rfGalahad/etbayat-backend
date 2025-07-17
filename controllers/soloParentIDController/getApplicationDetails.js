import pool from '../../config/database.js';



export const getApplicationDetails = async (req, res) => {

  const connection = await pool.getConnection();
  const spApplicationID = req.params.spApplicationID || req.query.spApplicationID;

  console.log('SP APPLICATION ID:', spApplicationID);

  try {

    const [applicantRows] = await connection.query(`
      SELECT applicantID FROM SoloParentApplication WHERE spApplicationID = ?
    `, [spApplicationID]);
    
    const applicantID = applicantRows[0]?.applicantID;
    
    if (!applicantID) {
      console.log('[ERROR] No applicantID found for:', spApplicationID);
      return res.status(404).json({ message: 'Applicant not found' });
    }
    
    const [personalInfo] = await connection.query(`
      SELECT 
        sp.*,
        gov.*,
        pi.*,
        proi.*,
        ci.*,
        oi.*
      FROM SoloParentApplication sp
      LEFT JOIN GovernmentIDs gov 
        ON sp.applicantID = gov.applicantID
      LEFT JOIN PersonalInformation pi 
        ON sp.applicantID = pi.applicantID
      LEFT JOIN ProfessionalInformation proi 
        ON sp.applicantID = proi.applicantID
      LEFT JOIN ContactInformation ci 
        ON sp.applicantID = ci.applicantID
      LEFT JOIN OtherInformation oi
        ON sp.spApplicationID = oi.spApplicationID
      WHERE sp.applicantID = ?
    `, [applicantID]);

    const [householdComposition] = await connection.query(`
      SELECT * FROM HouseholdComposition
      WHERE spApplicationID = ?
    `, [spApplicationID]);

    const [problemNeeds] = await connection.query(`
      SELECT * FROM ProblemNeeds
      WHERE spApplicationID = ?
    `, [spApplicationID]);

    const [emergencyContact] = await connection.query(`
      SELECT * FROM EmergencyContact
      WHERE spApplicationID = ?
    `, [spApplicationID]);

    const [rows] = await connection.query(`
      SELECT photoID, signature FROM SoloParentApplication
      WHERE spApplicationID = ?
    `, [spApplicationID]);

    const spMedia = rows.map(row => {
      let processedRow = {...row};

      if (row.photoID) processedRow.photoID = `data:image/jpeg;base64,${Buffer.from(row.photoID).toString('base64')}`;
      if (row.signature) processedRow.signature = `data:image/jpeg;base64,${Buffer.from(row.signature).toString('base64')}`;

      return processedRow;
    });

    res.status(200).json({ 
      personalInfo,
      householdComposition,
      problemNeeds,
      emergencyContact,
      spMedia
    });

  } catch (error) {
    console.error('Error fetching survey data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching survey data', 
      error: error.message 
    });
  } finally {
    connection.release();
  }
};