import { BrowserRouter, Route, Routes } from 'react-router';
import { GuestOnlyRoute } from '../components/auth/GuestOnlyRoute';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { ReporterProtectedRoute } from '../components/auth/ReporterProtectedRoute';
import { RequirePermission } from '../components/auth/RequirePermission';
import { AdminLayout } from '../layouts/AdminLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { ReporterAreaLayout } from '../layouts/ReporterAreaLayout';
import { AdminIndexPage } from '../pages/admin/AdminIndexPage';
import { UsersPage } from '../pages/admin/UsersPage';
import { TeamsPage } from '../pages/admin/TeamsPage';
import { CategoriesPage } from '../pages/admin/CategoriesPage';
import { UnitsPage } from '../pages/admin/UnitsPage';
import { RoutingRulesPage } from '../pages/admin/RoutingRulesPage';
import { AuditPage } from '../pages/admin/AuditPage';
import { RetentionPoliciesPage } from '../pages/admin/RetentionPoliciesPage';
import { RetentionExecutionsPage } from '../pages/admin/RetentionExecutionsPage';
import { ProfilePage } from '../pages/admin/ProfilePage';
import { ReportsPage } from '../pages/admin/ReportsPage';
import { ReportDetailPage } from '../pages/admin/ReportDetailPage';
import { ChangeInitialPasswordPage } from '../pages/auth/ChangeInitialPasswordPage';
import { CompleteCredentialSetupPage } from '../pages/auth/CompleteCredentialSetupPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { SessionExpiredPage } from '../pages/auth/SessionExpiredPage';
import { ForbiddenPage } from '../pages/errors/ForbiddenPage';
import { NotFoundPage } from '../pages/errors/NotFoundPage';
import { ServerErrorPage } from '../pages/errors/ServerErrorPage';
import { ServiceUnavailablePage } from '../pages/errors/ServiceUnavailablePage';
import { ScrollToTop } from '../components/system/ScrollToTop';
import { AccessReportPage } from '../pages/public/AccessReportPage';
import { AttachmentsPage } from '../pages/public/AttachmentsPage';
import { FinalResponsePage } from '../pages/public/FinalResponsePage';
import { GuidelinesPage } from '../pages/public/GuidelinesPage';
import { HomePage } from '../pages/public/HomePage';
import { PeoplePage } from '../pages/public/PeoplePage';
import { ReportAttachmentsPage } from '../pages/public/ReportAttachmentsPage';
import { ReportDetailsPage } from '../pages/public/ReportDetailsPage';
import { ReportMessagesPage } from '../pages/public/ReportMessagesPage';
import { ReportModePage } from '../pages/public/ReportModePage';
import { ReportSentPage } from '../pages/public/ReportSentPage';
import { ReportTrackingPage } from '../pages/public/ReportTrackingPage';
import { ReviewReportPage } from '../pages/public/ReviewReportPage';
import { RiskPage } from '../pages/public/RiskPage';
import { ACCESS } from '../utils/authorization';

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="denunciar/orientacoes" element={<GuidelinesPage />} />
          <Route path="denunciar/tipo" element={<ReportModePage />} />
          <Route path="denunciar" element={<ReportDetailsPage />} />
          <Route path="denunciar/pessoas" element={<PeoplePage />} />
          <Route path="denunciar/risco" element={<RiskPage />} />
          <Route path="denunciar/anexos" element={<AttachmentsPage />} />
          <Route path="denunciar/revisao" element={<ReviewReportPage />} />
          <Route path="denuncia/enviada" element={<ReportSentPage />} />
          <Route path="acompanhar" element={<AccessReportPage />} />

          <Route element={<ReporterProtectedRoute />}>
            <Route path="acompanhar/:protocolo" element={<ReporterAreaLayout />}>
              <Route index element={<ReportTrackingPage />} />
              <Route path="mensagens" element={<ReportMessagesPage />} />
              <Route path="anexos" element={<ReportAttachmentsPage />} />
              <Route path="resposta" element={<FinalResponsePage />} />
            </Route>
          </Route>
        </Route>

        <Route element={<GuestOnlyRoute />}>
          <Route path="/admin/login" element={<LoginPage />} />
        </Route>

        <Route path="/admin/trocar-senha" element={<ChangeInitialPasswordPage />} />
        <Route path="/admin/definir-credencial" element={<CompleteCredentialSetupPage />} />
        <Route path="/sessao-expirada" element={<SessionExpiredPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminIndexPage />} />
            <Route element={<RequirePermission {...ACCESS.reports} />}>
              <Route path="denuncias" element={<ReportsPage />} />
            </Route>
            <Route element={<RequirePermission {...ACCESS.reportDetail} />}>
              <Route path="denuncias/:id" element={<ReportDetailPage />} />
            </Route>
            <Route path="perfil" element={<ProfilePage />} />

            <Route element={<RequirePermission {...ACCESS.users} />}>
              <Route path="usuarios" element={<UsersPage />} />
            </Route>
            <Route element={<RequirePermission {...ACCESS.teams} />}>
              <Route path="equipes" element={<TeamsPage />} />
            </Route>
            <Route element={<RequirePermission {...ACCESS.categories} />}>
              <Route path="categorias" element={<CategoriesPage />} />
            </Route>
            <Route element={<RequirePermission {...ACCESS.units} />}>
              <Route path="unidades" element={<UnitsPage />} />
            </Route>
            <Route element={<RequirePermission {...ACCESS.routing} />}>
              <Route path="routing-rules" element={<RoutingRulesPage />} />
            </Route>
            <Route element={<RequirePermission {...ACCESS.audit} />}>
              <Route path="auditoria" element={<AuditPage />} />
            </Route>
            <Route element={<RequirePermission {...ACCESS.retention} />}>
              <Route path="retencao/politicas" element={<RetentionPoliciesPage />} />
            </Route>
            <Route element={<RequirePermission {...ACCESS.retentionExecutions} />}>
              <Route path="retencao/execucoes" element={<RetentionExecutionsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/500" element={<ServerErrorPage />} />
        <Route path="/503" element={<ServiceUnavailablePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
