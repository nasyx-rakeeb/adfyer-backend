const dotenv = require('dotenv');
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const connectDB = require('./db.js');
const User = require('./models/User');
const bcrypt = require("bcryptjs")
const sendEmail = require("./sendEmail.js")

dotenv.config();
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(express.json())
connectDB()

const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

// Root 
app.get("/api", (req, res) => {
    return res.status(200).json({message: "API is up and running..."})
})

// Register
app.post("/api/user/register", async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  // Validate email
  if (!email) {
    return res.status(400).json({ msg: "Please enter an email" });
  }
  if (!emailRegex.test(email)) {
    return res.status(400).json({ msg: "Please enter a valid email" });
  }

  // Validate password
  if (!password) {
    return res.status(400).json({ msg: "Please enter a password" });
  }
  if (password.length < 6) {
    return res.status(400).json({ msg: "Password must be at least 6 characters long" });
  }
  if (!/\d/.test(password)) {
    return res.status(400).json({ msg: "Password must contain at least one number" });
  }
  if (!/[a-zA-Z]/.test(password)) {
    return res.status(400).json({ msg: "Password must contain at least one letter" });
  }

  // Validate confirmPassword
  if (!confirmPassword) {
    return res.status(400).json({ msg: "Please confirm your password" });
  }
  if (confirmPassword !== password) {
    return res.status(400).json({ msg: "Passwords do not match" });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "Email already in use" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user to database
    user = new User({ email, password: hashedPassword });
    await user.save();
    return res.status(200).json({ msg: "User created", data: { id: user.id, email: user.email } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Signin
app.post("/api/user/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ msg: "Please enter all fields" });
    }

    // Check if email is valid
    if (!emailRegex.test(email)) {
      return res.status(400).json({ msg: "Invalid email" });
    }

    // Check if user exists in the database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "User does not exist" });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

// Route for user to enter their email
app.post('/api/user/forgot-password', async (req, res) => {
  const email = req.body.email;
  // Validate email using regex
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email' });
  }
  if (!email) {
      return res.status(400).json({message: "Please provide email address"})
  }
  // Check if user exists in db
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'User does not exist' });
  }
  // Generate reset token
  const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  // Update user with reset token
  user.resetToken = resetToken;
  user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
  await user.save();
  // Send reset token to user's email
  sendEmail(email, `Password Reset`, `To reset your Adfyer account password, please use the following reset token: ${resetToken}. If you did not take this action you can safely disregard this email.`);
  return res.status(200).json({ message: 'Reset token sent' });
});

// Route for user to enter reset token and new password
app.post('/api/user/update-password', async (req, res) => {
  const resetToken = req.body.resetToken;
  const newPassword = req.body.newPassword;
  const confirmNewPassword = req.body.confirmNewPassword;
  if (!resetToken) {
      return res.status(400).json({ message: 'Please provide a reset token' });
  }
  if (!newPassword) {
      return res.status(400).json({ message: 'Please provide new password' });
  }
  if (!confirmNewPassword) {
      return res.status(400).json({ message: 'Please provide confirm new password' });
  }
  if (newPassword !== confirmNewPassword) {
      return res.status(400).json({message: "New password and confirm new passwords do not match"})
  }
   // Validate new password
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  if (!/\d/.test(newPassword)) {
    return res.status(400).json({ msg: "Password must contain at least one number" });
  }
  if (!/[a-zA-Z]/.test(newPassword)) {
    return res.status(400).json({ msg: "Password must contain at least one letter" });
  }
  try {
  // Check if reset token exists
  const user = await User.findOne({ resetToken });
  if (!user) {
    return res.status(400).json({ message: 'Invalid reset token' });
  }
  // Check if reset token has expired
  if (user.resetTokenExpiry < Date.now()) {
    return res.status(400).json({ message: 'Reset token has expired' });
  }
  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
// Update user's password
user.password = hashedPassword;
user.resetToken = undefined;
user.resetTokenExpiry = undefined;
await user.save();
return res.status(200).json({ message: 'Password updated successfully' });
} catch (error) {
    console.log(error)
    res.status(500).json({message: "Server error"})
}
});

app.listen(PORT, () => {
    console.log(`Server is running on PORT: ${PORT}`)
})