const User = require('../models/user');
const validate = require('../utils/validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    validate(req.body);

    req.body.password = await bcrypt.hash(req.body.password, 10);

    const user = await User.create(req.body);

    const reply = {
      firstName: user.firstName,
      emailId: user.emailId,
      _id: user._id
    }

    const token = jwt.sign({ _id: user._id, emailId: user.emailId }, process.env.JWT_KEY, { expiresIn: '1h' });

    res.cookie('token', token, {
      maxAge: 60 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: "none"
    }); // you can also use expire 

    res.status(201).json({
      user: reply,
      message: "Login successful"
    });
  }
  catch (err) {
    // Duplicate email error
    if (err.code === 11000) {
      return res.status(409).send("Email already registered. Try a different email.");
    }
    console.error(err);
    res.status(400).send("Error: " + err); // 400 Bad Request
  }
}



const login = async (req, res) => {

  try {
    const { emailId, password } = req.body;

    if (!emailId || !password) {
      throw new Error('Invalid credentials');
    }

    const user = await User.findOne({ emailId });
    if (!user) {
      throw new Error('Invalid Credentials');
    }

    const match = await bcrypt.compare(password, user.password);


    if (!match) {
      throw new Error('Invalid Credentials');
    }

    const reply = {
      firstName: user.firstName,
      emailId: user.emailId,
      _id: user._id
    }

    const token = jwt.sign({ _id: user._id, emailId: req.body.emailId, role: user.role }, process.env.JWT_KEY, { expiresIn: '1h' });
    // console.log(token);
    res.cookie('token', token, {
      maxAge: 60 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: "none"
    });
    res.status(201).json({
      user: reply,
      message: "Login successful"
    });
  }
  catch (err) {
    res.status(401).send("Error: " + err);
  }
}



const logout = async (req, res) => {
  try {

    const { token } = req.cookies;

    const payload = jwt.decode(token);


    res.cookie("token", null, { expires: new Date(Date.now()) });
    res.status(200).send("Logged out successfully");
  }
  catch (err) {
    res.status(401).send("Error: " + err);
  }
}


module.exports = { register, login, logout };