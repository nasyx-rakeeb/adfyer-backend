const jwt = require("jsonwebtoken")
const dotenv = require('dotenv');

dotenv.config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const secret = `${process.env.JWT_SECRET}`;
  if (!authHeader) {
    return res.status(401).json({msg: "unauthorized"});
  }
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, secret);
    console.log(decoded)
    req.user = decoded.subject;
    next();
  } catch (err) {
      console.log(err)
    return res.status(400).send({msg: "unauthorized..."});
  }
}

module.exports = verifyToken