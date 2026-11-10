import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router';
import { ACCESS, can, adminLandingPath } from '../src/utils/authorization.ts';
import { ROLE_CODES, hasRole } from '../src/utils/accessScope.ts';

const technical = ['AUDIT_VIEW', 'USER_MANAGE', 'ROLE_MANAGE', 'TEAM_MANAGE', 'UNIT_MANAGE', 'CATEGORY_MANAGE', 'ROUTING_MANAGE', 'RETENTION_MANAGE', 'SETTINGS_MANAGE'];
// Contract fixtures from prisma/seed.js; never derive effective permissions from roles in production.
const fixtures = {
  ADMIN_TECHNICAL: technical,
  TRIAGE: ['REPORT_LIST','REPORT_VIEW','REPORT_ASSIGN','REPORT_CHANGE_PRIORITY','REPORT_CHANGE_STATUS','REPORT_MESSAGE','REPORT_REQUEST_INFO','REPORT_ATTACHMENT','REPORT_IDENTITY_VIEW','REPORT_MANAGE_ACCESS','REPORT_RESTRICT_USER','REPORT_ARCHIVE'],
  INVESTIGATOR: ['REPORT_LIST','REPORT_VIEW','REPORT_CHANGE_STATUS','REPORT_MESSAGE','REPORT_REQUEST_INFO','REPORT_INTERNAL_NOTE','REPORT_ATTACHMENT','REPORT_CONCLUDE','REPORT_ARCHIVE'],
  MANAGER: ['REPORT_LIST','REPORT_VIEW','REPORT_STATS_VIEW','REPORT_EXPORT'],
  AUDITOR: ['REPORT_LIST','REPORT_VIEW','AUDIT_VIEW'],
};
fixtures.ADMIN_MASTER = [...new Set([...technical, ...Object.values(fixtures).flat()])];
const expected = {
  ADMIN_TECHNICAL: ['users','teams','categories','units','routing','audit'],
  TRIAGE: ['reports','reportDetail'],
  INVESTIGATOR: ['reports','reportDetail'],
  MANAGER: ['reports','reportDetail'],
  AUDITOR: ['reports','reportDetail','audit'],
  ADMIN_MASTER: ['reports','reportDetail','users','teams','categories','units','routing','audit'],
};
const paths = {dashboard:'/admin',reports:'/admin/denuncias',reportDetail:'/admin/denuncias/123',users:'/admin/usuarios',teams:'/admin/equipes',categories:'/admin/categorias',units:'/admin/unidades',routing:'/admin/routing-rules',audit:'/admin/auditoria',retention:'/admin/retencao/politicas',retentionExecutions:'/admin/retencao/execucoes'};

// Render real components with controlled access/me state, without network or a browser.
const server = await createServer({configFile:false, server:{middlewareMode:true}, appType:'custom', plugins:[{
  name:'test-access-context', enforce:'pre', transform(_code,id) {
    if (id.replaceAll('\\','/').endsWith('/src/context/AuthContext.tsx')) {
      return 'export function useAuth() { return globalThis.__rbacTestAuth; }';
    }
  },
}]});
after(async()=> { delete globalThis.__rbacTestAuth; await server.close(); });
const { Sidebar } = await server.ssrLoadModule('/src/components/layout/Sidebar.tsx');
const { RequirePermission } = await server.ssrLoadModule('/src/components/auth/RequirePermission.tsx');
const { PermissionGuard } = await server.ssrLoadModule('/src/components/auth/PermissionGuard.tsx');
const { AppRouter } = await server.ssrLoadModule('/src/routes/AppRouter.tsx');
const h = React.createElement;
function auth(role, permissions) {
  globalThis.__rbacTestAuth = {roles:[role],permissions,user:{id:'test',name:'Test',units:[]},isAuthenticated:true,loading:false};
}
function render(element,path='/admin') { return renderToStaticMarkup(h(MemoryRouter,{initialEntries:[path]},element)); }
// Keep the actual route tree and permission guards; replace layouts/pages with markers.
function instrumentRoutes(children) {
  return React.Children.map(children, child => {
    if (!React.isValidElement(child)) return child;
    const props = child.props;
    const element = props.element;
    const nextElement = element?.type === RequirePermission ? element
      : props.children ? h(Outlet) : h('span',null,'AUTHORIZED_PAGE');
    return React.cloneElement(child,{element:nextElement},instrumentRoutes(props.children));
  });
}
const routes = React.Children.toArray(AppRouter().props.children).find(child => child.type === Routes);
for (const [role, permissions] of Object.entries(fixtures)) {
  test(`${role}: effective permissions, sidebar and direct routes agree`,()=> {
    auth(role,permissions);
    assert.equal(hasRole([role],ROLE_CODES[role]),true);
    const sidebar = render(h(Sidebar,{open:true,onClose(){}}));
    for(const [key,rule] of Object.entries(ACCESS)) {
      const allowed = expected[role].includes(key);
      assert.equal(can(permissions,rule),allowed,`${role} ${key}`);
      if(key!=='reportDetail') assert.equal(sidebar.includes(`href="${paths[key]}"`),allowed,`menu ${key}`);
      if(key!=='dashboard') {
        const result = render(h(Routes,null,instrumentRoutes(routes.props.children)),paths[key]);
        assert.equal(result.includes('AUTHORIZED_PAGE'),allowed,`route ${key}`);
      }
      const guarded = render(h(PermissionGuard,{...rule,fallback:'DENIED'},'ALLOWED'));
      assert.equal(guarded,allowed?'ALLOWED':'DENIED',`action ${key}`);
    }
    assert.equal(adminLandingPath(permissions),role==='ADMIN_TECHNICAL'?'/admin/usuarios':'/admin/denuncias');
  });
}
test('roles alone, including ADMIN_MASTER and combined roles, grant no permissions',()=> {
  for(const role of Object.keys(fixtures)) {
    auth(role,[]);
    for(const rule of Object.values(ACCESS)) {
      assert.equal(render(h(PermissionGuard,{...rule,fallback:'DENIED'},'ALLOWED')),'DENIED');
    }
    assert.equal(adminLandingPath([]),'/admin/perfil');
    assert.equal(render(h(Sidebar,{open:true,onClose(){}})).includes('href="/admin/'),false);
  }
  globalThis.__rbacTestAuth.roles = Object.keys(fixtures);
  assert.equal(render(h(PermissionGuard,{permission:'REPORT_VIEW',fallback:'DENIED'},'ALLOWED')),'DENIED');
});
test('a custom role gets only its effective permissions; revocation is immediate',()=> {
  auth('CUSTOM',['USER_MANAGE']);
  assert.equal(render(h(PermissionGuard,{...ACCESS.users},'USERS')),'USERS');
  assert.equal(render(h(PermissionGuard,{...ACCESS.reports},'REPORTS')),'');
  auth('CUSTOM',[]);
  assert.equal(render(h(PermissionGuard,{...ACCESS.users},'USERS')),'');
});
test('dashboard follows the actual middleware; STATS, LIST, VIEW and master are insufficient',()=> {
  assert.equal(can(['REPORT_STATS_VIEW','REPORT_LIST','REPORT_VIEW'],ACCESS.dashboard),false);
  assert.equal(can(['REPORT_DASHBOARD_VIEW'],ACCESS.dashboard),true);
  assert.equal(adminLandingPath(['REPORT_DASHBOARD_VIEW']),'/admin');
  assert.equal(can(['REPORT_DASHBOARD_VIEW'],ACCESS.reports),false);
});
test('allOf and anyOf do not widen a mandatory permission',()=> {
  assert.equal(can(['USER_MANAGE'],{permission:'REPORT_VIEW',anyOf:['USER_MANAGE']}),false);
  assert.equal(can(['USER_MANAGE'],{allOf:['USER_MANAGE','ROLE_MANAGE']}),false);
  assert.equal(can(['USER_MANAGE'],{anyOf:['USER_MANAGE','ROLE_MANAGE']}),true);
});
test('old role codes and role-only guards are absent from production source',async()=> {
  const { readdir } = await import('node:fs/promises');
  async function inspect(dir) {
    for(const entry of await readdir(dir,{withFileTypes:true})) {
      const path=`${dir}/${entry.name}`;
      if(entry.isDirectory()) await inspect(path);
      else if(/\.[jt]sx?$/.test(path)) assert.doesNotMatch(await readFile(path,'utf8'),/RH_UNIDADE|rolesAnyOf|rolesAllOf/,path);
    }
  }
  await inspect('src');
});
const { usersApi } = await server.ssrLoadModule('/src/api/adminManagement.ts');
const { api } = await server.ssrLoadModule('/src/api/client.ts');
test('assignable roles come only from the server, without name-based privileges or fallbacks',async()=> {
  const originalGet = api.get;
  const calls = [];
  try {
    api.get = async (url) => {
      calls.push(url);
      return {data:{data:[{id:'technical',code:'ADMIN_TECHNICAL',name:'Technical'},{id:'unknown',name:'Administrador geral'}]}};
    };
    const roles = await usersApi.assignableRoles();
    assert.equal(roles[0].code,'ADMIN_TECHNICAL');
    assert.equal(roles[1].code,undefined);
    assert.deepEqual(calls,['/api/admin/users/assignable-roles']);
    calls.length=0;
    const denied = new Error('403');
    api.get = async url => { calls.push(url); throw denied; };
    await assert.rejects(usersApi.assignableRoles(),error=>error===denied);
    assert.deepEqual(calls,['/api/admin/users/assignable-roles']);
    api.get = async () => ({data:{data:[]}});
    assert.deepEqual(await usersApi.assignableRoles(),[]);
  } finally { api.get = originalGet; }
});
test('technical administrator sees unit creation; dashboard-only access hides recent reports',async()=> {
  const { UnitsPage } = await server.ssrLoadModule('/src/pages/admin/UnitsPage.tsx');
  const { DashboardPage } = await server.ssrLoadModule('/src/pages/admin/DashboardPage.tsx');
  auth('ADMIN_TECHNICAL',technical);
  assert.match(render(h(UnitsPage)),/Nova unidade/);
  auth('CUSTOM',['REPORT_DASHBOARD_VIEW']);
  const dashboard = render(h(DashboardPage));
  assert.equal(dashboard.includes('href="/admin/denuncias"'),false);
});
test('retention execution route requires RETENTION_EXECUTE',()=> {
  for(const [role, permissions] of Object.entries(fixtures)) {
    auth(role,permissions);
    assert.equal(render(h(Routes,null,instrumentRoutes(routes.props.children)),'/admin/retencao/execucoes').includes('AUTHORIZED_PAGE'), permissions.includes('RETENTION_EXECUTE'));
  }
});
test('retention uses distinct endpoint permissions, never the seed alias',()=> {
  assert.equal(can(['RETENTION_MANAGE'],ACCESS.retention),false);
  assert.equal(can(['RETENTION_MANAGE'],ACCESS.retentionExecutions),false);
  for(const [permission,key] of [['RETENTION_POLICY_MANAGE','retention'],['RETENTION_EXECUTE','retentionExecutions']]) {
    auth('CUSTOM',[permission]);
    const sidebar=render(h(Sidebar,{open:true,onClose(){}}));
    assert.equal(sidebar.includes(`href="${paths[key]}"`),true);
    assert.equal(render(h(Routes,null,instrumentRoutes(routes.props.children)),paths[key]).includes('AUTHORIZED_PAGE'),true);
    assert.equal(adminLandingPath([permission]),paths[key]);
  }
});
