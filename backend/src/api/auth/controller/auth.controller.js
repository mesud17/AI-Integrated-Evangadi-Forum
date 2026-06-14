import { StatusCodes } from 'http-status-codes';
import {
  registerService,
  loginService,
  confirmEmailService,
  forgotPasswordService,
  resetPasswordService,
} from '../service/auth.service.js';

/**
 * Handles user registration requests.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const registerController = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const registerResult = await registerService({
      firstName,
      lastName,
      email,
      password,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: registerResult.confirmationMessage,
      welcomeMessage: registerResult.welcomeMessage,
      user: registerResult.user,
      confirmationToken: registerResult.confirmationToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles user login requests.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const authResult = await loginService({ email, password });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Login successful.',
      user: authResult.user,
      token: authResult.token,
    });
  } catch (error) {
    next(error);
  }
};

export const confirmEmailController = async (req, res, next) => {
  try {
    const { token } = req.body;
    const result = await confirmEmailService({ token });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Email confirmed successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPasswordController = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await forgotPasswordService({ email });

    res.status(StatusCodes.OK).json({
      success: true,
      message:
        'If an account exists for this email, password recovery instructions were generated.',
      resetToken: result.resetToken,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPasswordController = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const result = await resetPasswordService({ token, newPassword });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Password reset successful. You can now sign in with your new password.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
