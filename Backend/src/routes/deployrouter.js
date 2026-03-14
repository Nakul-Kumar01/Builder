
const express = require('express');
const { deployWebsite } = require('../controler/Deploy');
const userMiddleware = require('../middleware/userMiddleware');

const deployRouter = express.Router();


deployRouter.post('/deploy',userMiddleware,deployWebsite);

module.exports = deployRouter;