import pool from '../../config/database.js';



export const getLastUserSequence = async (req, res) => {
  try {
    const { dateFormat } = req.query;
    
    if (!dateFormat) {
      return res.status(400).json({ error: 'dateFormat is required' });
    }
    
    // Get the last sequence number from userID for the specified date format
    const [userIDRows] = await pool.query(
      `SELECT MAX(CAST(SUBSTRING(userID, LENGTH('USER') + LENGTH(?) + 1) AS UNSIGNED)) AS lastUserIDSequence 
       FROM users 
       WHERE userID LIKE CONCAT('USER', ?, '%')`,
      [dateFormat, dateFormat]
    );
    
    // Get the maximum sequence number from all usernames with this date format
    const [usernameRows] = await pool.query(
      `SELECT MAX(CAST(SUBSTRING(username, LOCATE(?, username) + LENGTH(?)) AS UNSIGNED)) AS lastUsernameSequence 
       FROM users 
       WHERE username LIKE CONCAT('%', ?, '%')`,
      [dateFormat, dateFormat, dateFormat]
    );
    
    const lastUserIDSequence = userIDRows[0].lastUserIDSequence || 0;
    const lastUsernameSequence = usernameRows[0].lastUsernameSequence || 0;
    
    // Return the maximum of both sequences to ensure no duplicates
    const lastSequence = Math.max(lastUserIDSequence, lastUsernameSequence);
    
    return res.status(200).json({ lastSequence });
  } catch (error) {
    console.error('Error getting last sequence:', error);
    return res.status(500).json({ error: 'Error getting last sequence', details: error.message });
  }
};