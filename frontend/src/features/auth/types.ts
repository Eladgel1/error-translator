export type User = {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  user: User;
};

export type RegisterPayload = {
  email: string;
  full_name: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type PasswordResetRequestPayload = {
  email: string;
};

export type PasswordResetVerifyPayload = {
  email: string;
  code: string;
};

export type PasswordResetConfirmPayload = {
  email: string;
  code: string;
  new_password: string;
  confirm_new_password: string;
};

export type PasswordResetMessageResponse = {
  message: string;
};
