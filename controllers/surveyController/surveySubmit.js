import pool from '../../config/database.js';
import * as surveyModel from '../../models/surveyModel.js';


export const submitSurvey = async (req, res) => {

  const connection = await pool.getConnection();
  
  try {

    await connection.beginTransaction();

    const surveyData = JSON.parse(req.body.surveyData);   
    const surveyID = await surveyModel.generateSurveyId(connection);
    const populationID = `P${surveyID}`;
    const photo = req.files.photo[0].buffer;
    const base64Data = surveyData.respondentMedia.signature.split(';base64,').pop();
    const signature = Buffer.from(base64Data, 'base64');

    console.log('PHOTO:', photo);
    console.log('SIGNATURE:', signature);
    

    console.log(`SUBMITTING SURVEY APPLICATION #${surveyID}`);

    console.log("Inserting Survey Details");
    await surveyModel.createSurvey(surveyID, surveyData.surveyData, photo, signature, connection);

    console.log("Inserting Household");
    await surveyModel.addHousehold(surveyID, surveyData.surveyData, connection);
    
    // POPULATION
    console.log("Inserting Population");
    await surveyModel.addPopulation(populationID, surveyID, surveyData.familyMembers, connection);

    console.log("Inserting Personal Info");
    await surveyModel.addPersonalInfo(populationID, surveyData.familyMembers, connection);

    console.log("Inserting Professional Info");
    await surveyModel.addProfessionalInfo(populationID, surveyData.familyMembers, connection);

    console.log("Inserting Contact Info");
    await surveyModel.addContactInfo(populationID, surveyData.familyMembers, surveyData.houseLocation, connection);

    console.log("Inserting Government IDs");
    await surveyModel.addGovernmentID(populationID, surveyData.familyMembers, connection);

    console.log("Inserting Affiliation");
    await surveyModel.addGovernmentAffiliation(populationID, surveyData.familyMembers, connection);

    console.log("Inserting Ipula/Non-Ivatan");
    await surveyModel.addNonIvatan(populationID, surveyData.familyMembers, connection);

    // EXPENSES
    console.log("Inserting Food Expenses");
    await surveyModel.addFoodExpenses(surveyID, surveyData.foodExpenses, connection);

    console.log("Inserting Education Expenses");
    await surveyModel.addEducationExpenses(surveyID, surveyData.educationExpenses, connection);

    console.log("Inserting Family Expenses");
    await surveyModel.addFamilyExpenses(surveyID, surveyData.familyExpenses, connection);

    console.log("Inserting Monthly Expenses");
    await surveyModel.addMonthlyExpenses(surveyID, surveyData.monthlyExpenses, connection);
    
    // HOUSE INFO
    console.log("Inserting House Info");
    await surveyModel.addHouseInfo(surveyID, surveyData.houseInfo, surveyData.houseLocation, connection);

    console.log("Inserting House Images");
    if (req.files && req.files.houseImages && req.files.houseImages.length > 0) {
      console.log(`Processing ${req.files.houseImages.length} uploaded images`);

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
    
    console.log("Inserting Water Info");
    await surveyModel.addWaterInfo(surveyID, surveyData.waterInfo, connection);

    // FARM AND LIVESTOCK
    console.log("Inserting Livestock");
    await surveyModel.addLivestock(surveyID, surveyData.livestock, connection);

    console.log("Inserting FarmLots");
    await surveyModel.addFarmlots(surveyID, surveyData.farmlots, connection);

    console.log("Inserting Crops Planted");
    await surveyModel.addCropsPlanted(surveyID, surveyData.cropsPlanted, connection);

    console.log("Inserting Fruit Bearing Tree");
    await surveyModel.addFruitBearingTree(surveyID, surveyData.fruitBearingTree, connection);

    // FAMILY RESOURCES AND AMENITIES
    console.log("Inserting Family Resources");
    await surveyModel.addFamilyResources(surveyID, surveyData.familyResources, connection);

    console.log("Inserting Appliances Own");
    await surveyModel.addAppliancesOwn(surveyID, surveyData.appliancesOwn, connection);

    console.log("Inserting Amenities Own");
    await surveyModel.addAmenities(surveyID, surveyData.amenitiesOwn, connection);

    console.log("Inserting Community Issues");
    await surveyModel.addCommunityIssues(surveyID, surveyData.communityIssues, connection);

    console.log("Inserting Service Availed");
    await surveyModel.addServiceAvailed(surveyID, surveyData.serviceAvailed, connection);


    await connection.commit();
    res.status(200).json({ 
      success: true, 
      message: 'Survey submitted successfully',
      surveyID 
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error submitting survey:', {
      message: error.message,
      stack: error.stack,
      //requestBody: JSON.stringify(req.body, null, 2)
    });

    res.status(500).json({ 
      success: false, 
      message: 'Error submitting survey', 
      error: error.message,
      details: error.stack
    });

  } finally {
    connection.release();
  }
};