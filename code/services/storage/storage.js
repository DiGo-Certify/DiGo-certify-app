import * as SecureStore from 'expo-secure-store';

/**
 * Saves a key-value pair in the storage.
 * @param {string} key - The key to save the value under.
 * @param {string} value - The value to be saved.
 * @returns {Promise<void>} - A promise that resolves when the value is saved.
 */
async function save(key, value) {
    await SecureStore.setItemAsync(key, value);
}

/**
 * Retrieves the value associated with the specified key from the storage.
 * @param {string} key - The key to retrieve the value for.
 * @returns {Promise<any>} - A promise that resolves to the value associated with the key, or null if the key doesn't exist.
 */
async function getValueFor(key) {
    let result = await SecureStore.getItemAsync(key);
    if (result) {
        return JSON.parse(result);
    } else {
        return null;
    }
}

async function removeValueFor(key) {
    await SecureStore.deleteItemAsync(key);
}

export { save, getValueFor, removeValueFor };
