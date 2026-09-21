import type { Role as RoleType } from './types';

export class Role {
  roles: RoleType[];
  constructor(roles: RoleType[]) {
    this.roles = roles;
  }
  getRoleByCode(code: string): RoleType | undefined {
    return this.roles.find((role) => role.code === code);
  }
  isUser(): boolean {
    return !!this.getRoleByCode('user');
  }
  isPsychologist(): boolean {
    return !!this.getRoleByCode('psychologist');
  }
  isAdmin(): boolean {
    return !!this.getRoleByCode('admin');
  }
  isContentManager(): boolean {
    return !!this.getRoleByCode('content_manager');
  }
}
