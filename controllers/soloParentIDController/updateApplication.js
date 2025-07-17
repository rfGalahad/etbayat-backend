import pool from '../../config/database.js';
import * as updateSoloParentIDModel from '../../models/updateSoloParentIDModel.js';



export const updateApplication = async (req, res) => {

  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const applicationData = JSON.parse(req.body.applicationData);
    const spApplicationID = applicationData.personalInfo.spApplicationID;
    console.log('Application ID', spApplicationID);

    let photoID = null;
    let signature = null;

    // Get photoID from files
    if (req.files && req.files.photoID && req.files.photoID.length > 0) {
      photoID = req.files.photoID[0].buffer;
    }

    // Get signature if it exists
    if (applicationData?.spMedia?.signature) {
      const base64Data = applicationData.spMedia.signature.split(';base64,').pop();
      signature = Buffer.from(base64Data, 'base64');
    }

    console.log("Updating Solo Parent Application...");
    await updateSoloParentIDModel.updateSoloParentApplicant(
      spApplicationID, 
      photoID,
      signature,
      connection
    );

    console.log("Updating Personal Info...");
    await updateSoloParentIDModel.updatePersonalInfo(applicationData.personalInfo, connection);

    console.log("Updating Other Info...");
    await updateSoloParentIDModel.updateOtherInfo(spApplicationID, applicationData.personalInfo, connection);

    console.log("Updating Household Composition");
    await updateSoloParentIDModel.updateHouseholdComposition(spApplicationID, applicationData.householdComposition, connection);

    console.log("Updating Problem/Needs");
    await updateSoloParentIDModel.updateProblemNeeds(spApplicationID, applicationData.problemNeeds, connection);

    console.log("Updating Emergency Contact");
    await updateSoloParentIDModel.updateEmergencyContact(spApplicationID, applicationData.emergencyContact, connection);

    console.log('SP APPLICATION:', spApplicationID);
    await connection.commit();
    res.status(200).json({ 
      success: true, 
      message: 'Application updated successfully', 
      spApplicationID 
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating application:', {
      message: error.message,
      stack: error.stack,
      /*requestBody: JSON.stringify(req.body, null, 2)*/
    });

    res.status(500).json({ 
      success: false, 
      message: 'Error updating application', 
      error: error.message,
      details: error.stack
    });

  } finally {
    connection.release();
  }
};
