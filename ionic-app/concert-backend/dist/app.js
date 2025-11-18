"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./src/config/db"));
const userRoutes_1 = __importDefault(require("./src/routes/userRoutes"));
const multer = require('multer');
const path = require('path');
const preferencesRoutes_1 = __importDefault(require("./src/routes/preferencesRoutes"));
const eventStatisticsRoutes_1 = __importDefault(require("./src/routes/eventStatisticsRoutes"));
const concertRoutes_1 = __importDefault(require("./src/routes/concertRoutes"));
const notificationRoutes_1 = __importDefault(require("./src/routes/notificationRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use('/assets', express_1.default.static(path.join(__dirname, 'assets')));
app.use('/profile-pictures', express_1.default.static(path.join(__dirname, 'assets/profile-pictures')));
const port = process.env['PORT'] || 3000;
app.use('/uploads', express_1.default.static('uploads'));
app.use(express_1.default.json());
app.use((0, cors_1.default)());
db_1.default.getConnection()
    .then((connection) => {
    console.log('Successfully connected to MySQL database!');
    connection.release();
})
    .catch((err) => {
    console.error('Error connecting to MySQL database:', err.message);
    process.exit(1);
});
app.use(express_1.default.json({ limit: '10mb' })); // or '10mb' if needed
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
app.get('/', (req, res) => {
    res.send('Welcome to the User Management API!');
});
app.use('/api/preferences', preferencesRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/event-statistics', eventStatisticsRoutes_1.default);
app.use('/api/concerts', concertRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message });
});
app.listen(3000, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
});
