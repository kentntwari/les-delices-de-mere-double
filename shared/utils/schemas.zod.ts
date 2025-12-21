import { z } from "zod";

export type TCreateUserSchema = z.infer<typeof createUserSchema>;
export const createUserSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  permissions: z.string().array().optional(),
});
