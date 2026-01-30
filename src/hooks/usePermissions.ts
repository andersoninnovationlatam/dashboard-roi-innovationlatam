/**
 * Hook de Permissões
 * Facilita o uso de permissões baseadas em roles nos componentes
 */

import { useAuth } from '../../contexts/AuthContext'

export const usePermissions = () => {
  const {
    user,
    hasRole,
    hasAnyRole,
    canCreateProject,
    canEditProject,
    canDeleteProject,
    canCreateIndicator,
    canEditIndicator,
    canDeleteIndicator,
    canManageUsers,
    canManageOrganizations,
    canViewDashboard
  } = useAuth()

  return {
    user,
    isAuthenticated: !!user,
    organizationId: user?.organization_id || null,
    role: user?.role || null,
    // Métodos de verificação
    hasRole,
    hasAnyRole,
    // Permissões específicas
    canCreateProject,
    canEditProject,
    canDeleteProject,
    canCreateIndicator,
    canEditIndicator,
    canDeleteIndicator,
    canManageUsers,
    canManageOrganizations,
    canViewDashboard,
    // Helpers
    isAdmin: hasRole('admin'),
    isManager: hasRole('manager'),
    isAnalyst: hasRole('analyst'),
    isViewer: hasRole('viewer')
  }
}
