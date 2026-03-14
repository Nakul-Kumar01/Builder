
const User = require("../models/user");
const jwt = require('jsonwebtoken');

const userMiddleware = async (req, res, next) => {

    try {
        const { token } = req.cookies;

        if (!token) throw new Error('No token provided');
        const payload = jwt.verify(token, process.env.JWT_KEY);

        const { _id } = payload;

        if (!_id) throw new Error('Invalid token');

        const user = await User.findById(_id);

        if (!user) throw new Error('User not found');
        
        req.result = user;

        // console.log("yes")
        next(); // next vale pe chale jao
    }
    catch (err) {
        return res.status(401).send("Unauthorized: " + err.message);
    }
}

module.exports = userMiddleware;