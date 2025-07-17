import pool from '../../config/database.js';
import * as soloParentIDModel from '../../models/soloParentIDModel.js';



export const createApplication = async (req, res) => {

  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { spApplicationID } = await soloParentIDModel.generateSoloParentId(connection);
    
    const applicationData = JSON.parse(req.body.applicationData);
    const populationID = applicationData.personalInfo.populationID;

    console.log('Application ID:', spApplicationID);
    console.log('Population ID:', populationID);

    const photoID = req.files.photoID[0].buffer;
    const base64Data = applicationData.spMedia.signature.split(';base64,').pop();
    const signature = Buffer.from(base64Data, 'base64');

    console.log("Creating Solo Parent Application...");
    const { applicantID } = await soloParentIDModel.createSoloParentApplicant(
      spApplicationID, 
      photoID,
      signature,
      connection
    );

    if(populationID) {
      console.log("Updating Population...");
      await soloParentIDModel.updatePopulation(applicantID, populationID, spApplicationID, applicationData.personalInfo, connection);
    } else {
      console.log("Inserting Personal Info...");
      await soloParentIDModel.addPersonalInfo(applicantID, spApplicationID, applicationData.personalInfo, connection);
    }
    
    console.log("Inserting Other Info...");
    await soloParentIDModel.addOtherInfo(spApplicationID, applicationData.personalInfo, connection);

    console.log("Inserting Household Composition...");
    await soloParentIDModel.addHouseholdComposition(spApplicationID, applicationData.householdComposition, connection);

    console.log("Inserting Problem/Needs...");
    await soloParentIDModel.addProblemNeeds(spApplicationID, applicationData.problemNeeds, connection);

    console.log("Inserting Emergency Contact...");
    await soloParentIDModel.addEmergencyContact(spApplicationID, applicationData.emergencyContact, connection);

    await connection.commit();
    res.status(200).json({ 
      success: true, 
      message: 'Application submitted successfully', 
      spApplicationID 
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