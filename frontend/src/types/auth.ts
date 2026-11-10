export type AdminUserUnit = {
  id: string;
  name: string;
  code?: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  active?: boolean;
  roles?: string[];
  units?: AdminUserUnit[];
};

export type AccessContext = {
  user: AdminUser;
  roles: string[];
  permissions: string[];
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginResult = {
  nextStep?: 'AUTHENTICATED' | 'CHANGE_PASSWORD' | string;
  preAuthToken?: string;
  raw: unknown;
};
