/**
 * @file Utility functions for formatting data
 * @fileoverview Provides helper functions for consistent data presentation.
 */

import { Principal } from '@dfinity/principal';

/**
 * Formats a BigInt timestamp into a readable date and time string.
 * @param timestamp - The BigInt timestamp (nanoseconds).
 * @returns A formatted date string (e.g., "YYYY-MM-DD HH:MM:SS") or 'Invalid Date'.
 */
export const formatTimestamp = (timestamp: bigint): string => {
  try {
    // Convert nanoseconds to milliseconds
    const milliseconds = Number(timestamp / 1_000_000n);
    const date = new Date(milliseconds);

    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    // Format the date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return 'Invalid Date';
  }
};

/**
 * Formats a Principal ID into a shortened, readable string.
 * @param principal - The Principal object.
 * @returns A shortened principal string (e.g., "abcde...wxyz") or an empty string if input is invalid.
 */
export const formatPrincipal = (principal: Principal | undefined | null): string => {
  if (!principal) {
    return '';
  }
  try {
    const principalString = principal.toText();
    if (principalString.length > 10) {
      return `${principalString.slice(0, 5)}...${principalString.slice(-5)}`;
    }
    return principalString;
  } catch (error) {
    console.error("Error formatting principal:", error);
    return ''; // Return empty string on error
  }
}; 