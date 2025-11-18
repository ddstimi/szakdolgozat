"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Concerts_1 = __importDefault(require("../models/Concerts"));
const ConcertService = {
    getTopPicks: async (userId) => {
        return await Concerts_1.default.getTopPicks(userId);
    },
    getNearMe: async () => {
        return await Concerts_1.default.getPopular();
    },
    getUpcoming: async () => {
        return await Concerts_1.default.getUpcoming();
    },
    getUpcomingByUserId: async (userId) => {
        return await Concerts_1.default.getUpcomingByUserId(userId);
    },
    getPastByUserId: async (userId) => {
        return await Concerts_1.default.getPastByUserId(userId);
    },
};
exports.default = ConcertService;
