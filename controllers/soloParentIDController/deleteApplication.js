import pool from '../../config/database.js';




export const deleteApplication = async (req, res) => {

  const connection = await pool.getConnection();
  const spApplicationID = req.params.spApplicationID;
  const populationID = req.params.populationID;
  

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT applicantID FROM SoloParentApplication WHERE spApplicationID = ?',
      [spApplicationID]
    );

    if (rows.length === 0) {
      throw new Error('No application found with the given ID.');
    }
    
    const applicantID = rows[0].applicantID;

    if(populationID) {
      await connection.query('DELETE FROM EmergencyContact WHERE spApplicationID = ?', [spApplicationID]);
      await connection.query('DELETE FROM ProblemNeeds WHERE spApplicationID = ?', [spApplicationID]);
      await connection.query('DELETE FROM HouseholdComposition WHERE spApplicationID = ?', [spApplicationID]);
      await connection.query('DELETE FROM OtherInformation WHERE spApplicationID = ?', [spApplicationID]);
      await connection.query('DELETE FROM SoloParentApplication WHERE spApplicationID = ?', [spApplicationID]);
    } else {
      await connection.query('DELETE FROM EmergencyContact WHERE spApplicationID = ?', [spApplicationID]);
      await connection.query('DELETE FROM ProblemNeeds WHERE spApplicationID = ?', [spApplicationID]);
      await connection.query('DELETE FROM HouseholdComposition WHERE spApplicationID = ?', [spApplicationID]);
      await connection.query('DELETE FROM OtherInformation WHERE spApplicationID = ?', [spApplicationID]);

      await connection.query('DELETE FROM GovernmentIDs WHERE applicantID = ?', [applicantID]);
      await connection.query('DELETE FROM PersonalInformation WHERE applicantID = ?', [applicantID]);
      await connection.query('DELETE FROM ProfessionalInformation WHERE applicantID = ?', [applicantID]);
      await connection.query('DELETE FROM ContactInformation WHERE applicantID = ?', [applicantID]);

      await connection.query('DELETE FROM SoloParentApplication WHERE spApplicationID = ?', [spApplicationID]);
    }
    
    
    await connection.commit();
    
    res.status(200).json({ 
      success: true, 
      message: 'Application deleted successfully' 
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error deleting application:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting application', 
      error: error.message 
    });
  } finally {
    connection.release();
  }
};
