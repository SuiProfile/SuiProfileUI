import { ZkLoginUser } from "./zk-login-user";

export interface ZkLoginReturn {
  user: ZkLoginUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  getAddress: () => string | null;
}
