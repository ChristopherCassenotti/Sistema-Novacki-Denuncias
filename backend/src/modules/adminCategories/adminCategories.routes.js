const express =
    require("express");

const {
    requireAdminAuth,
} = require(
    "../auth/auth.middleware"
);

const {
    requirePermissions,
} = require(
    "../access/access.middleware"
);

const {
    requireTrustedOrigin,
} = require(
    "../../middlewares/originProtection.middleware"
);

const {
    listHandler,
    getHandler,
    createHandler,
    updateHandler,
    statusHandler,
} = require(
    "./adminCategories.controller"
);


const router =
    express.Router();

router.use(
    requireAdminAuth
);


/*
 * Categorias não são sensíveis.
 *
 * Responsável RH pode consultar o
 * catálogo administrativo, inclusive
 * categorias inativas.
 */
router.get(
    "/",
    listHandler
);

router.get(
    "/:id",
    getHandler
);


/*
 * A partir daqui é alteração global.
 */
router.post(
    "/",
    requireTrustedOrigin,
    requirePermissions(
        "CATEGORY_MANAGE"
    ),
    createHandler
);

router.patch(
    "/:id",
    requireTrustedOrigin,
    requirePermissions(
        "CATEGORY_MANAGE"
    ),
    updateHandler
);

router.patch(
    "/:id/status",
    requireTrustedOrigin,
    requirePermissions(
        "CATEGORY_MANAGE"
    ),
    statusHandler
);


module.exports =
    router;