import * as z from "zod";

// Example: Basic string validation (non-empty)
export const requiredString = z.string().min(1, "This field is required");

// Example: Email validation
export const emailValidator = z.string().email("Invalid email address");

// Example: Password validation (e.g., min length)
export const passwordValidator = z.string().min(8, "Password must be at least 8 characters long");

// Example: Number validation (positive integer)
export const positiveInteger = z.number().int().positive("Must be a positive integer");

// Example: URL validation
export const urlValidator = z.string().url("Invalid URL format");

// Add more custom validation schemas as needed for the application
// e.g., specific formats, lengths, combinations, etc. 