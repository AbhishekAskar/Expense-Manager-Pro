require('dotenv').config();
const User = require('../Models/userModel'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;

const addUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email }); 
        if (existingUser) {
            return res.status(400).send("User with the same Email Id already exists");
        }

        const saltround = 10;
        const hash = await bcrypt.hash(password, saltround);

        await User.create({ name, email, password: hash });
        res.status(201).json({ message: "User Created Successfully!", success: true });
    } catch (error) {
        console.log(error);
        res.status(500).send("Cannot create a user");
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }); 

        if (!user) {
            return res.status(401).send("Email Id does not exist, please go to the sign up page");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).send("Incorrect password!");
        }

        const token = jwt.sign({ userId: user._id }, SECRET_KEY);
        res.status(200).send({ token, message: "Login successful!", success: true });
    } catch (error) {
        console.log(error);
        res.status(500).send("Login failed");
    }
};

const getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ name: user.name, email: user.email, isPremium: user.isPremium });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    addUser,
    loginUser,
    getUserDetails
};
