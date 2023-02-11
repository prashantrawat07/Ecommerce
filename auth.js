const jwt = require('jsonwebtoken');
var { expressjwt: jwtt } = require("express-jwt");
process.env.JWT_SECRET="prashant"
module.exports = {
  checkToken: (req, res, next) => {
    console.log(req)
    const bearerHeader = req.headers['authorization'];
     console.log(bearerHeader)
    if (typeof bearerHeader !== 'undefined') {
      const bearer = bearerHeader.split(' ');
      const bearerToken = bearer[1];
      req.token = bearerToken;
      next();
    } else {
      return res.status(401).json({ message: 'Token not provided' });
    }
  }
};

exports.requireSignin = jwtt({
  secret: process.env.JWT_SECRET, // req.user
  algorithms: ["sha1", "RS256", "HS256"],
});