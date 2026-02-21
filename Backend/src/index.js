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
app.use(express.static(path.join(_dirname, "/Frontend/dist"))); // This is middleware : Serve all static files inside this folder automatically
app.get((req ,res)=>{  // If user goes directly to frontend routes -> Server doesn’t know these routes (they are frontend routes) -> For any route not handled above → send index.html // Then React Router takes control.
    res.sendFile(path.resolve(_dirname, "Frontend","dist","index.html"));  // This handles React Router routes.
})



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



