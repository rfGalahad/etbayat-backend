import pool from '../../config/database.js';



export const viewSurvey = async (req, res) => {
  const connection = await pool.getConnection();
  const surveyID = req.params.surveyID || req.query.surveyID;

  try {

    console.log('Retrieving Surveys');
    const [surveyResponses] = await connection.query(`
      SELECT 
        s.surveyID,
        s.respondent,
        s.interviewer,
        s.surveyDate,
        s.barangay,
        s.municipality,
        h.householdID,
        h.familyClass,
        h.monthlyIncome,
        h.irregularIncome,
        h.familyIncome
      FROM Surveys s
      LEFT JOIN Households h ON s.surveyID = h.surveyID
      WHERE s.surveyID = ?
    `, [surveyID]);

    console.log('Retrieving Population');
    const [familyProfile] = await connection.query(`
      SELECT 
        p.populationID,
        p.surveyID,
        p.healthStatus,
        p.remarks,
        pi.isOSY,
        pi.inSchool,
        pi.outOfTown,
        pi.isOFW,
        pi.isPWD,
        pi.isSoloParent,

        pi.personalInfoID,
        pi.firstName,
        pi.middleName,
        pi.lastName,
        pi.suffix,
        pi.birthdate,
        pi.age,
        pi.sex,
        pi.birthplace,
        pi.religion,
        pi.civilStatus,
        pi.relationToFamilyHead,

        prof.professionalInfoID,
        prof.educationalAttainment,
        prof.skills,
        prof.occupation,
        prof.company,
        prof.employmentStatus,
        prof.employmentCategory,
        prof.employmentType,
        prof.monthlyIncome,
        prof.annualIncome,

        ci.contactInfoID,
        ci.street,
        ci.barangay,
        ci.municipality,
        ci.province,
        ci.region,
        ci.mobileNumber,
        ci.landlineNumber,
        ci.emailAddress,

        gi.sssNumber,
        gi.gsisNumber,
        gi.pagibigNumber,
        gi.psnNumber,
        gi.philhealthNumber,

        ga.governmentAffiliationID,
        ga.isAffiliated,
        ga.asOfficer,
        ga.asMember,
        ga.organizationAffiliated,

        ni.nonIvatanID,
        ni.isIpula,
        ni.settlementDetails,
        ni.ethnicity,
        ni.placeOfOrigin,
        ni.isTransient,
        ni.houseOwner,
        ni.isRegistered,
        ni.dateRegistered

      FROM Population p
      LEFT JOIN PersonalInformation pi ON p.populationID = pi.populationID
      LEFT JOIN ProfessionalInformation prof ON p.populationID = prof.populationID
      LEFT JOIN ContactInformation ci ON p.populationID = ci.populationID
      LEFT JOIN GovernmentIDs gi ON p.populationID = gi.populationID
      LEFT JOIN GovernmentAffiliation ga ON p.populationID = ga.populationID
      LEFT JOIN NonIvatan ni ON p.populationID = ni.populationID

      WHERE p.surveyID = ?
    `, [surveyID]);

    console.log('Retrieving: Food Expenses');
    const [foodExpenses] = await connection.query(`
      SELECT * FROM FoodExpenses WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving: Education Expenses');
    const [educationExpenses] = await connection.query(`
      SELECT * FROM EducationExpenses WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving: Family Expenses');
    const [familyExpenses] = await connection.query(`
      SELECT * FROM FamilyExpenses WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving: Monthly Expenses');
    const [monthlyExpenses] = await connection.query(`
      SELECT * FROM MonthlyExpenses WHERE surveyID = ?
    `, [surveyID]);



    console.log('Retrieving House Info');
    const [houseInformation] = await connection.query(`
      SELECT * FROM HouseInformation WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving: House Images');
    const [rows] = await connection.query(`
      SELECT * FROM HouseImage WHERE surveyID = ?
    `, [surveyID]);

    const houseImages = rows.map(row => {
      let processedRow = {...row};

      if (row.houseImage) {
        processedRow.houseImage = `data:image/jpeg;base64,${Buffer.from(row.houseImage).toString('base64')}`;
      }
      
      return processedRow;
    });

    console.log('Retrieving Water Info');
    const [waterInformation] = await connection.query(`
      SELECT * FROM WaterInformation WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving Livestock');
    const [livestock] = await connection.query(`
      SELECT * FROM Livestock WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving Farm Lots');
    const [farmlots] = await connection.query(`
      SELECT * FROM Farmlots WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving Crops Planted');
    const [cropsPlanted] = await connection.query(`
      SELECT * FROM CropsPlanted WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving Fruit Bearing Tree');
    const [fruitBearingTree] = await connection.query(`
      SELECT * FROM FruitBearingTree WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving Family Resources');
    const [familyResources] = await connection.query(`
      SELECT * FROM FamilyResources WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving Appliances');
    const [appliancesOwn] = await connection.query(`
      SELECT * FROM AppliancesOwn WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving Amenities');
    const [amenities] = await connection.query(`
      SELECT * FROM Amenities WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving Issues');
    const [communityIssues] = await connection.query(`
      SELECT * FROM CommunityIssues WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving Service Availed');
    const [serviceAvailed] = await connection.query(`
      SELECT * FROM ServiceAvailed WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving Respondent Proof');
    const [row] = await connection.query(`
      SELECT photo, signature FROM Surveys
      WHERE surveyID = ?
    `, [surveyID]);

    const respondentMedia = row.map(row => {
      let processedRow = {...row};

      if (row.photo) {
        processedRow.photo = `data:image/jpeg;base64,${Buffer.from(row.photo).toString('base64')}`;
      }

      if (row.signature) {
        processedRow.signature = `data:image/jpeg;base64,${Buffer.from(row.signature).toString('base64')}`;
      }
      
      return processedRow;
    });
    console.log('[SUCCESS] Photo ID and Signature');



    res.status(200).json({
      surveyResponses,
      familyProfile,
      foodExpenses,
      educationExpenses,
      familyExpenses,
      monthlyExpenses,
      houseInformation,
      houseImages,
      waterInformation,
      farmlots,
      communityIssues, 
      livestock,
      cropsPlanted,
      fruitBearingTree,
      familyResources,
      appliancesOwn,
      amenities,
      serviceAvailed,
      respondentMedia
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