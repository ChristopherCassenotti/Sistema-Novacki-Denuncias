import { categoriesAdminApi } from '../../api/adminManagement';
import { AdminCatalogPage } from '../../components/admin/AdminCatalogPage';
import { useCan } from '../../hooks/useCan';
import { ACCESS } from '../../utils/authorization';

export function CategoriesPage() {
  const canManage = useCan(ACCESS.categories);

  return (
    <AdminCatalogPage
      title="Categorias"
      singular="Categoria"
      description="Categorias disponíveis para classificação das denúncias e regras de direcionamento."
      icon="bi-tags"
      api={categoriesAdminApi}
      canManage={canManage}
    />
  );
}
