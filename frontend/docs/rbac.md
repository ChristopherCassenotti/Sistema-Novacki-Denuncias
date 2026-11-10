# Autorização do frontend

Menus, guards de rotas e ações usam as permissões efetivas de
`GET /api/admin/access/me`. A política compartilhada está em
`src/utils/authorization.ts`. Nenhum perfil, incluindo `ADMIN_MASTER`,
substitui uma permissão ausente. Se o contexto de acesso falhar e a sessão
for recuperada por `/me`, a lista vazia de permissões mantém as áreas restritas
bloqueadas; a página inicial leva ao perfil, sem um ciclo de redirecionamento.

Os códigos conhecidos são `ADMIN_TECHNICAL`, `TRIAGE`, `INVESTIGATOR`,
`MANAGER`, `AUDITOR` e `ADMIN_MASTER`. Não há conversão de nomes de exibição
ou dos antigos perfis RH em privilégios. Perfis personalizados funcionam
pelas mesmas permissões efetivas.

## Contrato verificado e limitações

Verificação somente de leitura em 27/10/2026 na cópia local da API,
`../Novacki Denuncias` (não foi feita validação autenticada em produção):

- `src/modules/adminDashboard/adminDashboard.routes.js:15` exige
  `REPORT_DASHBOARD_VIEW`. O middleware `access.middleware.js` exige a
  permissão literalmente e não tem bypass por perfil.
- `prisma/seed.js` cadastra `REPORT_STATS_VIEW`, mas não cadastra
  `REPORT_DASHBOARD_VIEW`. São códigos diferentes: não é seguro tratar um
  como equivalente ao outro. O frontend mantém a exigência real do endpoint;
  não cria nem atribui uma permissão. Sem ela, o menu fica oculto e a página
  inicial encaminha para a primeira funcionalidade autorizada. Até o contrato
  da API ser corrigido em uma tarefa separada, os perfis do seed não acessam
  a Visão Geral, inclusive `ADMIN_MASTER`.
- A Visão Geral não consulta a listagem de denúncias sem `REPORT_LIST`.
  Auditoria não consulta detalhes de denúncias sem `REPORT_VIEW` nem catálogos
  administrativos sem a respectiva permissão.
- Retenção apresenta divergência semelhante: `retentionPolicies.routes.js`
  e `retentionScheduler.routes.js` exigem `RETENTION_POLICY_MANAGE`;
  `retentionExecutions.routes.js` e `retentionExecutor.routes.js` exigem
  `RETENTION_EXECUTE`. O seed só oferece `RETENTION_MANAGE`, que não substitui
  nenhuma delas. Menus, rotas e comandos seguem as exigências dos endpoints
  e permanecem bloqueados se essas permissões não forem retornadas pela API.
- O endpoint `/users/assignable-roles` também contém restrições antigas de RH
  em `src/modules/users/users.service.js`. A interface usa exclusivamente os
  perfis que esse endpoint autoriza, preserva os perfis existentes na edição
  e não completa a lista a partir de outros usuários ou do catálogo global.
  Se o servidor retornar uma lista vazia ou negar uma alteração, essa decisão
  continua valendo. A correção do frontend não resolve essas regras internas
  do backend.

## Escopo e segurança

`USER_MANAGE`, `TEAM_MANAGE`, `UNIT_MANAGE`, `CATEGORY_MANAGE`,
`ROUTING_MANAGE` e `AUDIT_VIEW` controlam suas respectivas
áreas. `ROLE_MANAGE` controla consultas ao catálogo de perfis. Não existe
uma tela independente de configurações/perfis neste frontend; nenhuma
funcionalidade nova foi criada a partir de `SETTINGS_MANAGE`.

`REPORT_LIST` controla a listagem e `REPORT_VIEW` controla a rota de detalhes.
As ações existentes continuam exigindo suas permissões específicas.
Os registros retornados pela API mantêm o escopo, as restrições por unidade
e a autorização por denúncia definidos pelo servidor. Não se infere acesso
ao conteúdo a partir de uma permissão administrativa. As únicas referências
restantes a `ADMIN_MASTER` nas telas são informativas, não bypasses de acesso.

O frontend é uma camada de apresentação. Todas as verificações de sessão,
permissões, escopo, atribuição de perfis e acesso a registros continuam a cargo
do backend. Nenhum arquivo da API, seed ou banco de dados foi alterado.

## Validação

`npm.cmd test` executa testes com o runner do Node e renderização React via
Vite, sem dependências novas, rede ou banco. Há cenários dos seis perfis,
menus, rotas diretas, guards de ações, revogação, perfil personalizado,
ausência de permissões, política de dashboard e rejeição de regras legadas.
As permissões de cada fixture refletem o seed, mas não são usadas em produção
para deduzir permissões por perfil.

`npm.cmd run build` executa a checagem TypeScript e o build de produção.

## Arquivos alterados ou criados

- `package.json`
- `src/utils/authorization.ts` (novo)
- `src/utils/accessScope.ts`
- `src/utils/displayLabels.ts`
- `src/hooks/useCan.ts`
- `src/types/navigation.ts`
- `src/components/auth/PermissionGuard.tsx`
- `src/components/auth/RequirePermission.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/routes/AppRouter.tsx`
- `src/api/adminManagement.ts`
- `src/pages/admin/AdminIndexPage.tsx`
- `src/pages/admin/DashboardPage.tsx`
- `src/pages/admin/ReportsPage.tsx`
- `src/pages/admin/ProfilePage.tsx`
- `src/pages/admin/UsersPage.tsx`
- `src/pages/admin/TeamsPage.tsx`
- `src/pages/admin/CategoriesPage.tsx`
- `src/pages/admin/UnitsPage.tsx`
- `src/pages/admin/RoutingRulesPage.tsx`
- `src/pages/admin/AuditPage.tsx`
- `src/pages/admin/RetentionPoliciesPage.tsx`
- `src/pages/admin/RetentionExecutionsPage.tsx`
- `tests/rbac.test.mjs` (novo)
- `docs/rbac.md` (novo)

O build também regenera os artefatos de `dist/`.
