import pool from '../../config/database.js';





export const getPWDApplicationDetails = async (req, res) => {

  const connection = await pool.getConnection();
  const pwdApplicationID = req.params.pwdApplicationID || req.query.pwdApplicationID;

  try {

    const [applicantRows] = await connection.query(`
      SELECT applicantID FROM pwdApplication WHERE pwdApplicationID = ?
    `, [pwdApplicationID]);
    
    const applicantID = applicantRows[0]?.applicantID;
    
    if (!applicantID) {
      console.log('[ERROR] No applicantID found for:', pwdApplicationID);
      return res.status(404).json({ message: 'Applicant not found' });
    }
    
    const [personalInfo] = await connection.query(`
      SELECT 
        pa.*,
        di.*,
        gov.*,
        pi.*,
        proi.*,
        ci.*,
        ga.*
      FROM pwdApplication pa
      LEFT JOIN DisabilityInformation di 
          ON pa.pwdApplicationID = di.pwdApplicationID
      LEFT JOIN GovernmentIDs gov 
          ON pa.applicantID = gov.applicantID
      LEFT JOIN PersonalInformation pi 
          ON pa.applicantID = pi.applicantID
      LEFT JOIN ProfessionalInformation proi 
          ON pa.applicantID = proi.applicantID
      LEFT JOIN ContactInformation ci 
          ON pa.applicantID = ci.applicantID
      LEFT JOIN GovernmentAffiliation ga 
          ON pa.applicantID = ga.applicantID
      WHERE pa.applicantID = ?
    `, [applicantID]);

    const [familyBackground] = await connection.query(`
      SELECT 
        pa.*,

        -- Father
        father.firstName AS fatherFirstName,
        father.middleName AS fatherMiddleName,
        father.lastName AS fatherLastName,
        father.suffix AS fatherSuffix,

        -- Mother
        mother.firstName AS motherFirstName,
        mother.middleName AS motherMiddleName,
        mother.lastName AS motherLastName,
        mother.suffix AS motherSuffix,

        -- Guardian
        guardian.firstName AS guardianFirstName,
        guardian.middleName AS guardianMiddleName,
        guardian.lastName AS guardianLastName,
        guardian.suffix AS guardianSuffix

      FROM pwdApplication pa
      LEFT JOIN Officers father 
        ON pa.fatherID = father.officersID
      LEFT JOIN Officers mother 
        ON pa.motherID = mother.officersID
      LEFT JOIN Officers guardian 
        ON pa.guardianID = guardian.officersID

      WHERE pa.pwdApplicationID = ?;
    `, [pwdApplicationID]);

    const [otherInfo] = await connection.query(`
      SELECT 
        pa.*,

        -- Physician
        physician.firstName AS cpFirstName,
        physician.middleName AS cpMiddleName,
        physician.lastName AS cpLastName,
        physician.suffix AS cpSuffix,
        physician.licenseNumber AS licenseNumber,

        -- Processor
        processor.firstName AS poFirstName,
        processor.middleName AS poMiddleName,
        processor.lastName AS poLastName,
        processor.suffix AS poSuffix,

        -- Approver
        approver.firstName AS aoFirstName,
        approver.middleName AS aoMiddleName,
        approver.lastName AS aoLastName,
        approver.suffix AS aoSuffix,

        -- Encoder
        encoder.firstName AS eFirstName,
        encoder.middleName AS eMiddleName,
        encoder.lastName AS eLastName,
        encoder.suffix AS eSuffix,

        -- Accomplished By
        ab.firstName AS abFirstName,
        ab.middleName AS abMiddleName,
        ab.lastName AS abLastName,
        ab.suffix AS abSuffix,
        ab.role AS abRole

      FROM pwdApplication pa
      LEFT JOIN Officers physician 
        ON pa.physicianID = physician.officersID
      LEFT JOIN Officers processor 
        ON pa.processorID = processor.officersID
      LEFT JOIN Officers approver 
        ON pa.approverID = approver.officersID
      LEFT JOIN Officers encoder 
        ON pa.encoderID = encoder.officersID
      LEFT JOIN Officers ab
        ON pa.accomplishedByID = ab.officersID

      WHERE pa.pwdApplicationID = ?;

    `, [pwdApplicationID]);

    const [rows] = await connection.query(`
      SELECT photoID, signature FROM pwdApplication
      WHERE pwdApplicationID = ?
    `, [pwdApplicationID]);

    const pwdMedia = rows.map(row => {
      let processedRow = {...row};

      if (row.photoID) {
        processedRow.photoID = `data:image/jpeg;base64,${Buffer.from(row.photoID).toString('base64')}`;
      }

      if (row.signature) {
        processedRow.signature = `data:image/jpeg;base64,${Buffer.from(row.signature).toString('base64')}`;
      }
      
      return processedRow;
    });

    res.status(200).json({ 
      personalInfo,
      familyBackground,
      otherInfo,
      pwdMedia
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