const {
    safeExceptionLog,
} = require(
    "../../utils/safeLog"
);

const {
    categoryIdSchema,
    createCategorySchema,
    updateCategorySchema,
    categoryStatusSchema,
} = require(
    "./adminCategories.schema"
);

const {
    listCategories,
    getCategory,
    createCategory,
    updateCategory,
    changeCategoryStatus,
} = require(
    "./adminCategories.service"
);


function validationError(
    res,
    validation
) {
    return res
        .status(400)
        .json({
            message:
                "Dados inválidos.",

            errors:
                validation.error
                    .flatten(),
        });
}


function handleError(
    res,
    error
) {
    if (
        error.statusCode
    ) {
        return res
            .status(
                error.statusCode
            )
            .json({
                message:
                    error.message,
            });
    }

    safeExceptionLog(
        "admin_category",
        error
    );

    return res
        .status(500)
        .json({
            message:
                "Erro interno ao processar a categoria.",
        });
}


async function listHandler(
    req,
    res
) {
    try {
        return res.json({
            data:
                await listCategories(),
        });
    } catch (error) {
        return handleError(
            res,
            error
        );
    }
}


async function getHandler(
    req,
    res
) {
    const validation =
        categoryIdSchema.safeParse(
            req.params
        );

    if (
        !validation.success
    ) {
        return validationError(
            res,
            validation
        );
    }

    try {
        return res.json({
            data:
                await getCategory(
                    validation.data.id
                ),
        });
    } catch (error) {
        return handleError(
            res,
            error
        );
    }
}


async function createHandler(
    req,
    res
) {
    const validation =
        createCategorySchema.safeParse(
            req.body
        );

    if (
        !validation.success
    ) {
        return validationError(
            res,
            validation
        );
    }

    try {
        return res
            .status(201)
            .json({
                data:
                    await createCategory(
                        validation.data,
                        req.auth.userId
                    ),
            });
    } catch (error) {
        return handleError(
            res,
            error
        );
    }
}


async function updateHandler(
    req,
    res
) {
    const params =
        categoryIdSchema.safeParse(
            req.params
        );

    const body =
        updateCategorySchema.safeParse(
            req.body
        );

    if (
        !params.success
    ) {
        return validationError(
            res,
            params
        );
    }

    if (
        !body.success
    ) {
        return validationError(
            res,
            body
        );
    }

    try {
        return res.json({
            data:
                await updateCategory(
                    params.data.id,
                    body.data,
                    req.auth.userId
                ),
        });
    } catch (error) {
        return handleError(
            res,
            error
        );
    }
}


async function statusHandler(
    req,
    res
) {
    const params =
        categoryIdSchema.safeParse(
            req.params
        );

    const body =
        categoryStatusSchema.safeParse(
            req.body
        );

    if (
        !params.success
    ) {
        return validationError(
            res,
            params
        );
    }

    if (
        !body.success
    ) {
        return validationError(
            res,
            body
        );
    }

    try {
        return res.json({
            data:
                await changeCategoryStatus(
                    params.data.id,
                    body.data.isActive,
                    req.auth.userId
                ),
        });
    } catch (error) {
        return handleError(
            res,
            error
        );
    }
}


module.exports = {
    listHandler,
    getHandler,
    createHandler,
    updateHandler,
    statusHandler,
};