import pool from '../../config/database.js';
import * as surveyModel from '../../models/surveyModel.js';
import * as updateSurveyModel from '../../models/updateSurveyModel.js';


export const updateSurvey = async (req, res) => {
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const surveyData = JSON.parse(req.body.surveyData);
    const surveyID = surveyData.surveyData.surveyID;
    const populationID = `P${surveyID}`;
    const hasHouseImageID = surveyData.houseInfo?.houseImages?.some(img => img.houseImageID != null);

    let photo = null;
    let signature = null;

    // Get photo from files
    if (req.files && req.files.photo && req.files.photo.length > 0) {
      photo = req.files.photo[0].buffer;
    } else {
      const base64Data = surveyData.respondentMedia.photo.split(';base64,').pop();
      photo = Buffer.from(base64Data, 'base64');
    }

    // Get signature if it exists
    if (surveyData?.respondentMedia?.signature) {
      const base64Data = surveyData.respondentMedia.signature.split(';base64,').pop();
      signature = Buffer.from(base64Data, 'base64');
    }

    await updateSurveyModel.updateSurvey(surveyData.surveyData, photo, signature, connection);
    await updateSurveyModel.updateHousehold(surveyData.surveyData, connection);
    await updateSurveyModel.updateFamilyProfile(populationID, surveyData.familyMembers, surveyData.houseLocation, connection);    
    await updateSurveyModel.updateFoodExpenses(surveyID, surveyData.foodExpenses, connection);
    await updateSurveyModel.updateEducationExpenses(surveyID, surveyData.educationExpenses, connection);
    await updateSurveyModel.updateFamilyExpenses(surveyID, surveyData.familyExpenses, connection);
    await updateSurveyModel.updateMonthlyExpenses(surveyID, surveyData.monthlyExpenses, connection);
    await updateSurveyModel.updateHouseInfo(surveyData.houseInfo, surveyData.houseLocation, connection);

    if (req.files && req.files.houseImages && req.files.houseImages.length > 0) {

      const newImageTitles = surveyData.houseInfo.houseImages
        ?.filter(img => !img.houseImageID)
        ?.map(img => img.title) || [];

      for (let i = 0; i < req.files.houseImages.length; i++) {
        const imageFile = req.files.houseImages[i];
        const imageTitle = i < newImageTitles.length ? newImageTitles[i] : `House Image ${i + 1}`;

        await surveyModel.addHouseImage(
          surveyID,
          imageTitle,
          imageFile.buffer,
          connection
        );
      }
    } else {
      console.log("No images to process");
    }

    
    if(hasHouseImageID) {
      await updateSurveyModel.updateHouseImage(surveyData.houseInfo, surveyData.houseLocation, connection);
    }

    await updateSurveyModel.updateWaterInfo(surveyID, surveyData.waterInfo, connection);
    await updateSurveyModel.updateFarmlots(surveyID, surveyData.farmlots, connection);
    await updateSurveyModel.updateCommunityIssues(surveyID, surveyData.communityIssues, connection);
    await updateSurveyModel.updateServiceAvailed(surveyID, surveyData.serviceAvailed, connection);
    await updateSurveyModel.updateLivestock(surveyID, surveyData.livestock, connection);
    await updateSurveyModel.updateCropsPlanted(surveyID, surveyData.cropsPlanted, connection);
    await updateSurveyModel.updateFruitBearingTree(surveyID, surveyData.fruitBearingTree, connection);
    await updateSurveyModel.updateFamilyResources(surveyID, surveyData.familyResources, connection);
    await updateSurveyModel.updateAppliancesOwn(surveyID, surveyData.appliancesOwn, connection);
    await updateSurveyModel.updateAmenities(surveyID, surveyData.amenitiesOwn, connection);


    await connection.commit();
    res.status(200).json({ 
      success: true, 
      message: 'Survey updated successfully',
      surveyID 
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating survey:', {
      message: error.message,
      stack: error.stack,
      //requestBody: JSON.stringify(req.body, null, 2)
    });

    res.status(500).json({ 
      success: false, 
      message: 'Error updating survey', 
      error: error.message,
      details: error.stack
    });

  } finally {
    connection.release();
  }
};