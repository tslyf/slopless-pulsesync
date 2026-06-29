import addonConfig from '../addon.config.mjs'
import { Locale } from './locales'
import { getAddonSettings, readBooleanSetting, readOptionsSetting } from './pulsesync'

export const DOM = {
    artistLinks: 'a[href*="/artist"]:not([class*="BlockHeader"])',
    artistProfileTitle: 'h1[class*="page-artist__title"], span[class*="PageHeaderTitle_title__"], span[class*="PageHeaderTitle_heading__"]',
    separatedArtists: 'span[data-test-id="SEPARATED_ARTIST_TITLE"]',
}

export function getSettings() {
    const LOCALE_MAP = ['ru', 'en']
    const BEHAVIOR_MAP = ['dislike', 'dislike_if_not_liked', 'skip', 'skip_if_not_liked', 'nothing', 'like']
    const THRESHOLD_MAP = ['any', 'deezer_any', 'deezer_100']

    const settings = getAddonSettings(addonConfig.name).getCurrent()

    return {
        locale: readOptionsSetting(settings, 'locale', LOCALE_MAP, 'ru') as Locale,
        behavior: readOptionsSetting(settings, 'behavior', BEHAVIOR_MAP, 'dislike') as
            | 'dislike'
            | 'dislike_if_not_liked'
            | 'skip'
            | 'skip_if_not_liked'
            | 'nothing'
            | 'like',
        threshold: readOptionsSetting(settings, 'threshold', THRESHOLD_MAP, 'any') as 'any' | 'deezer_any' | 'deezer_100',
        strictTracks: readBooleanSetting(settings, 'strictTracks', false),
    }
}

export function extractArtistId(href: string): string | null {
    if (!href) return null
    const match = href.match(/[?&]artistId=(\d+)|artist\/(\d+)/)
    return match ? match[1] || match[2] : null
}
