import type { AuthClient } from '@dfinity/auth-client';
import type { ReactNode } from 'react';
import type { User, UserDetailsInput } from '../../../../declarations/TrustOrigin_backend/TrustOrigin_backend.did';

export interface AuthContextProviderProps {
  children: ReactNode;
}

export interface userProfileDataInterface {
  email : string,
  password : string
}

export interface AuthContextInterface {
  isAuthenticated: boolean | undefined;
  profile: User | null | undefined;
  login: () => void;
  logout: () => void;
  createProfile: (input: UserDetailsInput) => Promise<void>;
  updateProfile: (input: UserDetailsInput) => Promise<void>;
  authClient: AuthClient | undefined;
}
