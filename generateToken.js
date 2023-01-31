const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');

dotenv.config();

const generateToken = (userId, email) => {
  const payload = {
    userId: userId,
    email: email,
  };
  const secret = `${process.env.JWT_SECRET}`
  const options = {
    expiresIn: "876000h",
  };
  return jwt.sign(payload, secret, options);
};

module.exports = generateToken