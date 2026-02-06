const requireRole = (allowedRoles = []) => (req, res, next) => {
  const user = req.session && req.session.user;
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (!roles.includes(user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }

  return next();
};

module.exports = { requireRole };
