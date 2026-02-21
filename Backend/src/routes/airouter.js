
const express = require('express');
const userMiddleware = require('../middleware/userMiddleware');
const { generateCode } = require('../controler/GenerateCode');

const aiRouter = express.Router();


aiRouter.post('/generate',userMiddleware,generateCode);



module.exports = aiRouter;