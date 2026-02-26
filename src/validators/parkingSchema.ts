import zod from "zod";

export const createParkingLotSchema = zod.object({
    name: zod.string().min(1).max(255),
    location: zod.string().min(1).max(255),
    floors: zod.number().int().positive(),
    spotsPerFloor: zod.number().int().positive(),
});