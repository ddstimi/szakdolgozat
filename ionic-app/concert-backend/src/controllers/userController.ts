
import { Request, Response, NextFunction, RequestHandler } from 'express';
import UserService from '../services/userService';

class CustomError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, CustomError.prototype);
    }
}

const UserController = {
    register: (async (req: Request, res: Response, next: NextFunction) => {
        const { name, username, email, password, gdpr } = req.body;

        if (!name || !username || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }

        try {
            const userId = await UserService.registerUser({ name, username, email, password, gdpr });
            res.status(201).json({
                message: 'User registered successfully!',
                userId: userId
            });
        } catch (error: any) {
            if (error instanceof CustomError && error.statusCode) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            return next(error);
        }
    }) as RequestHandler,

    login: (async (req: Request, res: Response, next: NextFunction) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Please provide username and password.' });
        }

        try {
            const { user, token } = await UserService.loginUser(username, password);
                return res.status(200).json({
                message: 'Login successful!',
                user,
                token
            });
        } catch (error: any) {
            if (error instanceof CustomError && error.statusCode) {
                return res.status(error.statusCode).json({ message: error.message });
            }
    return next(error);
}

    }) as RequestHandler
};

export default UserController;
