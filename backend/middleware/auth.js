const jwt = require("jsonwebtoken");

const { cookieName, getJwtSecret } = require("../utils/session");

function requireAuth(req, res, next) {
  const token = req.cookies[cookieName];

  if (!token) {
    return res.status(401).json({ message: "Please log in to continue." });
  }

  try {
    req.user = jwt.verify(token, getJwtSecret());
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Your session has expired. Please log in again." });
  }
}

module.exports = {
  requireAuth
};
