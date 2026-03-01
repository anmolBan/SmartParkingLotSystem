import { check } from "zod";
import { SpotType } from "../generated/prisma/enums.js";

export const HOURLY_RATES: Record<SpotType, number> = {
    COMPACT: 50, // 50 rupees per hour for compact cars
    LARGE: 200,   // 200 rupees per hour for large vehicles
    BIKE: 30     // 30 rupees per hour for bikes
};

export function getHourlyRate(spotType: SpotType): number {
    return HOURLY_RATES[spotType];
}

export function calculateParkingDuration(checkInTime: Date, checkOutTime: Date): number {
    const durationInMs = checkOutTime.getTime() - checkInTime.getTime();
    const durationInHours = Math.ceil(durationInMs / (1000 * 60 * 60)); // Round up to the nearest hour
    return durationInHours;
}

export function calculateParkingFee(checkInTime: Date, checkOutTime: Date, vehicleType: SpotType): { parkingFee: number; durationInHours: number; ratePerHour: number } {
    const durationInHours = calculateParkingDuration(checkInTime, checkOutTime);
    const ratePerHour = getHourlyRate(vehicleType);
    const parkingFee = durationInHours * ratePerHour;
    return {parkingFee, durationInHours, ratePerHour};
}