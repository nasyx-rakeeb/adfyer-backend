const mongoose = require('mongoose')
const dotenv = require("dotenv")

dotenv.config()

function connectDB () {
    mongoose.set('strictQuery', true);
    const url = `${process.env.MONGO_URI}`
    mongoose.connect(url, {})
    .then(() => {
        console.log('Connected to database ')
    })
    .catch((err) => {
        console.error(`${err}`);
    })
}

module.exports = connectDB