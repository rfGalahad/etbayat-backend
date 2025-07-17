import bcrypt from 'bcryptjs';
import pool from '../../config/database.js';



export const createAccount = async (req, res) => {

  const connection = await pool.getConnection();
  const newAccount = req.body;
  const hash = await bcrypt.hash(newAccount.password, 10);

  try {
    // Check if the username already exists
    const [existing] = await connection.query(
      `SELECT * FROM users WHERE username = ?`,
      [newAccount.username]
    );

    if (existing.length > 0) {
      return res.status(409).json({ 
        message: 'Username already exists' 
      });
    }

    // Insert the new account
    const [results] = await connection.query(
      `INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)`,
      [
        newAccount.userID,
        newAccount.accountName,
        newAccount.username,
        hash,
        newAccount.position,
        newAccount.barangay
      ]
    );

    res.status(200).json({ 
      success: results.affectedRows > 0, 
      message: 'Account added successfully' 
    });

    
  } catch (err) {
    console.error("Error adding account:", err);
    res.status(500).json({ error: "Error adding account", details: err.message });
  } finally {
    connection.release();
  }
}