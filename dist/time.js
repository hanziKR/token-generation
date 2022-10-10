"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMinutes = exports.addHours = exports.addDays = exports.addMonths = void 0;
const addMonths = (months) => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date;
};
exports.addMonths = addMonths;
const addDays = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
};
exports.addDays = addDays;
const addHours = (hours) => {
    const date = new Date();
    date.setHours(date.getMonth() + hours);
    return date;
};
exports.addHours = addHours;
const addMinutes = (minutes) => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutes);
    return date;
};
exports.addMinutes = addMinutes;
