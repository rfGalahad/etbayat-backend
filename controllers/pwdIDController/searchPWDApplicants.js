import pool from '../../config/database.js';



export const searchPWDApplicants = async (req, res) => {

  const connection = await pool.getConnection();
  
  try {

    const { firstName, middleName, lastName, suffix, birthdate, sex } = req.body;

    const [results] = await connection.query(`
      SELECT 
        pi.personalInfoID,
        pi.populationID,
        pi.applicantID,
        pi.pwdIDNumber,
        pi.firstName,
        pi.middleName,
        pi.lastName,
        pi.suffix,
        pi.birthdate,
        pi.sex,
        CASE WHEN p.populationID IS NOT NULL THEN TRUE ELSE FALSE END AS existsInPopulation
      FROM PersonalInformation pi
      LEFT JOIN Population p ON pi.populationID = p.populationID
      WHERE pi.firstName LIKE ?
        AND (pi.middleName LIKE ? OR ? = '' OR pi.middleName IS NULL)
        AND pi.lastName LIKE ?
        AND (pi.suffix LIKE ? OR ? = '' OR pi.suffix IS NULL)
        ${birthdate ? 'AND pi.birthdate = ?' : ''}
        AND pi.sex = ?
        AND pi.isPWD = TRUE
      ORDER BY 
        CASE WHEN pi.middleName = ? THEN 1 ELSE 2 END,
        CASE WHEN pi.birthdate = ? THEN 1 ELSE 2 END
    `, [
      firstName,
      middleName || '', middleName || '',
      lastName,
      suffix || '', suffix || '',
      ...(birthdate ? [birthdate] : []),
      sex,
      middleName || '',
      birthdate || null
    ]);

    const population = results.map(person => ({
      personalInfoID: person.personalInfoID,
      populationID: person.populationID,
      applicantID: person.applicantID,
      pwdIDNumber: person.pwdIDNumber,
      firstName: person.firstName,
      middleName: person.middleName || 'N/A',
      lastName: person.lastName,
      suffix: person.suffix || 'N/A',
      birthdate: person.birthdate,
      sex: person.sex,
      existsInPopulation: person.existsInPopulation
    }));

    res.status(200).json({ 
      success: true,
      population 
    });

  } catch (error) {
    console.error('Error finding person:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error finding person', 
      error: error.message 
    });
  } finally {
    connection.release();
  }
};