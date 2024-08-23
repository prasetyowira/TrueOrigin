import type { UserResult, User } from "../../declarations/TrustOrigin_backend/TrustOrigin_backend.did";

export function handleUserResult(result: UserResult): User | null {
    if ('none' in result) {
        return null;
    }
    if ('user' in result) {
        return result.user;
    }
    if ('error' in result) {
        throw new Error(result.error.message)
    }
    throw new Error('Malformed result!')
}