// psychohelp/constants/rbac.py
export type TRoleCode = 'user' | 'psychologist' | 'admin' | 'content_manager';

// psychohelp/schemas/roles.py
export type TRole = {
  code: TRoleCode;
  name: string;
  description: string | null;
};
