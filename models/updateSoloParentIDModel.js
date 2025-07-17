export const updateSoloParentApplicant = async (spApplicationID, photoID, signature, connection) => {
  
  await connection.beginTransaction();

  try {

    // Update the main application
    await connection.query(
      `UPDATE SoloParentApplication
       SET caseNumber = ?,
           dateApplied = CURDATE()
       WHERE spApplicationID = ?`,
      [ 'PSGC-YYMM-000001',
        spApplicationID ]
    );


    if (photoID && signature) {
      await connection.query(
        `UPDATE SoloParentApplication
         SET photoID = ?, signature = ?
         WHERE spApplicationID = ?`,
        [photoID, signature, spApplicationID]
      );
    } else if (photoID) {
      await connection.query(
        `UPDATE SoloParentApplication
         SET photoID = ?
         WHERE spApplicationID = ?`,
        [photoID, spApplicationID]
      );
    } else if (signature) {
      await connection.query(
        `UPDATE SoloParentApplication
         SET signature = ?
         WHERE spApplicationID = ?`,
        [signature, spApplicationID]
      );
    }
    

    await connection.commit();
    
    return console.log('[ UPDATED - Solo Parent Application ]');
    
  } catch (error) {
    await connection.rollback();
    console.error('Error updating Solo Parent Application:', error);
    throw error;
  }
};

export const updatePersonalInfo = async (personalInfo, connection) => {

  await connection.beginTransaction();

  try {

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
           civilStatus = ?, 
           religion = ?

       WHERE personalInfoID = ? AND applicantID = ?`,
      [ personalInfo.firstName,  
        personalInfo.middleName,
        personalInfo.lastName,
        personalInfo.suffix,
        personalInfo.birthdate ? personalInfo.birthdate.split('T')[0] : null,
        personalInfo.age,
        personalInfo.sex,
        personalInfo.birthplace,
        personalInfo.civilStatus,
        personalInfo.religion,
        //personalInfo.soloParentNumber,
        personalInfo.personalInfoID,
        personalInfo.applicantID ]
    );

    await connection.query(
      `UPDATE ContactInformation 
       SET street = ?, 
           barangay = ?, 
           municipality = ?, 
           province = ?, 
           mobileNumber = ?,
           emailAddress = ?
       WHERE contactInfoID = ? AND applicantID = ?`,
      [ personalInfo.street,  
        personalInfo.barangay,
        personalInfo.municipality,
        personalInfo.province,
        personalInfo.mobileNumber, 
        personalInfo.emailAddress,
        personalInfo.contactInfoID,
        personalInfo.applicantID ]
    );

    await connection.query(
      `UPDATE ProfessionalInformation 
       SET educationalAttainment = ?, 
           monthlyIncome = ?,
           occupation = ?,
           company = ?,
           employmentStatus = ?
       WHERE professionalInfoID = ? AND applicantID = ?`,
      [ personalInfo.educationalAttainment,  
        parseFloat((personalInfo.monthlyIncome || '0').replace(/,/g, '').trim()) || 0,
        personalInfo.occupation,
        personalInfo.company,
        personalInfo.employmentStatus,
        personalInfo.professionalInfoID,
        personalInfo.applicantID ]
    );

    await connection.commit();
    
    
    return console.log(' [ UPDATED - Personal Information ]');;
  } catch (error) {
    await connection.rollback();
    console.error('Error creating Population:', error);
    throw error;
  }
};

export const updateHouseholdComposition = async (spApplicationID, familyMembers, connection) => {
  
  if (!familyMembers || familyMembers.length === 0) return null;

  // Step 1: Get existing members from DB
  const [existingMembers] = await connection.query(
    `SELECT householdCompositionID FROM HouseholdComposition WHERE spApplicationID = ?`,
    [spApplicationID]
  );

  const existingIDs = new Set(existingMembers.map(m => m.householdCompositionID));
  const incomingIDs = new Set(familyMembers.map(m => m.householdComposition).filter(Boolean));

  // Step 2: Determine which IDs to delete
  const toDelete = [...existingIDs].filter(id => !incomingIDs.has(id));

  // Step 3: Delete removed members
  if (toDelete.length > 0) {
    await connection.query(
      `DELETE FROM HouseholdComposition WHERE householdCompositionID IN (?) AND spApplicationID = ?`,
      [toDelete, spApplicationID]
    );
    console.log('[ DELETED Household Members ]:', toDelete);
  }

  // Step 4: Insert or Update current members
  const queries = familyMembers.map(async (member) => {
    const birthdate = member.birthdate ? member.birthdate.split('T')[0] : null;
    const income = parseFloat((member.annualIncome || '0').replace(/,/g, '').trim()) || 0;

    if (member.householdComposition) {
      // Update existing member
      const [result] = await connection.query(
        `UPDATE HouseholdComposition
         SET firstName = ?, middleName = ?, lastName = ?, suffix = ?,
             sex = ?, birthdate = ?, age = ?, relationship = ?,
             civilStatus = ?, educationalAttainment = ?, occupation = ?, monthlyIncome = ?
         WHERE householdCompositionID = ? AND spApplicationID = ?`,
        [
          member.firstName, member.middleName, member.lastName, member.suffix,
          member.sex, birthdate, member.age, member.relationship,
          member.civilStatus, member.educationalAttainment, member.occupation,
          income,
          member.householdComposition, spApplicationID
        ]
      );
      console.log('[ UPDATED Household Member ]:', member.firstName);
      return result;
    } else {
      // Insert new member
      const [result] = await connection.query(
        `INSERT INTO HouseholdComposition (
           spApplicationID, firstName, middleName, lastName, suffix,
           sex, birthdate, age, relationship, civilStatus,
           educationalAttainment, occupation, monthlyIncome
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          spApplicationID, member.firstName, member.middleName, member.lastName, member.suffix,
          member.sex, birthdate, member.age, member.relationship, member.civilStatus,
          member.educationalAttainment, member.occupation, income
        ]
      );
      console.log('[ INSERTED Household Member ]:', member.firstName);
      return result;
    }
  });

  const results = await Promise.all(queries);
  return results;
};


export const updateOtherInfo = async (spApplicationID, personalInfo, connection) => {

  await connection.query(
    `UPDATE OtherInformation 
     SET isBeneficiary = ?, 
         householdID = ?,
         beneficiaryCode = ?,
         isIndigenous = ?, 
         indigenousAffiliation = ?,
         isLGBTQ = ?, 
         isPWD = ?, 
         soloParentCategory = ? 
     WHERE otherInfoID = ? AND spApplicationID = ?`,
    [ personalInfo.isBeneficiary,  
      personalInfo.householdID,  
      personalInfo.beneficiaryCode,
      personalInfo.isIndigenous,
      personalInfo.indigenousAffiliation,
      personalInfo.isLGBTQ,
      personalInfo.isPWD,
      personalInfo.soloParentCategory,
      personalInfo.otherInfoID,
      spApplicationID ]
  );

  return console.log('[ UPDATED -  Other Information ]');
};

export const updateProblemNeeds = async (spApplicationID, problemNeeds, connection) => {

  await connection.query(
    `UPDATE ProblemNeeds 
     SET causeSoloParent = ?, 
         needsSoloParent = ?
     WHERE problemNeedsID = ? AND spApplicationID = ?`,
    [ problemNeeds.causeSoloParent,
      problemNeeds.needsSoloParent,
      problemNeeds.problemNeedsID,
      spApplicationID ]
  );

  return console.log('[ UPDATED - Problem/Needs ]');
};

export const updateEmergencyContact = async (spApplicationID, emergencyContact, connection) => {

  await connection.query(
    `UPDATE EmergencyContact
     SET contactName = ?, 
         relationship = ?, 
         street = ?, 
         barangay = ?, 
         municipality = ?, 
         province = ?, 
         mobileNumber = ? 
     WHERE emergencyContactID = ? AND spApplicationID = ?`,
    [ emergencyContact.contactName,
      emergencyContact.relationship,
      emergencyContact.street,  
      emergencyContact.barangay,
      emergencyContact.municipality,
      emergencyContact.province,
      emergencyContact.mobileNumber,
      emergencyContact.emergencyContactID,
      spApplicationID ]
  );

  return console.log('[ UPDATED - Emergency Contact ]');
};
