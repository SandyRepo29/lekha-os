export type UserRole = 'owner' | 'admin' | 'member' | 'viewer' | 'compliance_manager' | 'security_manager' | 'procurement_manager';

const EDIT_ROLES: UserRole[] = ['owner', 'admin', 'compliance_manager', 'security_manager', 'procurement_manager'];
const DELETE_ROLES: UserRole[] = ['owner', 'admin'];
const CREATE_ROLES: UserRole[] = ['owner', 'admin', 'compliance_manager', 'security_manager', 'procurement_manager'];
const ADMIN_ROLES: UserRole[] = ['owner', 'admin'];

export function canEdit(role: string): boolean {
  return EDIT_ROLES.includes(role as UserRole);
}

export function canDelete(role: string): boolean {
  return DELETE_ROLES.includes(role as UserRole);
}

export function canCreate(role: string): boolean {
  return CREATE_ROLES.includes(role as UserRole);
}

export function canViewSensitive(_role: string): boolean {
  return true;
}

export function isAdminOrOwner(role: string): boolean {
  return ADMIN_ROLES.includes(role as UserRole);
}

export function isOwner(role: string): boolean {
  return role === 'owner';
}
