import { HistoryEntry } from '../types';

const HISTORY_KEY = 'leaf_disease_history';
const MAX_HISTORY_ITEMS = 12; // Limit the number of stored items

/**
 * Retrieves the analysis history from localStorage.
 * @returns An array of HistoryEntry objects.
 */
export function getHistory(): HistoryEntry[] {
  try {
    const storedHistory = localStorage.getItem(HISTORY_KEY);
    return storedHistory ? JSON.parse(storedHistory) : [];
  } catch (error) {
    console.error("Failed to parse history from localStorage", error);
    // In case of error, clear the corrupted data to prevent future issues.
    localStorage.removeItem(HISTORY_KEY);
    return [];
  }
}

/**
 * Adds a new entry to the analysis history in localStorage.
 * @param newEntry The new HistoryEntry to add.
 * @returns The updated history array.
 */
export function addHistoryEntry(newEntry: HistoryEntry): HistoryEntry[] {
  try {
    const currentHistory = getHistory();
    // Add new entry to the beginning and slice to maintain the max limit.
    const updatedHistory = [newEntry, ...currentHistory].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    return updatedHistory;
  } catch (error) {
    console.error("Failed to save history to localStorage", error);
    // Return the old history if saving fails
    return getHistory();
  }
}

/**
 * Clears the entire analysis history from localStorage.
 */
export function clearHistory(): void {
    try {
        localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
        console.error("Failed to clear history from localStorage", error);
    }
}
