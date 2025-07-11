import pool from '../config/database.js';

export const getTotal = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM Surveys) AS totalSurveys,
        (SELECT COUNT(*) FROM Population) AS totalPopulation,
        COUNT(CASE WHEN sex = 'Male' AND populationID IS NOT NULL THEN 1 END) AS totalMale,
        COUNT(CASE WHEN sex = 'Female' AND populationID IS NOT NULL THEN 1 END) AS totalFemale,
        COUNT(CASE WHEN isPWD = TRUE AND populationID IS NOT NULL THEN 1 END) AS totalPWD,
        COUNT(CASE WHEN isSoloParent = TRUE AND populationID IS NOT NULL THEN 1 END) AS totalSoloParent,
        COUNT(CASE WHEN age BETWEEN 15 AND 30 AND populationID IS NOT NULL THEN 1 END) AS totalYouth,
        COUNT(CASE WHEN isOSY = TRUE AND populationID IS NOT NULL THEN 1 END) AS totalOSY,
        COUNT(CASE WHEN age >= 60 AND populationID IS NOT NULL THEN 1 END) AS totalSenior
      FROM PersonalInformation;
      `);

    res.json(rows[0]);
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBarangayStats = async (req, res) => {
  try {

    const [surveys] = await pool.query(`
      SELECT barangay, COUNT(*) AS count 
      FROM Surveys 
      GROUP BY barangay
    `);

    const [population] = await pool.query(`
      SELECT s.barangay, COUNT(*) AS count 
      FROM Population p
      LEFT JOIN Surveys s ON s.surveyID = p.surveyID
      GROUP BY s.barangay
    `);

    const [sex] = await pool.query(`
      SELECT 
        s.barangay,
        SUM(CASE WHEN pi.sex = 'MALE' THEN 1 ELSE 0 END) AS male_count,
        SUM(CASE WHEN pi.sex = 'FEMALE' THEN 1 ELSE 0 END) AS female_count
      FROM PersonalInformation pi
      JOIN Population p ON pi.populationID = p.populationID
      JOIN Surveys s ON p.surveyID = s.surveyID
      GROUP BY s.barangay;
    `);

    const [pwd] = await pool.query(`
      SELECT 
        s.barangay,
        SUM(CASE WHEN pi.isPWD = 'TRUE' AND p.populationID IS NOT NULL THEN 1 ELSE 0 END) AS pwd
      FROM PersonalInformation pi
      JOIN Population p ON pi.populationID = p.populationID
      JOIN Surveys s ON p.surveyID = s.surveyID
      GROUP BY s.barangay;
    `);

    const [soloParent] = await pool.query(`
      SELECT 
        s.barangay,
        SUM(CASE WHEN pi.isSoloParent = 'TRUE' AND p.populationID IS NOT NULL THEN 1 ELSE 0 END) AS soloParent
      FROM PersonalInformation pi
      JOIN Population p ON pi.populationID = p.populationID
      JOIN Surveys s ON p.surveyID = s.surveyID
      GROUP BY s.barangay;
    `);

    const [seniorCitizen] = await pool.query(`
      SELECT 
        s.barangay,
        SUM(CASE WHEN pi.age >= 60 AND p.populationID IS NOT NULL THEN 1 ELSE 0 END) AS seniorCitizen
      FROM PersonalInformation pi
      JOIN Population p ON pi.populationID = p.populationID
      JOIN Surveys s ON p.surveyID = s.surveyID
      GROUP BY s.barangay;
    `);

    res.json({
      surveys,
      population,
      sex,
      pwd,
      soloParent,
      seniorCitizen
    });
  } catch (error) {
    console.error('Error fetching barangay stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
