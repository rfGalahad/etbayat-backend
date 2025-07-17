import pool from '../../config/database.js';



export const deleteActivity = async (req, res) => {

  const activityLogID = req.params.activityLogID;

  try {

    await pool.query(`DELETE FROM ActivityLog WHERE activityLogID = ?`, [activityLogID]);

    res.status(200).json({ 
      success: true, 
      message: 'Activity deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
};