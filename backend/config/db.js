const mongoose=require("mongoose");
async function connectDB(){try{await mongoose.connect(process.env.MONGO_URI);console.log("MongoDB connected")}catch(e){console.log("MongoDB connection failed:",e.message)}}
module.exports=connectDB;
