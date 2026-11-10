const {
    randomUUID,
} = require("node:crypto");

const prisma =
    require(
        "../../database/prisma"
    );

const {
    assertAdminMaster,
} = require(
    "../access/unitScope.service"
);

const {
    createScopedAuditLog,
} = require(
    "../adminAuditLogs/auditScope.service"
);


function serviceError(
    message,
    statusCode
) {
    const error =
        new Error(message);

    error.statusCode =
        statusCode;

    return error;
}


function normalizeCode(
    value
) {
    return value
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toUpperCase()
        .replace(
            /[^A-Z0-9]+/g,
            "_"
        )
        .replace(
            /^_+|_+$/g,
            ""
        )
        .slice(
            0,
            80
        );
}


function serializeCategory(
    category
) {
    return {
        id:
            category.id,

        code:
            category.code,

        name:
            category.name,

        description:
            category.description,

        defaultPriority:
            category.default_priority,

        isActive:
            category.is_active,

        createdAt:
            category.created_at,

        updatedAt:
            category.updated_at,
    };
}


async function findCategoryOrFail(
    id,
    database = prisma
) {
    const category =
        await database
            .report_categories
            .findUnique({
                where: {
                    id,
                },
            });

    if (!category) {
        throw serviceError(
            "Categoria não encontrada.",
            404
        );
    }

    return category;
}


async function assertNameAvailable(
    database,
    name,
    excludeId = null
) {
    const existing =
        await database
            .report_categories
            .findFirst({
                where: {
                    name,

                    ...(excludeId
                        ? {
                            id: {
                                not:
                                    excludeId,
                            },
                        }
                        : {}),
                },

                select: {
                    id:
                        true,
                },
            });

    if (existing) {
        throw serviceError(
            "Já existe uma categoria com este nome.",
            409
        );
    }
}


async function assertCodeAvailable(
    database,
    code,
    excludeId = null
) {
    const existing =
        await database
            .report_categories
            .findFirst({
                where: {
                    code,

                    ...(excludeId
                        ? {
                            id: {
                                not:
                                    excludeId,
                            },
                        }
                        : {}),
                },

                select: {
                    id:
                        true,
                },
            });

    if (existing) {
        throw serviceError(
            "Já existe uma categoria com este código.",
            409
        );
    }
}


async function listCategories() {
    const categories =
        await prisma
            .report_categories
            .findMany({
                orderBy: [
                    {
                        is_active:
                            "desc",
                    },
                    {
                        name:
                            "asc",
                    },
                ],
            });

    return categories.map(
        serializeCategory
    );
}


async function getCategory(
    id
) {
    return serializeCategory(
        await findCategoryOrFail(
            id
        )
    );
}


async function createCategory(
    data,
    actorUserId
) {
    /*
     * Mesmo que alguém obtenha
     * CATEGORY_MANAGE por engano,
     * somente ADMIN_MASTER altera
     * categorias globais.
     */
    await assertAdminMaster(
        actorUserId
    );

    const code =
        normalizeCode(
            data.code ||
            data.name
        );

    if (!code) {
        throw serviceError(
            "Não foi possível gerar o código da categoria.",
            400
        );
    }

    const created =
        await prisma.$transaction(
            async (tx) => {
                await assertNameAvailable(
                    tx,
                    data.name
                );

                await assertCodeAvailable(
                    tx,
                    code
                );

                const category =
                    await tx
                        .report_categories
                        .create({
                            data: {
                                id:
                                    randomUUID(),

                                code,

                                name:
                                    data.name,

                                description:
                                    data.description ||
                                    null,

                                default_priority:
                                    "NORMAL",

                                default_team_id:
                                    null,

                                is_active:
                                    true,
                            },
                        });

                /*
                 * Categoria é global.
                 * Não passamos unitIds.
                 * Assim o log permanece
                 * global/master-only.
                 */
                await createScopedAuditLog(
                    tx,
                    {
                        actor_type:
                            "ADMIN",

                        actor_user_id:
                            actorUserId,

                        action:
                            "CATEGORY_CREATED",

                        entity_type:
                            "CATEGORY",

                        entity_id:
                            category.id,

                        success:
                            true,

                        request_id:
                            randomUUID(),

                        metadata_json:
                            JSON.stringify({
                                code:
                                    category.code,

                                name:
                                    category.name,

                                isActive:
                                    true,
                            }),
                    }
                );

                return category;
            }
        );

    return serializeCategory(
        created
    );
}


async function updateCategory(
    id,
    patch,
    actorUserId
) {
    await assertAdminMaster(
        actorUserId
    );

    const updated =
        await prisma.$transaction(
            async (tx) => {
                const current =
                    await findCategoryOrFail(
                        id,
                        tx
                    );

                const nextName =
                    patch.name ??
                    current.name;

                const nextCode =
                    patch.code !==
                    undefined
                        ? normalizeCode(
                            patch.code
                        )
                        : current.code;

                if (!nextCode) {
                    throw serviceError(
                        "Código da categoria inválido.",
                        400
                    );
                }

                if (
                    patch.name !==
                    undefined &&
                    patch.name !==
                    current.name
                ) {
                    await assertNameAvailable(
                        tx,
                        patch.name,
                        id
                    );
                }

                if (
                    nextCode !==
                    current.code
                ) {
                    await assertCodeAvailable(
                        tx,
                        nextCode,
                        id
                    );
                }

                const category =
                    await tx
                        .report_categories
                        .update({
                            where: {
                                id,
                            },

                            data: {
                                name:
                                    nextName,

                                code:
                                    nextCode,

                                ...(patch.description !==
                                undefined
                                    ? {
                                        description:
                                            patch.description ||
                                            null,
                                    }
                                    : {}),

                                updated_at:
                                    new Date(),
                            },
                        });

                await createScopedAuditLog(
                    tx,
                    {
                        actor_type:
                            "ADMIN",

                        actor_user_id:
                            actorUserId,

                        action:
                            "CATEGORY_UPDATED",

                        entity_type:
                            "CATEGORY",

                        entity_id:
                            id,

                        success:
                            true,

                        request_id:
                            randomUUID(),

                        metadata_json:
                            JSON.stringify({
                                previousName:
                                    current.name,

                                currentName:
                                    category.name,

                                previousCode:
                                    current.code,

                                currentCode:
                                    category.code,

                                descriptionChanged:
                                    current.description !==
                                    category.description,
                            }),
                    }
                );

                return category;
            }
        );

    return serializeCategory(
        updated
    );
}


async function changeCategoryStatus(
    id,
    isActive,
    actorUserId
) {
    await assertAdminMaster(
        actorUserId
    );

    const updated =
        await prisma.$transaction(
            async (tx) => {
                const current =
                    await findCategoryOrFail(
                        id,
                        tx
                    );

                if (
                    current.is_active ===
                    isActive
                ) {
                    return current;
                }

                const category =
                    await tx
                        .report_categories
                        .update({
                            where: {
                                id,
                            },

                            data: {
                                is_active:
                                    isActive,

                                updated_at:
                                    new Date(),
                            },
                        });

                await createScopedAuditLog(
                    tx,
                    {
                        actor_type:
                            "ADMIN",

                        actor_user_id:
                            actorUserId,

                        action:
                            isActive
                                ? "CATEGORY_ACTIVATED"
                                : "CATEGORY_DEACTIVATED",

                        entity_type:
                            "CATEGORY",

                        entity_id:
                            id,

                        success:
                            true,

                        request_id:
                            randomUUID(),

                        metadata_json:
                            JSON.stringify({
                                isActive,
                            }),
                    }
                );

                return category;
            }
        );

    return serializeCategory(
        updated
    );
}


module.exports = {
    listCategories,
    getCategory,
    createCategory,
    updateCategory,
    changeCategoryStatus,
};