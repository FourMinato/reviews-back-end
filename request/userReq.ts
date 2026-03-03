export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string | null;
  anonymous_name?: string;
  profile?: string;
}