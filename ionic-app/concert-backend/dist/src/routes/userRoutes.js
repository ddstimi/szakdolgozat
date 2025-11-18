"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = __importDefault(require("../controllers/userController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const pictureController_1 = require("../controllers/pictureController");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});
const router = (0, express_1.Router)();
router.post('/register', userController_1.default.register);
router.post('/login', userController_1.default.login);
router.post('/google-auth', userController_1.default.googleAuth);
router.get('/profile-info', authMiddleware_1.authenticateJWT, userController_1.default.userProfile);
router.put('/update-profile', authMiddleware_1.authenticateJWT, userController_1.default.updateUser);
router.patch('/update-picture', authMiddleware_1.authenticateJWT, userController_1.default.updateUserPic);
router.patch('/update-static-picture', authMiddleware_1.authenticateJWT, userController_1.default.updateStaticPic);
router.post('/picture/upload', authMiddleware_1.authenticateJWT, upload.single('file'), pictureController_1.uploadProfileDirect);
router.put('/preferences', authMiddleware_1.authenticateJWT, userController_1.default.updateUser);
router.post('/refresh', userController_1.default.refreshSession);
router.patch('/attend_concert', authMiddleware_1.authenticateJWT, userController_1.default.attendConcert);
exports.default = router;
