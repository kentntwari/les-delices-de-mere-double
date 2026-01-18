import { z } from "zod";

export type TUserSchema = z.infer<typeof userSchema>;
export const userSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.string().min(1).optional(),
  permissions: z.string().array().optional(),
});

export type TCreateUserSchema = z.infer<typeof createUserSchema>;
export const createUserSchema = userSchema.omit({ id: true }).extend({
  id: z.string().optional(),
  permissions: z.string().array().optional(),
});

export type TMenuSchema = z.infer<typeof menuSchema>;
export const menuSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      title: z
        .string()
        .min(4, "An item element must be at least 4 characters long"),
      slug: z.string(),
      description: z.string().optional(),
      unitPrice: z.preprocess(
        (val) => (typeof val === "string" ? parseFloat(val) : val),
        z.number().min(1, "Unit price must be at least 1"),
      ),
    }),
  ),
});

export type TCreateItemSchema = z.infer<typeof createItemSchema>;
export const createItemSchema = menuSchema.shape.items.element
  .pick({
    title: true,
    unitPrice: true,
  })
  .extend({
    id: z
      .string()
      .min(1)
      .refine((val) => val.startsWith("MI"), {
        message: "ID cannot be empty and must start with 'MI'",
      })
      .optional(),
  });

export type TUpdateItemSchema = z.infer<typeof updateItemSchema>;
export const updateItemSchema = createItemSchema
  .omit({ id: true })
  .extend({
    id: z.string().min(1, "ID is required for updating an item"),
  })

export type TUpdateItemIntents = z.infer<typeof updateItemIntentsSchema>;
export const updateItemIntentsSchema = z.enum([
  "UPDATE_TITLE",
  "UPDATE_PRICING",
]);

export type TOrderSchema = z.infer<typeof orderSchema>;
export const orderSchema = z.object({
  id: z.string(),
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      unitPrice: z.number(),
      quantity: z.number(),
    }),
  ),
  total: z.string(),
});

export type TCreateOrderFormSchema = z.infer<typeof createOrderFormSchema>;
export const createOrderFormSchema = z.object({
  cx: z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    isSameAsWhatsapp: z.boolean().default(true),
    whatsappNumber: z
      .object({
        countryCode: z.string().min(1, "Country code is required"),
        number: z.string().min(7, "WhatsApp number must be at least 7 digits"),
      })
      .optional(),
  }),
  delivery: z.object({
    isRequired: z.boolean().default(false),
    minimumFee: z.number().min(10).default(10).optional(),
    address: z
      .object({
        isHomeAddress: z.boolean().default(true),
        street: z.string().min(1, "Street is required"),
        city: z.string().min(1, "City is required"),
        province: z.string().min(1, "Province is required"),
        postalCode: z.string().min(1, "Postal code is required"),
        country: z.literal("Canada"),
      })
      .nullish(),
  }),
  items: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().min(1, "Title is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        unitPrice: z.number().min(1, "Price must be at least 1"),
      }),
    )
    .length(1, "At least one item is required"),
});
