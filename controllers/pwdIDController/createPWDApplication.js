import pool from '../../config/database.js';
import * as pwdIDModel from '../../models/pwdIDModel.js';



export const createPWDApplication = async (req, res) => {
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { pwdApplicationID } = await pwdIDModel.generatePwdId(connection, 'ABC');
    
    const applicationData = JSON.parse(req.body.applicationData);
    const populationID = applicationData.personalInfo.populationID;

    console.log('Application ID:', pwdApplicationID);
    console.log('Population ID:', populationID);

    const photoID = req.files.photoID[0].buffer;
    const base64Data = applicationData.pwdMedia.signature.split(';base64,').pop();
    const signature = Buffer.from(base64Data, 'base64');

    console.log("Creating PWD Application...");
    const { applicantID } = await pwdIDModel.createPWDApplicant(
      pwdApplicationID,
      applicationData,
      photoID,
      signature,
      connection
    );

    if(populationID) {
      console.log("Updating Personal Info...");
      await pwdIDModel.updatePopulation(applicantID, populationID, applicationData.personalInfo, connection);
    } else {
      console.log("Inserting New Personal Info...");
      await pwdIDModel.addPersonalInfo(applicantID, pwdApplicationID, applicationData.personalInfo, connection);
    }

    console.log("Inserting Disability Info...");
    await pwdIDModel.addDisabilityInfo(pwdApplicationID, applicationData.personalInfo, connection);


    await connection.commit();
    res.status(200).json({ 
      success: true, 
      message: 'Application submitted successfully', 
      pwdApplicationID 
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