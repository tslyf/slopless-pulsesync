import addonConfig from '../addon.config.mjs'
import { Locale } from './locales'
import { getAddonSettings, readBooleanSetting, readNumberSetting, readOptionsSetting } from './pulsesync'

export const API_BASE = 'https://slopless.art/api'
export const AI_TRACK_THRESHOLD = 0.5

export const DOM = {
    artistLinks: 'a[href*="/artist"]:not([class*="BlockHeader"])',
    artistProfileTitle: 'h1[class*="page-artist__title"], span[class*="PageHeaderTitle_title__"], span[class*="PageHeaderTitle_heading__"]',
    separatedArtists: 'span[data-test-id="SEPARATED_ARTIST_TITLE"]',
    trackLinks: 'a[href*="/track"]:not([class*="BlockHeader"])',
}

export type AiMusicBehavior = 'dislike' | 'dislike_if_not_liked' | 'skip' | 'skip_if_not_liked' | 'nothing' | 'like'

export function getSettings() {
    const LOCALE_MAP = ['ru', 'en']
    const BEHAVIOR_MAP = ['dislike', 'dislike_if_not_liked', 'skip', 'skip_if_not_liked', 'nothing', 'like']

    const settings = getAddonSettings(addonConfig.name).getCurrent()

    return {
        locale: readOptionsSetting(settings, 'locale', LOCALE_MAP, 'ru') as Locale,
        behavior: readOptionsSetting(settings, 'behavior', BEHAVIOR_MAP, 'dislike') as AiMusicBehavior,
        strictTracks: readBooleanSetting(settings, 'strictTracks', false),

        showArtistLabels: readBooleanSetting(settings, 'showArtistLabels', true),
        showTrackLabels: readBooleanSetting(settings, 'showTrackLabels', true),

        artistThreshold: readNumberSetting(settings, 'artistThreshold', 10) / 100,
    }
}

export function extractArtistId(href: string): string | null {
    if (!href) return null
    const match = href.match(/[?&]artistId=(\d+)|artist\/(\d+)/)
    return match ? match[1] || match[2] : null
}

export function extractTrackId(href: string): string | null {
    if (!href) return null
    const match = href.match(/[?&]trackId=(\d+)|track\/(\d+)/)
    return match ? match[1] || match[2] : null
}
