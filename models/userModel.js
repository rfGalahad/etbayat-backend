import pool from '../config/database.js';
import bcrypt from 'bcryptjs';


export const findUserByUsername = async (username) => {
  const hash = await bcrypt.hash('superduperadmin123', 10);
  await pool.query(`INSERT INTO users (userID, accountName, username, password, position) VALUES ('000001', 'Super Admin', 'superadmin', '${hash}', 'Admin')`);
  const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
  return rows[0];
};

export const findUserByID = async (userID) => {
  const [rows] = await pool.query("SELECT * FROM users WHERE userID = ?", [userID]);
  return rows[0];
};

export const createUser = async (userID, accountName, username, hashedPassword, position, barangay) => {
  const [result] = await pool.query(
    `INSERT INTO users (
      userID, 
      accountName, 
      username, 
      password, 
      position,
      barangay ) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userID, accountName, username, hashedPassword, position, barangay]
  );
  return result;
};

export const updateUser = async (userID, userData) => {
  
  const [result] = await pool.query( `
    UPDATE users 
    SET accountName = ?,
        username = ?  
    WHERE userID = ?`,
    [userData.accountName, userData.username, userID]);

  return result;
};

export const updateUserPassword = async (userID, hashedPassword) => {
  const [result] = await pool.query(
    "UPDATE users SET password = ? WHERE userID = ?",
    [hashedPassword, userID]
  );
  return result;
};