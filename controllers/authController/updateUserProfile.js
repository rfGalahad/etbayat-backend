import * as userModel from '../../models/userModel.js';



export const updateUserProfile = async (req, res) => {
  try {
    const { userID } = req.params;
    const { accountName, username } = req.body;
    
    console.log('Updating user profile:', userID, accountName, username);

    // Check if username is already taken by another user
    if (username) {
      const existingUser = await userModel.findUserByUsername(username);
      if (existingUser && existingUser.userID !== userID) {
        return res.status(400).json({
          error: "Username is already taken"
        });
      }
    }
    
    await userModel.updateUser(userID, { accountName, username });
    
    res.status(200).json({
      success: true,
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      error: "Error updating user profile",
      details: error.message
    });
  }
};