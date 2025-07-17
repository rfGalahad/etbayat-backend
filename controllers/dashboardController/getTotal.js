import pool from '../../config/database.js';




export const getTotal = async (req, res) => {

  const year = parseInt(req.params.year);

  try {
    const [rows] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM Surveys WHERE YEAR(surveyDate) = ${year}) AS totalSurveys,
        (SELECT COUNT(*) 
          FROM Population p 
          JOIN Surveys s ON s.surveyID = p.surveyID 
          WHERE YEAR(s.surveyDate) = ${year}) AS totalPopulation,
        (SELECT COUNT(*) 
          FROM Households h 
          JOIN Surveys s ON s.surveyID = h.surveyID 
          WHERE YEAR(s.surveyDate) = ${year}) AS totalHousehold,

        COUNT(CASE WHEN pi.sex = 'Male' THEN 1 END) AS totalMale,
        COUNT(CASE WHEN pi.sex = 'Female' THEN 1 END) AS totalFemale,
        COUNT(CASE WHEN pi.isPWD = TRUE THEN 1 END) AS totalPWD,
        COUNT(CASE WHEN pi.isSoloParent = TRUE THEN 1 END) AS totalSoloParent,
        COUNT(CASE WHEN pi.age BETWEEN 15 AND 30 THEN 1 END) AS totalYouth,
        COUNT(CASE WHEN pi.isOSY = TRUE THEN 1 END) AS totalOSY,
        COUNT(CASE WHEN pi.age >= 60 THEN 1 END) AS totalSenior

      FROM PersonalInformation pi
      JOIN Population p ON pi.populationID = p.populationID
      JOIN Surveys s ON s.surveyID = p.surveyID
      WHERE YEAR(s.surveyDate) = ${year};
      `);

    res.json(rows[0]);
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};