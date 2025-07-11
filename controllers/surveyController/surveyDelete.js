import pool from '../../config/database.js';




export const deleteSurvey = async (req, res) => {
  const connection = await pool.getConnection();
  const surveyID = req.params.surveyID;

  try {
    await connection.beginTransaction();

    // 1. Get populationID(s) related to the surveyID
    const [populationRows] = await connection.query(
      'SELECT populationID FROM Population WHERE surveyID = ?',
      [surveyID]
    );

    // You might have multiple population records for one survey
    const populationIDs = populationRows.map(row => row.populationID);

    // 2. Delete related tables that use surveyID
    await connection.query('DELETE FROM ServiceAvailed WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM Amenities WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM AppliancesOwn WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM FamilyResources WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM FruitBearingTree WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM CropsPlanted WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM Livestock WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM Farmlots WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM CommunityIssues WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM WaterInformation WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM HouseImage WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM HouseInformation WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM MonthlyExpenses WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM FamilyExpenses WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM EducationExpenses WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM FoodExpenses WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM Households WHERE surveyID = ?', [surveyID]);

    // 3. Delete all population-related records
    for (const populationID of populationIDs) {
      await connection.query('DELETE FROM NonIvatan WHERE populationID = ?', [populationID]);
      await connection.query('DELETE FROM GovernmentAffiliation WHERE populationID = ?', [populationID]);
      await connection.query('DELETE FROM ContactInformation WHERE populationID = ?', [populationID]);
      await connection.query('DELETE FROM ProfessionalInformation WHERE populationID = ?', [populationID]);
      await connection.query('DELETE FROM GovernmentIDs WHERE populationID = ?', [populationID]);
      await connection.query('DELETE FROM PersonalInformation WHERE populationID = ?', [populationID]);
      await connection.query('DELETE FROM Population WHERE populationID = ?', [populationID]);
    }

    // 4. Delete survey
    await connection.query('DELETE FROM Surveys WHERE surveyID = ?', [surveyID]);

    await connection.commit();
    res.status(200).json({
      success: true,
      message: 'Survey and related population data deleted successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error deleting survey:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting survey',
      error: error.message
    });
  } finally {
    connection.release();
  }
};