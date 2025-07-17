import pool from '../../config/database.js';
import * as updateSeniorCitizenIDModel from '../../models/updateSeniorCitizenIDModel.js';



export const updateApplication = async (req, res) => {

  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const applicationData = JSON.parse(req.body.applicationData);
    const scApplicationID = applicationData.personalInfo.scApplicationID;
    console.log('Application ID:', scApplicationID);


    let photoID = null;
    let signature = null;

    // Get photoID from files
    if (req.files && req.files.photoID && req.files.photoID.length > 0) {
      photoID = req.files.photoID[0].buffer;
    } else {
      const base64Data = applicationData.scMedia.photoID.split(';base64,').pop();
      photoID = Buffer.from(base64Data, 'base64');
    }

    // Get signature if it exists
    if (applicationData?.scMedia?.signature) {
      const base64Data = applicationData.scMedia.signature.split(';base64,').pop();
      signature = Buffer.from(base64Data, 'base64');
    }
    
    await updateSeniorCitizenIDModel.updateSeniorCitizenApplication(
      scApplicationID, 
      photoID,
      signature,
      connection
    );
    await updateSeniorCitizenIDModel.updatePersonalInfo(applicationData.personalInfo, connection);
    await updateSeniorCitizenIDModel.updateFamilyComposition(scApplicationID, applicationData.familyComposition, connection);
    await updateSeniorCitizenIDModel.updateOscaInfo(scApplicationID, applicationData.personalInfo, connection);

    
    await connection.commit();
    res.status(200).json({ 
      success: true, 
      message: 'Application submitted successfully', 
      scApplicationID 
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error submitting application:', {
      message: error.message,
      stack: error.stack,
      /*requestBody: JSON.stringify(req.body, null, 2)*/
    });

    res.status(500).json({ 
      success: false, 
      message: 'Error submitting application', 
      error: error.message,
      details: error.stack
    });

  } finally {
    connection.release();
  }
};
