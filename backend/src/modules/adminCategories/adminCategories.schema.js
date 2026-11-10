const { z } = require("zod");

const categoryIdSchema =
    z.object({
        id: z
            .string()
            .uuid(),
    });

const createCategorySchema =
    z.object({
        name: z
            .string()
            .trim()
            .min(
                2,
                "Informe o nome da categoria."
            )
            .max(150),

        code: z
            .string()
            .trim()
            .min(2)
            .max(80)
            .optional(),

        description: z
            .string()
            .trim()
            .max(500)
            .optional()
            .nullable(),
    });

const updateCategorySchema =
    z.object({
        name: z
            .string()
            .trim()
            .min(
                2,
                "Informe o nome da categoria."
            )
            .max(150)
            .optional(),

        code: z
            .string()
            .trim()
            .min(2)
            .max(80)
            .optional(),

        description: z
            .string()
            .trim()
            .max(500)
            .optional()
            .nullable(),
    })
    .refine(
        (data) =>
            Object.keys(data)
                .length > 0,
        {
            message:
                "Informe pelo menos um campo.",
        }
    );

const categoryStatusSchema =
    z.object({
        isActive:
            z.boolean(),
    });

module.exports = {
    categoryIdSchema,
    createCategorySchema,
    updateCategorySchema,
    categoryStatusSchema,
};