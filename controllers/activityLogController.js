import pool from '../config/database.js';

export const getActivityLog = async (req, res) => {
  try {

    const [rows] = await pool.query(`SELECT * FROM ActivityLog ORDER BY timestamp DESC`);

    res.status(200).json(rows);

  } catch (error) {
    console.error('Error getting activity log:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addActivity = async (req, res) => {

  const connection = await pool.getConnection();

  try {

    const { username, position, action, description } = req.body;

    await connection.query(
      `INSERT INTO ActivityLog (username, position, action, description) VALUES (?, ?, ?, ?)`,
      [ username, 
        position,
        action,
        description
      ]
    );

    res.status(200).json({ success: true, message: "Activity added successfully" });

  } catch (err) {
    console.error("Error adding activity:", err);
    res.status(500).json({ error: "Error activity", details: err.message });
  } finally {
    connection.release();
  }
}

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