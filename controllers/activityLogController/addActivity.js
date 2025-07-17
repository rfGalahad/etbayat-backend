import pool from '../../config/database.js';



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