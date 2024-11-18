import jwt from "jsonwebtoken";

export const generateAccessToken = (user) => {
  if (user.role == "user") {
    return jwt.sign(user, process.env.JWT_ACCESS_KEY, {
      expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION,
    });
  }
  return jwt.sign(user, process.env.JWT_ACCESS_KEY, {
    expiresIn: process.env.ADMIN_ACCESS_TOKEN_EXPIRATION,
  });
};

export const generateRefreshToken = (user) => {
  if (user.role == "user") {
    return jwt.sign(user, process.env.JWT_REFRESH_KEY, {
      expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION,
    });
  }
  return jwt.sign(user, process.env.JWT_REFRESH_KEY, {
    expiresIn: process.env.ADMIN_REFRESH_TOKEN_EXPIRATION,
  });
};
