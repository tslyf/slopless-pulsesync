import type { AddonSettingValue, AddonSettings, AddonSettingsStore } from '@pulsesync/yamusic-types'

function unwrapSetting<T>(entry: AddonSettingValue<T> | unknown, fallback: T): T {
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        const record = entry as AddonSettingValue<T>

        if (typeof record.value !== 'undefined') {
            return record.value
        }

        if (typeof record.default !== 'undefined') {
            return record.default
        }
    }

    return typeof entry !== 'undefined' ? (entry as T) : fallback
}

export function getAddonSettings(addonName: string): AddonSettingsStore {
    return (
        // @ts-ignore
        window.pulsesyncApi?.getSettings(addonName) ?? {
            getCurrent: () => ({}),
            onChange: () => () => {},
        }
    )
}

export function readBooleanSetting(settings: AddonSettings, key: string, fallback: boolean): boolean {
    return Boolean(unwrapSetting(settings[key], fallback))
}

export function readStringSetting(settings: AddonSettings, key: string, fallback: string): string {
    return String(unwrapSetting(settings[key], fallback))
}

export function readOptionsSetting(settings: AddonSettings, key: string, options: string[], fallback: string): string {
    const rawValue = unwrapSetting(settings[key], fallback)
    return isNaN(Number(rawValue)) ? rawValue : options[Number(rawValue)]
}
