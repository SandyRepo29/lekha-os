export type UserRole = 'owner' | 'admin' | 'member' | 'viewer' | 'compliance_manager' | 'security_manager' | 'procurement_manager';

const EDIT_ROLES: UserRole[] = ['owner', 'admin', 'compliance_manager', 'security_manager', 'procurement_manager'];
const DELETE_ROLES: UserRole[] = ['owner', 'admin'];
const CREATE_ROLES: UserRole[] = ['owner', 'admin', 'compliance_manager', 'security_manager', 'procurement_manager'];
const ADMIN_ROLES: UserRole[] = ['owner', 'admin'];

export function canEdit(role: UserRole): boolean {
  return EDIT_ROLES.includes(role);
}

export function canDelete(role: UserRole): boolean {
  return DELETE_ROLES.includes(role);
}

export function canCreate(role: UserRole): boolean {
  return CREATE_ROLES.includes(role);
}

export function canViewSensitive(_role: UserRole): boolean {
  return true;
}

export function isAdminOrOwner(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export function isOwner(role: UserRole): boolean {
  return role === 'owner';
}
