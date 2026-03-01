import zod from "zod";
import { SpotType } from "../generated/prisma/enums.js";

export const createParkingLotSchema = zod.object({
    name: zod.string().min(1).max(255),
    location: zod.string().min(1).max(255),
    floorsReservedForTrucks: zod.number().int().min(0).default(0),
    spotsPerFloorReservedForTrucks: zod.number().int().min(0).default(0),
    floorsReservedForBikes: zod.number().int().min(0).default(0),
    spotsPerFloorReservedForBikes: zod.number().int().min(0).default(0),
    floorsReservedForCompact: zod.number().int().min(0).default(0),
    spotsPerFloorReservedForCompact: zod.number().int().min(0).default(0),
});

export type CreateParkingLotInput = zod.infer<typeof createParkingLotSchema>;

const spotTypeValues = Object.values(SpotType) as [SpotType, ...SpotType[]];

export const vehicleCheckInSchema = zod.object({
    licensePlate: zod.string().min(1).max(20),
    vehicleType: zod.enum(spotTypeValues),
});

export type VehicleCheckInInput = zod.infer<typeof vehicleCheckInSchema>;

export const vehicleCheckOutSchema = zod.object({
    licensePlate: zod.string().min(1).max(20),
});

export type VehicleCheckOutInput = zod.infer<typeof vehicleCheckOutSchema>;