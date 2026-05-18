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
export const updateItemSchema = createItemSchema.omit({ id: true }).extend({
  id: z.string().min(1, "ID is required for updating an item"),
});

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

const digitsOnly = (val: string) => val.replace(/\D/g, "");
export const phoneNumberSchema = z.object({
  countryCode: z
    .string({ required_error: "Country code is required" })
    .min(1, "Country code is required")
    .transform(digitsOnly)
    .pipe(z.string().regex(/^[1-9]\d{0,2}$/, "Invalid country code"))
    .default("1"),

  number: z
    .string({ required_error: "Phone number is required" })
    .min(1, "Phone number is required")
    .transform(digitsOnly)
    .pipe(z.string().regex(/^\d{7,15}$/, "Phone number must be 7-15 digits")),
});

export type TAddressSchema = z.infer<typeof addressSchema>;
export const addressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  postalCode: z
    .string()
    .min(1, "Postal code is required")
    .transform((val) => val.toUpperCase().replace(/\s/g, ""))
    .pipe(
      z
        .string()
        .regex(
          /^[A-Z]\d[A-Z]\d[A-Z]\d$/,
          "Postal code is not valid. Format should be A1A1A1",
        ),
    )
    .transform((val) => `${val.slice(0, 3)} ${val.slice(3)}`),
  country: z.literal("Canada"),
});

export type TCreateOrderFormSchema = z.infer<typeof createOrderFormSchema>;
export const createOrderFormSchema = z.object({
  cx: z.object({
    id: z.string().nullable(),
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address").optional(),
    phone: phoneNumberSchema,
    isSameAsWhatsapp: z.boolean().default(true),
    whatsappNumber: phoneNumberSchema.optional(),
  }),
  delivery: z.object({
    isRequired: z.boolean().default(false),
    minimumFee: z
      .union([
        z
          .string()
          .refine(
            (val) => {
              const num = parseFloat(val);
              return !isNaN(num) && isFinite(num);
            },
            { message: "Minimum fee must be a valid numeric value" },
          )
          .transform((val) => parseFloat(val))
          .pipe(z.number().min(10, "Minimum fee must be at least 10")),
        z.number().min(10, "Minimum fee must be at least 10"),
        z.null(),
      ])
      .default(null),
    address: addressSchema
      .extend({
        isHomeAddress: z.boolean().default(true),
      })
      .nullish(),
  }),
  items: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().min(1, "Item title is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        unitPrice: z.number().min(1, "Price must be at least 1"),
      }),
    )
    .min(1, "At least one item is required")
    .max(7, "You can only add up to 7 items per order"),
});

export type TUpdateOrderFormSchema = z.infer<typeof updateOrderFormSchema>;
export const updateOrderFormSchema = z.object({
  id: z.string().min(1, "Order ID is required"),
  items: z.object({
    current: createOrderFormSchema.shape.items.min(0),
    removed: z.array(z.string()),
    added: createOrderFormSchema.shape.items.min(0),
  }),
  delivery: createOrderFormSchema.shape.delivery
    .omit({ address: true, minimumFee: true })
    .extend({
      address: addressSchema.nullish(),
    }),
});

export type TCustomerSchema = z.infer<typeof customerSchema>;
export const customerSchema = z.object({
  id: z.string().min(1),
  fullName: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: phoneNumberSchema,
  whatsappNumber: phoneNumberSchema.optional(),
  address: addressSchema.optional(),
});

export const deliveryDetailsSchema = z.object({
  order: z.object({
    id: z.string().min(1),
  }),
});

export type THandleOrderIntentsSchema = z.infer<
  typeof handleOrderIntentsSchema
>;
export const handleOrderIntentsSchema = z.enum([
  "get-comments",
  "get-logs",
  "get-order-customer",
  "get-order-count-metadata",
  "get-order-delivery-details",
  "mark-as-paid",
  "mark-as-unpaid",
  "mark-as-not-started",
  "mark-as-in-progress",
  "mark-as-completed",
  "mark-as-cancelled",
  "update-order",
]);
