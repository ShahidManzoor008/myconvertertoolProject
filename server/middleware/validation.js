import { body, query, param, validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';

export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg
    }));

    return next(new AppError('Validation Error', 400, extractedErrors));
  };
};

export const authValidation = {
  register: [
    body('name')
      .trim()
      .isLength({ min: 2 })
      .withMessage('Name must be at least 2 characters long'),
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).*$/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  ],
  login: [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
};

export const blogValidation = {
  createPost: [
    body('title')
      .trim()
      .isLength({ min: 5 })
      .withMessage('Title must be at least 5 characters long'),
    body('content')
      .trim()
      .isLength({ min: 50 })
      .withMessage('Content must be at least 50 characters long'),
    body('excerpt')
      .trim()
      .isLength({ min: 10, max: 200 })
      .withMessage('Excerpt must be between 10 and 200 characters'),
    body('tags')
      .isArray()
      .withMessage('Tags must be an array'),
  ],
  getPost: [
    param('slug')
      .trim()
      .notEmpty()
      .withMessage('Slug is required'),
  ],
  getPosts: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ],
};

export const fileValidation = {
  uploadFile: [
    body('type')
      .optional()
      .isIn(['pdf', 'image', 'document'])
      .withMessage('Invalid file type'),
  ],
  convertFile: [
    body('targetFormat')
      .notEmpty()
      .isIn(['pdf', 'docx', 'txt'])
      .withMessage('Invalid target format'),
  ],
};