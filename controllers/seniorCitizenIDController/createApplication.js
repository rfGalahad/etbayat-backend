import pool from '../../config/database.js';
import * as seniorCitizenIDModel from '../../models/seniorCitizenIDModel.js';



export const createApplication = async (req, res) => {
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { scApplicationID } = await seniorCitizenIDModel.generateSeniorCitizenId(connection);

    const applicationData = JSON.parse(req.body.applicationData);
    const populationID = applicationData.personalInfo.populationID;

    console.log('Application ID:', scApplicationID);
    console.log('Population ID:', populationID);

    const photoID = req.files.photoID[0].buffer;
    const base64Data = applicationData.scMedia.signature.split(';base64,').pop();
    const signature = Buffer.from(base64Data, 'base64');
    
    console.log("Creating Senior Citizen Application...");
    const { applicantID } = await seniorCitizenIDModel.createSeniorCitizenApplicant(
      scApplicationID, 
      photoID,
      signature,
      connection
    );

    if (populationID) {
      console.log("Updating Personal Info...");
      await seniorCitizenIDModel.updatePopulation(applicantID, populationID, applicationData.personalInfo, connection);
    } else {
      console.log("Inserting New Personal Info...");
      await seniorCitizenIDModel.addPersonalInfo(applicantID, scApplicationID, applicationData.personalInfo, connection);
    }

    console.log("Inserting Family Composition...");
    await seniorCitizenIDModel.addFamilyComposition(scApplicationID, applicationData.familyComposition, connection);

    console.log("Inserting OSCA Info...");
    await seniorCitizenIDModel.addOscaInfo(scApplicationID, applicationData.personalInfo, connection);

    
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