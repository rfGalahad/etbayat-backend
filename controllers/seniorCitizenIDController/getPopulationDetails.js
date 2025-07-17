import pool from '../../config/database.js';



export const getPopulationDetails = async (req, res) => {

  const connection = await pool.getConnection();
  const populationID = req.params.populationID || req.query.populationID;
  console.log('POPULATION ID:', populationID);

  try {

    console.log('Retrieving Population');
    const [population] = await connection.query(`
      SELECT 
        populationID,
        surveyID
      FROM Population
      WHERE populationID = ?
    `, [populationID]);

    console.log('Retrieving Personal Information');
    const [personalInfo] = await connection.query(`
      SELECT 
          pi.*,
          proi.*,
          ci.*,
          ga.*
      FROM PersonalInformation pi
      LEFT JOIN ProfessionalInformation proi 
          ON pi.populationID = proi.populationID
      LEFT JOIN ContactInformation ci 
          ON pi.populationID = ci.populationID
      LEFT JOIN GovernmentAffiliation ga 
          ON pi.populationID = ga.populationID
      WHERE pi.populationID = ?
    `, [populationID]);

    res.status(200).json({ 
      population,
      personalInfo
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