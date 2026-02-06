const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  req.user = req.session.user;
  return next();
};

module.exports = { requireAuth };
