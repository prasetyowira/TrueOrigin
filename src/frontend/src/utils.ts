import type { UserResult, User, ApiError as DidApiError, ErrorDetails as DidErrorDetails } from "@declarations/TrustOrigin_backend/TrustOrigin_backend.did";

// Utility to extract message from DidApiError
function getDidApiErrorMessage(error: DidApiError): string {
    if ('InvalidInput' in error && error.InvalidInput) return error.InvalidInput.details.message;
    if ('NotFound' in error && error.NotFound) return error.NotFound.details.message;
    if ('ExternalApiError' in error && error.ExternalApiError) return error.ExternalApiError.details.message;
    if ('Unauthorized' in error && error.Unauthorized) return error.Unauthorized.details.message;
    if ('AlreadyExists' in error && error.AlreadyExists) return error.AlreadyExists.details.message;
    if ('MalformedData' in error && error.MalformedData) return error.MalformedData.details.message;
    if ('InternalError' in error && error.InternalError) return error.InternalError.details.message;
    return 'An unknown API error occurred';
}

export function handleUserResult(result: UserResult): User | null {
    if ('none' in result && result.none === null) {
        return null;
    }
    if ('user' in result && result.user) {
        return result.user;
    }
    if ('error' in result && result.error) {
        throw new Error(getDidApiErrorMessage(result.error));
    }
    console.error('Malformed UserResult:', result); // Log malformed result
    throw new Error('Malformed UserResult!');
}