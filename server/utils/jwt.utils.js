import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT for the given user id.
 * @param {string} id - MongoDB ObjectId as string
 * @returns {string} signed token
 */
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};
