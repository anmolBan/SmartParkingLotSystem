import zod from "zod";

export const adminSignInSchema = zod.object({
    email: zod.string().email(),
    password: zod.string().min(8).max(128)
});
