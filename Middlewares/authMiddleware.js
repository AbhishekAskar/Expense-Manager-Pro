const jwt = require('jsonwebtoken');
const SECRET_KEY = "mellow234@*%Yellow";

const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(403).send('No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY); //decoded is basically a payload
        req.user = { id: decoded.userId };             //that's why we are doing decoded.userId to fetch the userId from the payload
        next();
    } catch (err) {
        return res.status(401).send('Invalid token');
    }
};

module.exports = authenticate;
