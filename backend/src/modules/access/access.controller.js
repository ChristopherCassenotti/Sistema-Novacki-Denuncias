const {
  safeExceptionLog,
} = require(
  "../../utils/safeLog"
);

const {
  getUserAccessContext,
} = require(
  "./access.service"
);


async function getMyAccess(
  req,
  res
) {
  try {
    const accessContext =
      await getUserAccessContext(
        req.auth.userId
      );

    return res
      .status(200)
      .json({
        data: {
          /*
           * Colocamos units dentro de user
           * porque é daí que o frontend
           * obtém o escopo regional.
           */
          user: {
            ...req.auth.user,

            units:
              accessContext.units,
          },

          roles:
            accessContext.roles,

          permissions:
            accessContext.permissions,

          /*
           * Também mantemos no nível do
           * contexto para compatibilidade.
           */
          units:
            accessContext.units,
        },
      });
  } catch (error) {
    safeExceptionLog(
      "admin_access_context",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Não foi possível consultar os perfis e permissões.",
      });
  }
}


module.exports = {
  getMyAccess,
};