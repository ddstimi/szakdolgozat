"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Concerts_1 = __importDefault(require("../models/Concerts"));
const concertController = {
    getTopPicks: async (req, res) => {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const userId = req.user.id;
            const topPicks = await Concerts_1.default.getTopPicks(userId);
            res.status(200).json({ success: true, data: topPicks });
        }
        catch (err) {
            console.error(err);
            res
                .status(500)
                .json({ success: false, message: 'Failed to fetch top picks' });
        }
    },
    getPopular: async (req, res) => {
        try {
            const concerts = await Concerts_1.default.getPopular();
            res.status(200).json({ success: true, data: concerts });
        }
        catch (err) {
            console.error(err);
            res
                .status(500)
                .json({ success: false, message: 'Failed to fetch popular concerts' });
        }
    },
    getUpcoming: async (req, res) => {
        try {
            const concerts = await Concerts_1.default.getUpcoming();
            res.status(200).json({ success: true, data: concerts });
        }
        catch (err) {
            console.error(err);
            res
                .status(500)
                .json({ success: false, message: 'Failed to fetch upcoming concerts' });
        }
    },
    getUpcomingByUserId: async (req, res) => {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const userId = req.user.id;
            const concerts = await Concerts_1.default.getUpcomingByUserId(userId);
            res.status(200).json({ success: true, data: concerts });
        }
        catch (err) {
            console.error(err);
            res
                .status(500)
                .json({ success: false, message: 'Failed to fetch top picks' });
        }
    },
    getPastByUserId: async (req, res) => {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const userId = req.user.id;
            const concerts = await Concerts_1.default.getPastByUserId(userId);
            res.status(200).json({ success: true, data: concerts });
        }
        catch (err) {
            console.error(err);
            res
                .status(500)
                .json({ success: false, message: 'Failed to fetch top picks' });
        }
    },
};
exports.default = concertController;
