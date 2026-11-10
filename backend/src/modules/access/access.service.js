const prisma =
  require("../../database/prisma");


async function getUserUnits(
  userId
) {
  const assignments =
    await prisma.user_units.findMany({
      where: {
        user_id:
          userId,
      },

      select: {
        units: {
          select: {
            id:
              true,

            code:
              true,

            name:
              true,

            type:
              true,

            is_active:
              true,
          },
        },
      },

      orderBy: {
        created_at:
          "asc",
      },
    });

  return assignments.map(
    (assignment) => ({
      id:
        assignment.units.id,

      code:
        assignment.units.code,

      name:
        assignment.units.name,

      type:
        assignment.units.type,

      isActive:
        assignment.units.is_active,
    })
  );
}


async function getUserAccessContext(
  userId
) {
  /*
   * As unidades fazem parte do contexto
   * de acesso do usuário e precisam ser
   * retornadas mesmo que não existam
   * permissões/roles.
   */
  const unitsPromise =
    getUserUnits(
      userId
    );

  const userRoleAssignments =
    await prisma.user_roles.findMany({
      where: {
        user_id:
          userId,
      },

      select: {
        role_id:
          true,
      },
    });

  if (
    userRoleAssignments.length ===
    0
  ) {
    return {
      roles: [],
      permissions: [],
      units:
        await unitsPromise,
    };
  }

  const assignedRoleIds =
    userRoleAssignments.map(
      (assignment) =>
        assignment.role_id
    );

  const roles =
    await prisma.roles.findMany({
      where: {
        id: {
          in:
            assignedRoleIds,
        },

        is_active:
          true,
      },

      select: {
        id:
          true,

        code:
          true,

        name:
          true,

        description:
          true,

        is_system:
          true,
      },

      orderBy: {
        name:
          "asc",
      },
    });

  if (
    roles.length ===
    0
  ) {
    return {
      roles: [],
      permissions: [],
      units:
        await unitsPromise,
    };
  }

  const activeRoleIds =
    roles.map(
      (role) =>
        role.id
    );

  const rolePermissionAssignments =
    await prisma
      .role_permissions
      .findMany({
        where: {
          role_id: {
            in:
              activeRoleIds,
          },
        },

        select: {
          permission_id:
            true,
        },
      });

  const permissionIds = [
    ...new Set(
      rolePermissionAssignments.map(
        (assignment) =>
          assignment.permission_id
      )
    ),
  ];

  const permissions =
    permissionIds.length
      ? await prisma
          .permissions
          .findMany({
            where: {
              id: {
                in:
                  permissionIds,
              },
            },

            select: {
              id:
                true,

              code:
                true,

              description:
                true,
            },

            orderBy: {
              code:
                "asc",
            },
          })
      : [];

  return {
    roles,
    permissions,
    units:
      await unitsPromise,
  };
}


module.exports = {
  getUserAccessContext,
};