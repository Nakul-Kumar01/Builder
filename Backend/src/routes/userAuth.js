
const express = require('express');
const { register, login, logout } = require('../controler/userAuthent');
const userMiddleware = require('../middleware/userMiddleware');

const authRouter = express.Router();

authRouter.post('/register',register);
authRouter.post('/login',login);
authRouter.post('/logout',userMiddleware,logout);
authRouter.get('/check',userMiddleware,(req,res)=>{

    const reply = {
        firstName: req.result.firstName,
        emailId: req.result.emailId,
        _id: req.result._id,
        createdAt: req.result.createdAt
    }

    res.status(200).json({
        user: reply,
        message: "valid user"
    })
})


module.exports = authRouter;