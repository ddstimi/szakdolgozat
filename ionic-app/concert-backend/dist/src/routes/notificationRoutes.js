"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const notificationController_1 = __importDefault(require("../controllers/notificationController"));
const router = express_1.default.Router();
router.get('/', authMiddleware_1.authenticateJWT, notificationController_1.default.listForMe);
router.get('/unread-count', authMiddleware_1.authenticateJWT, notificationController_1.default.unreadCount);
router.patch('/:id/read', authMiddleware_1.authenticateJWT, notificationController_1.default.markRead);
router.post('/push-tokens', authMiddleware_1.authenticateJWT, notificationController_1.default.registerMyToken);
router.delete('/push-tokens/:token', authMiddleware_1.authenticateJWT, notificationController_1.default.revokeMyToken);
router.post('/', /* adminMiddleware?, */ notificationController_1.default.create);
router.post('/test-me', authMiddleware_1.authenticateJWT, notificationController_1.default.testMe);
exports.default = router;
