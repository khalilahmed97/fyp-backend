const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");


dotenv.config();
const connectionDB = require("./config/dbConfig.js");
const app = express();
const voterRoutes = require("./routers/Voter.js")
const candidateRoutes = require('./routers/Candidate.js')
const PORT = process.env.PORT;
// Middlewares
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({extended: false}))
app.use(cors({
// Allow all origins allow it
//all
  origin:"*",
  methods:["GET", "POST", "PUT", "PATCH", "DELETE"],

}));



// DATABASE CONNECTION
connectionDB.connect((err) => {
  if(err){
    console.log("ERROR OCCURED WHILE CONNECTING WITH DATABASE ",err)
  }
  console.log("DATABASE CONNECTED SUCCESSFULY! ")
})


// Routes

app.use("/api/voter/", voterRoutes)
app.use("/api/candidate/", candidateRoutes)


// Running Port

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
