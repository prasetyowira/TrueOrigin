import { Actor, ActorSubclass, HttpAgent, HttpAgentOptions, Identity } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { idlFactory as TrustOrigin_idl, canisterId as TrustOrigin_canisterId_imported } from '@declarations/TrustOrigin_backend'; // Renamed import
import type { _SERVICE as TrustOriginService } from '@declarations/TrustOrigin_backend/TrustOrigin_backend.did';
import { logger } from '@/utils/logger';

logger.debug('[canister.ts] DFX_NETWORK from process.env:', process.env.DFX_NETWORK);
logger.debug('[canister.ts] TrustOrigin_canisterId_imported:', TrustOrigin_canisterId_imported);

// Use process.env.DFX_NETWORK to determine host
const LOCAL_REPLICA_URL = 'http://localhost:4943'; 
const IC_HOST = 'https://icp-api.io';

const HOST = process.env.DFX_NETWORK === 'ic' ? IC_HOST : LOCAL_REPLICA_URL;
logger.debug('[canister.ts] Determined HOST:', HOST);

// Ensure canisterId is a string, provide a fallback if it ends up undefined for some reason during tests/builds.
const TrustOrigin_canisterId = TrustOrigin_canisterId_imported || "싯업시_캔_아이디_가져오지_못함"; // "Could not get canister ID during setup"
if (TrustOrigin_canisterId_imported !== TrustOrigin_canisterId) {
  logger.warn('[canister.ts] TrustOrigin_canisterId_imported was not a string, using fallback. Imported value:', TrustOrigin_canisterId_imported);
}

// Re-export canisterId and idlFactory for convenience
export { TrustOrigin_canisterId, TrustOrigin_idl };

/**
 * Creates a new actor instance for the TrustOrigin backend canister.
 */
export const createActor = async (options: {
  identity?: Identity;
  agent?: HttpAgent;
  agentOptions?: HttpAgentOptions;
} = {}): Promise<ActorSubclass<TrustOriginService>> => {
  logger.debug('[canister.ts createActor] Options received:', options);
  const effectiveHost = options.agentOptions?.host?.toString() || HOST;
  logger.debug('[canister.ts createActor] Effective host:', effectiveHost);
  let agent = options.agent;

  if (!agent) {
    const agentOpts: HttpAgentOptions = {
      host: effectiveHost,
      identity: options.identity,
      ...(options.agentOptions || {}),
    };
    logger.debug('[canister.ts createActor] Creating new HttpAgent with options:', agentOpts);
    try {
      agent = new HttpAgent(agentOpts);
      logger.debug('[canister.ts createActor] New HttpAgent created successfully.');
    } catch (err) {
      logger.error('[canister.ts createActor] Error creating HttpAgent:', err);
      throw err; // Re-throw if agent creation fails, as actor creation will also fail
    }
  }

  if (process.env.DFX_NETWORK !== "ic") {
    logger.debug('[canister.ts createActor] Attempting to fetch root key for local dev...');
    try {
      await agent.fetchRootKey();
      logger.debug('[canister.ts createActor] Agent root key fetched successfully.');
    } catch (err) {
      logger.warn('[canister.ts createActor] Unable to fetch root key. Check replica status. Error:', err);
      // For local dev, not fetching root key can be non-fatal for some calls, but often problematic.
    }
  }
  
  logger.debug('[canister.ts createActor] Attempting Actor.createActor with canisterId:', TrustOrigin_canisterId);
  try {
    const actorInstance = Actor.createActor<TrustOriginService>(TrustOrigin_idl, {
      agent,
      canisterId: TrustOrigin_canisterId,
    });
    logger.debug('[canister.ts createActor] Actor.createActor successful.');
    return actorInstance;
  } catch (err) {
    logger.error('[canister.ts createActor] Error in Actor.createActor:', err);
    throw err; // Re-throw if actor creation fails
  }
};

let defaultActor: ActorSubclass<TrustOriginService>;

(async () => {
  logger.debug('[canister.ts IIFE] Initializing defaultActor...');
  try {
    defaultActor = await createActor(); 
    logger.info('[canister.ts IIFE] Default (anonymous) backend actor initialized successfully.', { canisterId: TrustOrigin_canisterId });
  } catch (error) {
    logger.error('[canister.ts IIFE] CRITICAL: Failed to initialize default backend actor:', error);
    // defaultActor remains undefined. This is a critical failure.
  }
})();

/**
 * Provides an actor instance authenticated with the current AuthClient identity.
 */
export const getAuthenticatedActor = async (authClientInstance: AuthClient): Promise<ActorSubclass<TrustOriginService>> => {
  logger.debug('[canister.ts getAuthenticatedActor] Called.');
  if (!authClientInstance) {
    logger.warn('[canister.ts getAuthenticatedActor] AuthClient instance missing, falling back to defaultActor or creating new anonymous.');
    return defaultActor || createActor(); 
  }
  const identity = authClientInstance.getIdentity();
  if (!identity || identity.getPrincipal().isAnonymous()) {
    logger.warn('[canister.ts getAuthenticatedActor] AuthClient provided anonymous identity, falling back.');
    return defaultActor || createActor(); 
  }
  logger.debug('[canister.ts getAuthenticatedActor] Creating actor with authenticated identity.');
  const actorInstance = await createActor({ identity });
  defaultActor = actorInstance;
  return actorInstance;
};

/**
 * Provides the default, possibly anonymous, actor.
 */
export const getAnonymousActor = async (): Promise<ActorSubclass<TrustOriginService>> => {
  logger.debug('[canister.ts getAnonymousActor] Called.');
  if (defaultActor) {
    logger.debug('[canister.ts getAnonymousActor] Returning pre-initialized defaultActor.');
    return defaultActor;
  }
  logger.warn('[canister.ts getAnonymousActor] defaultActor not yet initialized by IIFE or IIFE failed. Attempting to create a new one.');
  try {
    const newAnonActor = await createActor();
    // Optionally, set defaultActor here if it was meant to be a singleton that failed init
    // defaultActor = newAnonActor;
    return newAnonActor;
  } catch (error) {
     logger.error('[canister.ts getAnonymousActor] CRITICAL: Failed to create new anonymous actor on demand:', error);
     throw error; // If we can't even get an anonymous actor, the app is likely unusable.
  }
};

export { defaultActor as actor }; 