import { EventEmitter } from '../EventEmitter';

const STORAGE_KEY = 'tcbc-settings';

export interface Settings {
    relativeToContractHours: boolean;
}

let settings: Settings | undefined;

const DEFAULT_SETTINGS: Settings = {
    relativeToContractHours: false,
};

export const settingsUpdateEvent = new EventEmitter();

export function getSettings(): Settings {
    // Try to load the settings.
    if (!settings) {
        tryLoadSettings();
    }

    // If the settings are still unset, loading failed.
    // Set the default settings.
    if (!settings) {
        settings = { ...DEFAULT_SETTINGS };
        saveSettings();
    }

    return settings;
}

export function updateSettings(updates: Partial<Settings>) {
    settings = {
        ...DEFAULT_SETTINGS,
        ...settings,
        ...updates,
    };
    saveSettings();
    settingsUpdateEvent.fire();
}

function tryLoadSettings() {
    try {
        loadSettings();
    } catch (e) {
        console.error(`Failed to load ${STORAGE_KEY}: ${e}`);
    }
}

function loadSettings() {
    const str = localStorage.getItem(STORAGE_KEY);
    if (!str) {
        return;
    }

    const obj = JSON.parse(str);
    settings = {
        relativeToContractHours: obj.relativeToContractHours,
    };
}

function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
