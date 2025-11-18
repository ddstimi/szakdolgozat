"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const concertController_1 = __importDefault(require("../controllers/concertController"));
const router = express_1.default.Router();
router.get('/top-picks', authMiddleware_1.authenticateJWT, concertController_1.default.getTopPicks);
router.get('/popular', concertController_1.default.getPopular);
router.get('/upcoming', concertController_1.default.getUpcoming);
router.get('/upcoming-by-user', authMiddleware_1.authenticateJWT, concertController_1.default.getUpcomingByUserId);
router.get('/past', authMiddleware_1.authenticateJWT, concertController_1.default.getPastByUserId);
exports.default = router;
