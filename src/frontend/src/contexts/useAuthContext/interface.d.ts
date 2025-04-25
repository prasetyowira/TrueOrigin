import type { AuthClient } from '@dfinity/auth-client';
import type { ReactNode } from 'react';
import type { User, UserDetailsInput, ResellerInput, OrganizationInput, UserRole } from '../../../../declarations/TrustOrigin_backend/TrustOrigin_backend.did';

export interface AuthContextProviderProps {
  children: ReactNode;
}

export interface userProfileDataInterface {
  email: string,
  password: string
}

export interface AuthContextInterface {
  isAuthenticated: boolean | undefined;
  isLoading: boolean;
  profile: User | null | undefined;
  hasRole: (role: UserRole) => boolean;
  login: () => void;
  logout: () => Promise<void>;
  createProfile: (input: UserDetailsInput) => Promise<void>;
  updateProfile: (input: UserDetailsInput) => Promise<void>;
  setSelfRole: (userRole: UserRole) => Promise<void>;
  signinAsBrandOwner: (input: OrganizationInput) => Promise<void>;
  signinAsReseller: (input: ResellerInput) => Promise<void>;
  authClient: AuthClient | undefined;
}
