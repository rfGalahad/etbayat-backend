import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as userModel from '../../models/userModel.js';


export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Logging in:', username);
    
    // Find user in database
    const user = await userModel.findUserByUsername(username);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });
    
    // Generate token
    const token = jwt.sign({ id: user.id }, "secretKey", { expiresIn: "1d" });
    
    res.json ({ 
      message: "Login successful", 
      token,
      userID: user.userID,
      username: user.username,
      accountName: user.accountName,
      position: user.position,
      barangay: user.barangay
    });

  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Error during login", details: err.message });
  }
}; 