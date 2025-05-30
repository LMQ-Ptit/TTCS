// key noi ket noi voi database
const mongoose = require('mongoose')
module.exports.connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log("Connect to database successfully")
    } catch (error) {
        console.log("Connect to database failed")
    }
}