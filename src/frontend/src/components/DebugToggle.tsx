import React, { useEffect, useState } from 'react';
import { logger } from '@/utils/logger'; // Assuming logger has an enableAllLogs method or similar

export const DebugToggle: React.FC = () => {
  // Initialize debugMode from localStorage or default to false
  const getInitialDebugMode = () => localStorage.getItem('debug_mode') === 'true';
  const [debugMode, setDebugMode] = useState<boolean>(getInitialDebugMode);

  // Determine if on a development network
  const isDevelopmentNetwork = process.env.DFX_NETWORK !== 'ic';

  useEffect(() => {
    // This effect only runs if the component is rendered (i.e., on a dev network)
    if (debugMode) {
      logger.enableAllLogs();
      localStorage.setItem('debug_mode', 'true');
      logger.info('Debug mode explicitly ENABLED via toggle. All logs will be shown.');
    } else {
      // When toggled OFF, revert to network-aware defaults
      // On a dev network, this means all logs remain on by default from Logger constructor.
      // To specifically silence debug/info when toggled off on a dev network:
      if (isDevelopmentNetwork) {
        logger.setEnabledLevels(['warn', 'error']);
        logger.warn('Debug mode explicitly DISABLED via toggle. Showing only warnings and errors.');
      } else {
        // On IC network, this toggle shouldn't even render, but if it did, 
        // it would default to error/warn as per Logger constructor.
        logger.setEnabledLevels(['error', 'warn']);
      }
      localStorage.removeItem('debug_mode');
    }
  }, [debugMode, isDevelopmentNetwork]);

  // Only show this component on non-'ic' networks (local/development)
  if (!isDevelopmentNetwork) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 right-4 bg-gray-700 text-white p-3 rounded-lg shadow-lg z-50 text-xs cursor-pointer hover:bg-gray-600 transition-colors"
      onClick={() => setDebugMode(!debugMode)}
      title={debugMode ? "Disable all logs (show warn/error only)" : "Enable all debug logs"}
    >
      <label className="flex items-center space-x-2 cursor-pointer">
        <input 
          type="checkbox"
          checked={debugMode}
          onChange={() => setDebugMode(!debugMode)} 
          className="form-checkbox h-4 w-4 text-cyan-500 bg-gray-600 border-gray-500 rounded focus:ring-cyan-400 cursor-pointer"
        />
        <span>{debugMode ? "Verbose Logs ON" : "Verbose Logs OFF"}</span>
      </label>
    </div>
  );
}; 