import pool from '../../config/database.js';



export const getApplicationDetails = async (req, res) => {

  const connection = await pool.getConnection();
  const scApplicationID = req.params.scApplicationID || req.query.scApplicationID;

  console.log('SC APPLICATION ID:', scApplicationID);

  try {

    const [applicantRows] = await connection.query(`
      SELECT applicantID FROM SeniorCitizenApplication WHERE scApplicationID = ?
    `, [scApplicationID]);
    
    const applicantID = applicantRows[0]?.applicantID;
    
    if (!applicantID) {
      console.log('[ERROR] No applicantID found for:', scApplicationID);
      return res.status(404).json({ message: 'Applicant not found' });
    }
    
    console.log('Retrieving Personal Information');
    const [personalInfo] = await connection.query(`
      SELECT 
        sc.*,
        os.*,
        pi.*,
        proi.*,
        ci.*
      FROM SeniorCitizenApplication sc
      LEFT JOIN OscaInformation os 
          ON sc.scApplicationID = os.scApplicationID
      LEFT JOIN PersonalInformation pi 
          ON sc.applicantID = pi.applicantID
      LEFT JOIN ProfessionalInformation proi 
          ON sc.applicantID = proi.applicantID
      LEFT JOIN ContactInformation ci 
          ON sc.applicantID = ci.applicantID
      WHERE sc.applicantID = ?
    `, [applicantID]);
    console.log('[SUCCESS] Personal Information');

    console.log('Retrieving Family Composition');
    const [familyComposition] = await connection.query(`
      SELECT * FROM FamilyComposition
      WHERE scApplicationID = ?
    `, [scApplicationID]);
    console.log('[SUCCESS] Family Composition');


    console.log('Retrieving Photo ID and Signature');
    const [rows] = await connection.query(`
      SELECT photoID, signature FROM SeniorCitizenApplication
      WHERE scApplicationID = ?
    `, [scApplicationID]);

    const scMedia = rows.map(row => {
      let processedRow = {...row};

      if (row.photoID) {
        processedRow.photoID = `data:image/jpeg;base64,${Buffer.from(row.photoID).toString('base64')}`;
      }

      if (row.signature) {
        processedRow.signature = `data:image/jpeg;base64,${Buffer.from(row.signature).toString('base64')}`;
      }
      
      return processedRow;
    });
    console.log('[SUCCESS] Photo ID and Signature');

    res.status(200).json({ 
      personalInfo,
      familyComposition,
      scMedia
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
};;