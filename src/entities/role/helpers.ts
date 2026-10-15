import type { TRole } from './types';

export class Role {
  roles: TRole[];
  constructor(roles: TRole[]) {
    this.roles = roles;
  }
  getRoleByCode(code: string): TRole | undefined {
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
