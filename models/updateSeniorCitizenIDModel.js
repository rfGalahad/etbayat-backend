export const updateSeniorCitizenApplication = async (scApplicationID, photoID, signature, connection) => {
  
  await connection.beginTransaction();

  try {

    // Update the main application
    await connection.query(
      `UPDATE SeniorCitizenApplication
       SET dateApplied = CURDATE() ,
           issuedAt = CURDATE() ,
           issuedOn = CURDATE() 
       WHERE scApplicationID = ?`,
      [ scApplicationID ]
    );


    if (photoID && signature) {
      await connection.query(
        `UPDATE SeniorCitizenApplication
         SET photoID = ?, signature = ?
         WHERE scApplicationID = ?`,
        [photoID, signature, scApplicationID]
      );
    } else if (photoID) {
      await connection.query(
        `UPDATE SeniorCitizenApplication
         SET photoID = ?
         WHERE scApplicationID = ?`,
        [photoID, scApplicationID]
      );
    } else if (signature) {
      await connection.query(
        `UPDATE SeniorCitizenApplication
         SET signature = ?
         WHERE scApplicationID = ?`,
        [signature, scApplicationID]
      );
    }
    

    await connection.commit();
    
    return console.log('[ UPDATED - Senior Citizen Application ]');
    
  } catch (error) {
    await connection.rollback();
    console.error('Error updating Senior Citizen Application:', error);
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
           seniorCitizenIDNumber = ?
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
        personalInfo.seniorCitizenIDNumber,
        personalInfo.personalInfoID,
        personalInfo.applicantID ]
    );

    await connection.query(
      `UPDATE ContactInformation 
       SET street = ?, 
           barangay = ?, 
           municipality = ?, 
           province = ?, 
           mobileNumber = ?
       WHERE contactInfoID = ? AND applicantID = ?`,
      [ personalInfo.street,  
        personalInfo.barangay,
        personalInfo.municipality,
        personalInfo.province,
        personalInfo.mobileNumber, 
        personalInfo.contactInfoID,
        personalInfo.applicantID ]
    );

    await connection.query(
      `UPDATE ProfessionalInformation 
       SET educationalAttainment = ?, 
           skills = ?,
           annualIncome = ?,
           occupation = ?
       WHERE professionalInfoID = ? AND applicantID = ?`,
      [ personalInfo.educationalAttainment,  
        personalInfo.skills,
        parseFloat((personalInfo.annualIncome || '0').replace(/,/g, '').trim()) || 0,
        personalInfo.occupation,
        personalInfo.professionalInfoID,
        personalInfo.applicantID ]
    );

    await connection.commit();
    
    
    return console.log('[ UPDATED - Personal Information ] ');
  } catch (error) {
    await connection.rollback();
    console.error('Error creating Population:', error);
    throw error;
  }
};

export const updateOscaInfo = async (scApplicationID, personalInfo, connection) => {

  await connection.beginTransaction();

  try {

    await connection.query(
      `UPDATE OscaInformation
       SET associationName = ?,
           asOfficer = ?,
           position = ?
       WHERE oscaInfoID = ? AND scApplicationID = ?`,
      [ personalInfo.associationName,  
        personalInfo.asOfficer ? personalInfo.asOfficer.split('T')[0] : null,
        personalInfo.position,
        personalInfo.oscaInfoID,
        scApplicationID ]
    );

    await connection.commit();
  
    return console.log('[ UPDATED - OSCA Information ]');
  } catch (error) {
    await connection.rollback();
    console.error('Error creating Population:', error);
    throw error;
  }
};

export const updateFamilyComposition = async (scApplicationID, familyMembers, connection) => {
  
  if (!familyMembers || familyMembers.length === 0) return null;

  // Step 1: Get current members from DB
  const [existingMembers] = await connection.query(
    `SELECT familyCompositionID FROM FamilyComposition WHERE scApplicationID = ?`,
    [scApplicationID]
  );

  const existingIDs = new Set(existingMembers.map(m => m.familyCompositionID));
  const incomingIDs = new Set(familyMembers.map(m => m.familyCompositionID).filter(Boolean));

  // Step 2: Determine which IDs to delete
  const toDelete = [...existingIDs].filter(id => !incomingIDs.has(id));

  // Step 3: Delete removed members
  if (toDelete.length > 0) {
    await connection.query(
      `DELETE FROM FamilyComposition WHERE familyCompositionID IN (?) AND scApplicationID = ?`,
      [toDelete, scApplicationID]
    );
    console.log('[ DELETED Family Members ]:', toDelete);
  }

  // Step 4: Insert or update current members
  const queries = familyMembers.map(async (member) => {
    const birthdate = member.birthdate ? member.birthdate.split('T')[0] : null;
    const income = parseFloat((member.annualIncome || '0').replace(/,/g, '').trim()) || 0;

    if (member.familyCompositionID) {
      // Update existing
      const [result] = await connection.query(
        `UPDATE FamilyComposition
         SET firstName = ?, middleName = ?, lastName = ?, suffix = ?,
             birthdate = ?, age = ?, relationship = ?, civilStatus = ?,
             occupation = ?, annualIncome = ?
         WHERE familyCompositionID = ? AND scApplicationID = ?`,
        [
          member.firstName, member.middleName, member.lastName, member.suffix,
          birthdate, member.age, member.relationship, member.civilStatus,
          member.occupation, income,
          member.familyCompositionID, scApplicationID
        ]
      );
      console.log('[ UPDATED - Family Member ]', member.firstName);
      return result;
    } else {
      // Insert new
      const [result] = await connection.query(
        `INSERT INTO FamilyComposition (
           scApplicationID, firstName, middleName, lastName, suffix,
           birthdate, age, relationship, civilStatus, occupation, annualIncome
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          scApplicationID, member.firstName, member.middleName, member.lastName, member.suffix,
          birthdate, member.age, member.relationship, member.civilStatus,
          member.occupation, income
        ]
      );
      console.log('[ INSERTED - Family Member ]', member.firstName);
      return result;
    }
  });

  const results = await Promise.all(queries);
  return results;
};


