import bcrypt from 'bcryptjs';
import pool from '../../config/database.js';



export const createAccountsBatch = async (req, res) => {

  const connection = await pool.getConnection();
  const accounts = req.body;
  // const hash = await bcrypt.hash(password, 10);

  try {
    const accountsValues = accounts.map(user => [
      user.userID,
      user.accountName,
      user.username,
      user.password,
      user.position,
      user.barangay
    ]);

    const [result] = await connection.query(
      `INSERT INTO users (userID, accountName, username, password, position, barangay) 
       VALUES ?`,
      [ accountsValues ]
    );

    return res.status(201).json({ 
      message: `Accounts Added!`,
      accounts: result.success
    });
  } catch (err) {
    console.error("Error adding accounts:", err);
    res.status(500).json({ error: "Error adding accounts", details: err.message });
  } finally {
    connection.release();
  }
}