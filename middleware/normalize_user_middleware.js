export function normalizeUserMiddleware(req, res, next) {
  if (req.user && req.user.user) {
    req.user = req.user.user;
  }
  next();
}
