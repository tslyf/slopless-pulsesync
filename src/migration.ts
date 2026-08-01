import addonConfig from '../addon.config.mjs'
import { getAddonSettings, readNumberSetting } from './pulsesync'

export function runVirtualMigration() {
    try {
        const addonName = addonConfig.name
        // @ts-ignore
        const memSettings = window.pulsesyncApi?._addonSettings?.[addonName]

        if (memSettings && memSettings.artistThreshold) {
            if (memSettings.artistThreshold.value === 5) {
                if (localStorage.getItem('slopless_explicit_5') !== 'true') {
                    memSettings.artistThreshold.value = 10
                    console.log('[Slopless] Legacy threshold 5% patched to 10% in memory')
                }
            }
        }
    } catch (e) {
        console.error('[Slopless] Virtual migration failed', e)
    }

    const settingsStore = getAddonSettings(addonConfig.name)
    let isFirstCall = true

    settingsStore.onChange(newSettings => {
        if (isFirstCall) {
            isFirstCall = false
            return
        }

        const threshold = readNumberSetting(newSettings, 'artistThreshold', 10)

        if (threshold === 5) {
            localStorage.setItem('slopless_explicit_5', 'true')
        } else {
            localStorage.removeItem('slopless_explicit_5')
        }
    })
}
