const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetToken: {
    type: String,
  },
  resetTokenExpiry: {
    type: Date,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('user', UserSchema);

module.exports = User;
