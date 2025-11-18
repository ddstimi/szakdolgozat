"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const preferencesController_1 = __importDefault(require("../controllers/preferencesController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get('/', authMiddleware_1.authenticateJWT, preferencesController_1.default.getPreferences);
router.patch('/update', authMiddleware_1.authenticateJWT, preferencesController_1.default.updatePreferences);
router.get('/options', authMiddleware_1.authenticateJWT, preferencesController_1.default.getAvailableOptions);
exports.default = router;
