// Initialisation
const express = require("express");
const app = express();


// requirement
const cors = require("cors");
const cookieParser = require('cookie-parser')
const authRouter = require("./routes/userAuth");
const main = require("./config/db");
const aiRouter = require("./routes/airouter");
const deployRouter = require("./routes/deployrouter");
require("dotenv").config();
const path = require('path');
const _dirname = path.resolve();


app.use(cors({
    origin : "https://webbuilder-0f19.onrender.com",
    credentials: true 
}))
app.use(express.json());
app.use(cookieParser());



// routes
app.use('/user',authRouter);
app.use('/ai', aiRouter);
app.use('/vercel',deployRouter);



// serving Frontend
app.use(express.static(path.join(_dirname, "Frontend", "dist")));

app.use((req, res) => {
    res.sendFile(path.join(_dirname, "Frontend", "dist", "index.html"));
});



// start Listening
const InitializeConnection = async () => {
    try {

        await main();
        console.log("Connected to DB");

        app.listen(process.env.PORT, () => {
            console.log("server is Listening on port " + process.env.PORT);
        })
    }
    catch (err) {
        console.error("Error: " + err);
    }
}

InitializeConnection();



