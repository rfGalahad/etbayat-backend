export const updateSurvey = async (surveyData, photo, signature, connection) => {
  
  console.log('Photo:', photo ? 'Provided' : 'Not Provided');
  
  const [result] = await connection.query(
    `UPDATE Surveys 
     SET respondent = ?, 
         interviewer = ?, 
         barangay = ?, 
         municipality = ?,
         photo = ?,
         signature = ?
     WHERE surveyID = ?`,
    [
      surveyData.respondent,
      surveyData.interviewer,
      surveyData.barangay,
      surveyData.municipality,
      photo || null,
      signature || null,
      surveyData.surveyID
    ]
  );

  console.log('[ UPDATED ] Survey Details')
  return result;
};

export const updateHousehold = async (surveyData, connection) => {

  const [result] = await connection.query(
    `UPDATE Households 
     SET familyClass = ?,
         monthlyIncome = ?,
         irregularIncome = ?,
         familyIncome = ?
      WHERE householdID = ? AND surveyID = ?`,
    [
      surveyData.familyClass,
      parseFloat(surveyData.monthlyIncome.replace(/,/g, '').trim()) || 0,
      parseFloat(surveyData.irregularIncome.replace(/,/g, '').trim()) || 0,
      parseFloat(surveyData.familyIncome.replace(/,/g, '').trim()) || 0,
      surveyData.householdID,
      surveyData.surveyID,
    ]
  );

  console.log('[ UPDATED ] Household')
  return result;
};


// POPULATION

export const updateFamilyProfile = async (populationID, familyMembers, houseLocation, connection) => {

  if (!familyMembers || familyMembers.length === 0) return null;

  function formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d)) return null;
    return d.toISOString().split('T')[0];
  }

  // Step 1: Get all existing populationIDs for the given surveyID
  const surveyID = familyMembers[0]?.surveyID;
  const [existingRows] = await connection.query(
    'SELECT populationID FROM Population WHERE surveyID = ?',
    [surveyID]
  );
  const existingIDs = existingRows.map(row => row.populationID);

  // Step 2: Get populationIDs from the incoming list
  const incomingIDs = familyMembers.map(member => member.populationID);

  // Step 3: Find IDs to delete
  const idsToDelete = existingIDs.filter(id => !incomingIDs.includes(id));

  // Step 4: Delete related records
  for (const id of idsToDelete) {
    await connection.query('DELETE FROM NonIvatan WHERE populationID = ?', [id]);
    await connection.query('DELETE FROM GovernmentAffiliation WHERE populationID = ?', [id]);
    await connection.query('DELETE FROM GovernmentIDs WHERE populationID = ?', [id]);
    await connection.query('DELETE FROM ContactInformation WHERE populationID = ?', [id]);
    await connection.query('DELETE FROM ProfessionalInformation WHERE populationID = ?', [id]);
    await connection.query('DELETE FROM PersonalInformation WHERE populationID = ?', [id]);
    await connection.query('DELETE FROM Population WHERE populationID = ?', [id]);
  }


  const updatePromises = familyMembers.map(async (member, index) => {

    console.log(`[ UPDATING ] Family Member ${index + 1} - Population ID: ${member.populationID || 'New'}`);

    const isNew = !member.populationID;

    if(isNew) {

      await connection.query(
        `INSERT INTO Population
        (populationID, surveyID, healthStatus, remarks) 
        VALUES (?, ?, ?, ?)`,
        [
          `${populationID}-${index + 1}`,
          surveyID,
          member.healthStatus ,
          member.remarks 
        ]
      );

      await connection.query(
        `INSERT INTO PersonalInformation
          ( populationID, 
            firstName, middleName, lastName, suffix,
            birthdate, age, sex, birthplace,
            religion, civilStatus, relationToFamilyHead,
            isOSY, inSchool, outOfTown, isOFW, isPWD, isSoloParent ) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `${populationID}-${index + 1}`,
          member.firstName,
          member.middleName,
          member.lastName,
          member.suffix,
          member.birthdate,
          member.age || member.formattedAge,
          member.sex,
          member.birthplace,
          member.religion,
          member.civilStatus,
          member.relationToFamilyHead,
          member.isOSY,
          member.inSchool,
          member.outOfTown,
          member.isOFW,
          member.isPWD,
          member.isSoloParent
        ]
      );

      await connection.query(
        `INSERT INTO ProfessionalInformation
          ( populationID, 
            educationalAttainment,
            skills,
            occupation,
            employmentType,
            monthlyIncome ) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          `${populationID}-${index + 1}`,
          member.educationalAttainment,
          member.skills,
          member.occupation,
          member.employmentType,
          parseFloat(member.monthlyIncome.replace(/,/g, '').trim()) || 0
        ]
      );

      await connection.query(
        `INSERT INTO ContactInformation
        (populationID, mobileNumber, street, barangay, municipality, province) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          `${populationID}-${index + 1}`,
          member.contactNumber,
          houseLocation.houseStreet,
          houseLocation.barangay,
          'Itbayat',
          'Batanes'
        ]
      );

      await connection.query(
        `INSERT INTO GovernmentIDs
        ( populationID, 
          philhealthNumber ) 
        VALUES (?, ?)`,
        [
          `${populationID}-${index + 1}`,
          member.philhealthNumber || null
        ]
      );

      await connection.query(
        `INSERT INTO GovernmentAffiliation
        (populationID, isAffiliated, asOfficer, asMember, organizationAffiliated) 
        VALUES (?, ?, ?, ?, ?)`,
        [
          `${populationID}-${index + 1}`,
          member.isAffiliated,
          (!member.asOfficer || member.asOfficer === 'N/A' || member.asOfficer.trim() === '')
            ? null
            : member.asOfficer.split('T')[0],
          (!member.asMember || member.asMember === 'N/A' || member.asMember.trim() === '')
            ? null
            : member.asMember.split('T')[0],
          member.organizationAffiliated
        ]
      );

      await connection.query(
        `INSERT INTO NonIvatan
          (populationID, isIpula, settlementDetails, ethnicity, placeOfOrigin,
          isTransient, houseOwner, isRegistered, dateRegistered) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `${populationID}-${index + 1}`,
          member.isIpula,
          member.settlementDetails,
          member.ethnicity,
          member.placeOfOrigin,
          member.isTransient ,
          member.houseOwner,
          member.transientRegistered,
          (!member.transientDateRegistered || member.transientDateRegistered === 'N/A' || member.transientDateRegistered.trim() === '')
            ? null
            : member.transientDateRegistered.split('T')[0]
        ]
      );
      
    } else {
      
      await connection.query(
        `UPDATE Population
        SET healthStatus = ?,
            remarks = ?
        WHERE populationID = ? AND surveyID = ?`,
        [
          member.healthStatus ,
          member.remarks ,
          member.populationID,
          member.surveyID
        ]
      );

      await connection.query(
        `UPDATE PersonalInformation
        SET firstName = ?,
            middleName = ?,
            lastName = ?,
            suffix = ?,
            birthdate = ?,
            age = ?,
            sex = ?,
            birthplace = ?, 
            religion = ?,
            civilStatus = ?,
            relationToFamilyHead = ?,
            isOSY = ?,
            inSchool = ?,
            outOfTown = ?,
            isOFW = ?,
            isPWD = ?, 
            isSoloParent = ?
        WHERE personalInfoID = ? AND populationID = ?`,
        [
          member.firstName ,
          member.middleName ,
          member.lastName ,
          member.suffix ,
          member.birthdate ? member.birthdate.split('T')[0] : null,
          member.age,
          member.sex,
          member.birthplace ,
          member.religion ,
          member.civilStatus,
          member.relationToFamilyHead,
          member.isOSY,
          member.inSchool,
          member.outOfTown,
          member.isOFW,
          member.isPWD,
          member.isSoloParent,
          member.personalInfoID,
          member.populationID
        ]
      );

      await connection.query(
        `UPDATE ProfessionalInformation
        SET educationalAttainment = ?,
            skills = ?,
            occupation = ?,
            employmentType = ?,
            monthlyIncome = ?
        WHERE professionalInfoID = ? AND populationID = ?`,
        [
          member.educationalAttainment,
          member.skills ,
          member.occupation ,
          member.employmentType ,
          parseFloat(member.monthlyIncome.replace(/,/g, '').trim())|| 0,
          member.professionalInfoID,
          member.populationID,
          //member.surveyID
        ]
      );

      await connection.query(
        `UPDATE ContactInformation
        SET mobileNumber = ?,
            street = ?,
            barangay = ?,
            municipality = 'Itbayat',
            province = 'Batanes'
        WHERE contactInfoID = ? AND populationID = ?`,
        [
          member.contactNumber,
          houseLocation.street,
          houseLocation.barangay,
          member.contactInfoID,
          member.populationID
        ]
      );

      await connection.query(
        `UPDATE GovernmentIDs
        SET philhealthNumber = ?
        WHERE govID = ? AND populationID = ?`,
        [
          member.philhealthNumber || null,
          member.govID,
          member.populationID
        ]
      );

      await connection.query(
        `UPDATE GovernmentAffiliation
        SET isAffiliated = ?,
            asOfficer = ?,
            asMember = ?,
            organizationAffiliated = ?
        WHERE governmentAffiliationID = ? AND populationID = ?`,
        [
          member.isAffiliated,
          formatDate(member.asOfficer),
          formatDate(member.asMember),
          member.organizationAffiliated ,
          member.governmentAffiliationID,
          member.populationID
        ]
      );

      await connection.query(
        `UPDATE NonIvatan
        SET isIpula = ?,
            settlementDetails = ?,
            ethnicity = ?,
            placeOfOrigin = ?,
            isTransient = ?,
            houseOwner = ?,
            isRegistered = ?,
            dateRegistered = ?
        WHERE nonIvatanID = ? AND populationID = ?`,
        [
          member.isIpula,
          member.settlementDetails ,
          member.ethnicity ,
          member.placeOfOrigin ,
          member.isTransient,
          member.houseOwner ,
          member.transientRegistered,
          formatDate(member.dateRegistered),
          member.nonIvatanID,
          member.populationID
        ]
      );

    }

    
    
    
    return console.log('[ UPDATED ] FAMILY PROFILE');
  });

  // Execute all updates and collect results
  const results = await Promise.all(updatePromises);
  return results;
};



export const updateFoodExpenses = async (surveyID, foodExpenses, connection) => {

  if (!surveyID || !foodExpenses.expenses) {
    return console.log('No Food Expenses');
  }

  const expenses = foodExpenses.expenses;
  
  const rice = parseFloat(expenses.Rice?.replace(/,/g, '').trim()) || 0;
  const viand = parseFloat(expenses.Viand?.replace(/,/g, '').trim()) || 0;
  const sugar = parseFloat(expenses.Sugar?.replace(/,/g, '').trim()) || 0;
  const milk = parseFloat(expenses.Milk?.replace(/,/g, '').trim()) || 0;
  const oil = parseFloat(expenses.Oil?.replace(/,/g, '').trim()) || 0;
  const snacks = parseFloat(expenses.Snacks?.replace(/,/g, '').trim()) || 0;
  const otherFood = parseFloat(expenses["Other Food"]?.replace(/,/g, '').trim()) || 0;

  await connection.query(
    `UPDATE FoodExpenses
     SET rice = ?, viand = ?, sugar = ?, milk = ?, oil = ?, snacks = ?, otherFood = ?
     WHERE foodExpensesID = ? AND surveyID = ?`,
    [
      rice,
      viand,
      sugar,
      milk,
      oil,
      snacks,
      otherFood,
      foodExpenses.foodExpensesID,
      surveyID
    ]
  );
  
  console.log('[ UPDATED ] Food Expenses')
  return true;
};

export const updateEducationExpenses = async (surveyId, educationExpenses, connection) => {

  if (!surveyId || !educationExpenses.expenses) return null;

  const expenses = educationExpenses.expenses;

  const tuitionFees = parseFloat(expenses['Tuition Fees']?.replace(/,/g, '').trim()) || 0;
  const miscellaneousFees = parseFloat(expenses['Miscellaneous Fees']?.replace(/,/g, '').trim()) || 0;
  const schoolSupplies = parseFloat(expenses['School Supplies']?.replace(/,/g, '').trim()) || 0;
  const transportation = parseFloat(expenses.Transportation?.replace(/,/g, '').trim()) || 0;
  const rentDormitory = parseFloat(expenses['Rent/Dormitory']?.replace(/,/g, '').trim()) || 0;
  const otherEducation = parseFloat(expenses['Other Education']?.replace(/,/g, '').trim()) || 0;

  await connection.query(
    `UPDATE EducationExpenses
     SET tuitionFees = ?, miscellaneousFees = ?, schoolSupplies = ?, 
         transportation = ?, rentDormitory = ?, otherEducation = ?
     WHERE educationExpensesID = ? AND surveyID = ?`,
    [
      tuitionFees,
      miscellaneousFees,
      schoolSupplies,
      transportation,
      rentDormitory,
      otherEducation,
      educationExpenses.educationExpensesID,
      surveyId
    ]
  );

  console.log('[ UPDATED ] Education Expenses')
  return true;
};

export const updateFamilyExpenses = async (surveyId, familyExpenses, connection) => {

  if (!surveyId || !familyExpenses.expenses) return null;

  const expenses = familyExpenses.expenses;

  const firewood = parseFloat(expenses.Firewood?.replace(/,/g, '').trim()) || 0;
  const gasTank = parseFloat(expenses['Gas Tank']?.replace(/,/g, '').trim()) || 0;
  const caregivers = parseFloat(expenses.Caregivers?.replace(/,/g, '').trim()) || 0;
  const laundry = parseFloat(expenses.Laundry?.replace(/,/g, '').trim()) || 0;
  const hygiene = parseFloat(expenses.Hygiene?.replace(/,/g, '').trim()) || 0;
  const clothings = parseFloat(expenses.Clothings?.replace(/,/g, '').trim()) || 0;
  const others = parseFloat(expenses.Others?.replace(/,/g, '').trim()) || 0;

  await connection.query(
    `UPDATE FamilyExpenses
     SET firewood = ?, gasTank = ?, caregivers = ?, laundry = ?, 
         hygiene = ?, clothings = ?, others = ?
     WHERE familyExpensesID = ? AND surveyID = ?`,
    [
      firewood,
      gasTank,
      caregivers,
      laundry,
      hygiene,
      clothings,
      others,
      familyExpenses.familyExpensesID,
      surveyId
    ]
  );

  console.log('[ UPDATED ] Family Expenses')
  return true;
};

export const updateMonthlyExpenses = async (surveyId, monthlyExpenses, connection) => {

  if (!surveyId || !monthlyExpenses.expenses) return null;

  const expenses = monthlyExpenses.expenses;

  const electricBill = parseFloat(expenses['Electric Bill']?.replace(/,/g, '').trim()) || 0;
  const waterBill = parseFloat(expenses['Water Bill']?.replace(/,/g, '').trim()) || 0;
  const subscription = parseFloat(expenses.Subscription?.replace(/,/g, '').trim()) || 0;
  const mobileLoad = parseFloat(expenses['Mobile Load']?.replace(/,/g, '').trim()) || 0;
  const others = parseFloat(expenses.Others?.replace(/,/g, '').trim()) || 0;

  await connection.query(
    `UPDATE MonthlyExpenses
     SET electricBill = ?, waterBill = ?, subscription = ?, 
         mobileLoad = ?, others = ?
     WHERE monthlyExpensesID = ? AND surveyID = ?`,
    [
      electricBill,
      waterBill,
      subscription,
      mobileLoad,
      others,
      monthlyExpenses.monthlyExpensesID,
      surveyId
    ]
  );

  console.log('[ UPDATED ] Monthly Expenses')
  return true;
};


export const updateHouseInfo = async (houseInfo, houseLocation, connection) => {

  if (!houseInfo) return null;

  try {
    await connection.query(
      `UPDATE HouseInformation
       SET houseCondition = ?, 
           houseStructure = ?, 
           latitude = ?, 
           longitude = ?, 
           houseStreet = ?, 
           barangay = ?, 
           municipality = ?
       WHERE houseInfoID = ? AND surveyID = ?`,
      [
        houseInfo.houseCondition,
        houseInfo.houseStructure,
        houseLocation.latitude,
        houseLocation.longitude,
        houseLocation.houseStreet,
        houseLocation.barangay,
        houseLocation.municipality,
        houseInfo.houseInfoID,
        houseLocation.surveyID
      ]
    );

    console.log('[ UPDATED ] House Info');
    return true;
  } catch (error) {
    console.error(`Error updating house information for survey ID ${houseLocation.surveyID}:`, error);
    throw error;
  }
};

export const updateHouseImage = async (houseInfo, houseLocation, connection) => {

  try {
    if (!houseInfo?.houseImages || !Array.isArray(houseInfo.houseImages)) {
      console.warn('No house images to update.');
      return;
    }

    for(const img of houseInfo.houseImages) {

      if (!img.houseImageID) continue;

      const houseTitle = img.title || 'House Image';
      const houseImageID = img.houseImageID;
      const surveyID = houseLocation.surveyID;

      await connection.query(
        `UPDATE HouseImage
         SET houseTitle = ?
         WHERE houseImageID = ? AND surveyID = ?`,
        [
          houseTitle,
          houseImageID,
          surveyID
        ]
      );

      console.log('[ UPDATED ] House Image');
    }
  
    return true;
  } catch (error) {
    console.error(`Error updating house image ID ${houseInfo.houseImages.houseImageID}:`, error);
    throw error;
  }
};

export const updateWaterInfo = async (surveyID, waterInfo, connection) => {

  const [result] = await connection.query(
    `UPDATE WaterInformation 
     SET waterAccess = ?,
         potableWater = ?,
         waterSources = ?
      WHERE waterInfoID = ? AND surveyID = ?`,
    [
      waterInfo.waterAccess,
      waterInfo.potableWater,
      waterInfo.waterSources,
      waterInfo.waterInfoID,
      surveyID,
    ]
  );

  console.log('[ UPDATED ] Water Info')
  return result;
};


export const updateFarmlots = async (surveyID, waterInfo, connection) => {

  const [result] = await connection.query(
    `UPDATE Farmlots 
     SET cultivation = ?,
         pastureland = ?,
         forestland = ?
      WHERE farmlotID = ? AND surveyID = ?`,
    [
      waterInfo.cultivation,
      waterInfo.pastureland,
      waterInfo.forestland,
      waterInfo.farmlotID,
      surveyID,
    ]
  );

  console.log('[ UPDATED ] Farmlots')
  return result;
};

export const updateCommunityIssues = async (surveyID, communityIssues, connection) => {

  const [result] = await connection.query(
    `UPDATE CommunityIssues 
     SET issues = ?
     WHERE communityIssuesID = ? AND surveyID = ?`,
    [
      communityIssues.issues,
      communityIssues.communityIssuesID,
      surveyID,
    ]
  );

  console.log('[ UPDATED ] Community Issues');
  return result;
};


export const updateServiceAvailed = async (surveyID, serviceAvailed, connection) => {

  if (!serviceAvailed || serviceAvailed.length === 0) return null;

  const updatePromises = serviceAvailed.map(async (service) => {

    let formattedDate = null;
    if (service.dateServiceAvailed) {
      const date = new Date(service.dateServiceAvailed);
      
      // Check if date is valid
      if (!isNaN(date.getTime())) {
        formattedDate = date.toISOString().split('T')[0];
      }
    }

    const [result] = await connection.query(
      `UPDATE ServiceAvailed
       SET dateServiceAvailed = ?,
           ngoName = ?, 
           serviceAvailed = ?,
           maleServed = ?, 
           femaleServed = ?, 
           totalServed = ?, 
           howServiceHelp = ?
       WHERE serviceAvailedID = ? AND surveyID = ?`,
      [
        formattedDate || null,
        service.ngoName,
        service.serviceAvailed,
        parseInt(service.maleServed),
        parseInt(service.femaleServed),
        parseInt(service.totalServed),
        service.howServiceHelp ,
        service.serviceAvailedID,
        surveyID
      ]
    );
    
    return result;
  });

  // Execute all updates and collect results
  const results = await Promise.all(updatePromises);
  console.log('[ UPDATED ] Assistance/Service Availed')
  return results;
};

export const updateLivestock = async (surveyID, livestock, connection) => {

  if (!livestock || Object.keys(livestock).length === 0) {
    console.log('No livestock data to update');
    return null;
  }
  
  await connection.beginTransaction();
  
  try {

    for (const [animal, data] of Object.entries(livestock)) {

      const livestockID = data.livestockID;
      const totalNumber = parseInt(data.number) || 0;
      const own = parseInt(data.own) || 0;
      const dispersal = parseInt(data.dispersal) || 0;

      await connection.query(
        `UPDATE Livestock 
         SET totalNumber = ?, 
             own = ?, 
             dispersal = ?
         WHERE livestockID = ? AND surveyID = ?`,
        [
          totalNumber, 
          own, 
          dispersal, 
          livestockID, 
          surveyID
        ]
      );
    }
    
    // Commit the transaction
    await connection.commit();
    console.log('[ UPDATED ] Livestock')
    return true;
  } catch (error) {
    // Rollback in case of error
    await connection.rollback();
    console.error('Error updating livestock data:', error);
    throw error;
  }
};

export const updateCropsPlanted = async (surveyID, cropsPlanted, connection) => {

  if (!cropsPlanted || !cropsPlanted.crops || Object.keys(cropsPlanted.crops).length === 0) {
    console.log('No crops planted data to insert');
    return null;
  }

  await connection.query(
    `DELETE FROM CropsPlanted WHERE surveyID = ?`,
    [ surveyID ]
  );

  const cropsPlantedValues = Object.entries(cropsPlanted.crops)
    .filter(([crop, size]) => parseInt(size) > 0)
    .map(([crop, size]) => [
      surveyID,
      crop,
      parseInt(size)
    ]);

  if (cropsPlantedValues.length > 0) {
    await connection.query(
      `INSERT INTO CropsPlanted (surveyID, crops, size) VALUES ?`,
      [ cropsPlantedValues ]
    );
  }

  console.log('[ UPDATED ] Crops Planted');
};

export const updateFruitBearingTree = async (surveyID, treeData, connection) => {

  if (!treeData || !treeData.tree || Object.keys(treeData.tree).length === 0) {
    console.log('No fruit bearing tree data to insert');
    return null;
  }

  await connection.query(
    `DELETE FROM FruitBearingTree WHERE surveyID = ?`,
    [ surveyID ]
  );

  const fruitBearingTreeValues = Object.entries(treeData.tree)
    .filter(([tree, totalNumber]) => parseInt(totalNumber) > 0)
    .map(([tree, totalNumber]) => [
      surveyID,
      tree,
      parseInt(totalNumber)
    ]);

  if(fruitBearingTreeValues.length > 0) {
    await connection.query(
      `INSERT INTO FruitBearingTree (surveyID, tree, totalNumber) VALUES ?`,
      [ fruitBearingTreeValues ]
    );
  }

  console.log('[ UPDATED ] Fruit Bearing Tree');
};


export const updateFamilyResources = async (surveyID, resourcesData, connection) => {

  if (!resourcesData || !resourcesData.resources || Object.keys(resourcesData.resources).length === 0) {
    console.log('No family resources data to insert');
    return null;
  }

  await connection.query(
    `DELETE FROM FamilyResources WHERE surveyID = ?`,
    [ surveyID ]
  );


  const familyResourcesValues = Object.entries(resourcesData.resources)
    .filter(([resource, amount]) => parseFloat(amount.replace(/,/g, '').trim()) > 0)
    .map(([resource, amount]) => [
      surveyID,
      resource,
      parseFloat(amount.replace(/,/g, '').trim())
    ]);

  if(familyResourcesValues.length > 0) {
    await connection.query(
      `INSERT INTO FamilyResources (surveyID, resources, amount) VALUES ?`,
      [ familyResourcesValues ]
    );
  }

  console.log('[ UPDATED ] Family Resources');
};


export const updateAppliancesOwn = async (surveyID, appliancesData, connection) => {

  if (!appliancesData || !appliancesData.appliances || Object.keys(appliancesData.appliances).length === 0) {
    console.log('No appliances data to insert');
    return null;
  }

  await connection.query(
    `DELETE FROM AppliancesOwn WHERE surveyID = ?`,
    [ surveyID ]
  );

  const appliancesOwnValues = Object.entries(appliancesData.appliances)
    .filter(([appliance, totalAppliances]) => parseInt(totalAppliances) > 0)
    .map(([appliance, totalAppliances]) => [
      surveyID,
      appliance,
      parseInt(totalAppliances)
    ]);

  if(appliancesOwnValues.length > 0) {
    await connection.query(
      `INSERT INTO AppliancesOwn (surveyID, applianceName, totalOwned) VALUES ?`,
      [ appliancesOwnValues ]
    );
  }

  console.log('[ UPDATED ] Appliances Own');
};


export const updateAmenities = async (surveyID, amenities, connection) => {

  if (!amenities || !amenities.amenities || Object.keys(amenities.amenities).length === 0) {
    console.log('No amenities data to insert');
    return null;
  }

  await connection.query(
    `DELETE FROM Amenities WHERE surveyID = ?`,
    [ surveyID ]
  );


  const amenitiesValues = Object.entries(amenities.amenities)
    .filter(([amenity, totalAmenities]) => parseInt(totalAmenities) > 0)
    .map(([amenity, totalAmenities]) => [
      surveyID,
      amenity,
      parseInt(totalAmenities)
    ]);

  if(amenitiesValues.length > 0) {
    await connection.query(
      `INSERT INTO Amenities (surveyID, amenityName, totalOwned) VALUES ?`,
      [ amenitiesValues ]
    );
  }

  console.log('[ UPDATED ] Amenites');
};