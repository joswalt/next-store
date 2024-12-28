import { z } from "zod";
import { formatNumberWithDecimal } from "./utils";

const currency = z
  .string()
  .refine(
    (value) => /^\d+(\.\d{2})?$/.test(formatNumberWithDecimal(Number(value))),
    "Must be a valid number with up to 2 decimal places"
  );

// Schema for inserting products
export const insertProductSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(255, "Name must be less than 255 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(255, "Slug must be less than 255 characters"),
  category: z
    .string()
    .min(3, "Category must be at least 3 characters")
    .max(255, "Category must be less than 255 characters"),
  brand: z
    .string()
    .min(3, "Brand must be at least 3 characters")
    .max(255, "Brand must be less than 255 characters"),
  description: z
    .string()
    .min(3, "Description must be at least 3 characters")
    .max(255, "Description must be less than 255 characters"),
  stock: z.coerce.number().min(0, "Stock must be greater than 0"),
  images: z.array(z.string()).min(1, "At least one image is required"),
  price: currency,
  isFeatured: z.boolean().default(false),
  banner: z.string().nullable(),
});
