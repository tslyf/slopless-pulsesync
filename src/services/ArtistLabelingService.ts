import SloplessApiService from './SloplessApiService'
import { t, type Locale } from '../locales'
import { DOM, extractArtistId, extractTrackId, getSettings } from '../utils'
import { getAddonSettings } from '@/pulsesync'
import addonConfig from '../../addon.config.mjs'

export type ElementInfo = {
    element: HTMLElement
    id: string
}

export default class ArtistLabelingService {
    protected SLOPLESS_LABEL = 'slopless-label'
    private scanTimeout: NodeJS.Timeout | null = null

    protected debouncedScan() {
        if (this.scanTimeout) {
            clearTimeout(this.scanTimeout)
        }
        this.scanTimeout = setTimeout(() => {
            void this.scan()
        }, 100)
    }

    protected async scan() {
        const settings = getSettings()
        const tasks: Promise<void>[] = []

        if (settings.showArtistLabels) {
            tasks.push(this.scanArtists(settings))
        } else {
            this.clearLabels('artist')
        }

        if (settings.showTrackLabels) {
            tasks.push(this.scanTracks(settings))
        } else {
            this.clearLabels('track')
        }

        await Promise.all(tasks)
    }

    protected injectStyles() {
        if (document.getElementById('slopless-styles')) return
        const style = document.createElement('style')
        style.id = 'slopless-styles'
        style.textContent = `
            .slopless-text-highlight,
            .slopless-text-highlight > span:not([class*="slopless-label"]) {
                color: rgb(239 68 68) !important;
            }
        `
        document.head.appendChild(style)
    }

    protected async scanArtists(settings: ReturnType<typeof getSettings>) {
        const titleElements = Array.from(document.querySelectorAll<HTMLElement>(DOM.artistProfileTitle))
        const linksElements = Array.from(document.querySelectorAll<HTMLAnchorElement>(DOM.artistLinks))

        const elements = [...titleElements, ...linksElements]

        const artists: ElementInfo[] = elements
            .filter(el => !el.dataset.sloplessScanned)
            .map(el => {
                el.dataset.sloplessScanned = 'true'
                const id = extractArtistId(el instanceof HTMLAnchorElement ? el.href : location.href) || ''
                return { element: el, id: id }
            })
            .filter(a => a.id !== '0' && a.id !== '')

        const vibeSpans = Array.from(document.querySelectorAll<HTMLElement>(DOM.separatedArtists))
        // @ts-ignore
        const apiArtists = window.pulsesyncApi?.getCurrentTrack()?.artists || []

        if (vibeSpans.length > 0 && vibeSpans.length === apiArtists.length) {
            vibeSpans.forEach((span, index) => {
                artists.push({ element: span, id: String(apiArtists[index].id) })
            })
        }
        const validArtists = artists.filter(a => a.id !== '0' && a.id !== '')
        if (validArtists.length === 0) return

        const uniqueIds = Array.from(new Set(validArtists.map(a => a.id)))
        const aiStatusMap = new Map<string, any>()

        await Promise.all(
            uniqueIds.map(async id => {
                aiStatusMap.set(id, await SloplessApiService.checkArtist(id, settings.artistThreshold))
            }),
        )

        for (const { element, id } of validArtists) {
            const stats = aiStatusMap.get(id)
            if (!stats || !stats.isAi) continue
            if (element.querySelector(`span.${this.SLOPLESS_LABEL}`)) continue

            element.classList.add('slopless-text-highlight')

            element.insertAdjacentElement(
                'beforeend',
                this.createLabel(settings.locale, 'artist', {
                    ai: stats.aiTracks,
                    total: stats.totalTracks,
                    percent: stats.percent,
                }),
            )
        }
    }

    protected async scanTracks(settings: ReturnType<typeof getSettings>) {
        const linksElements = Array.from(document.querySelectorAll<HTMLAnchorElement>(DOM.trackLinks))

        const validTracks: ElementInfo[] = linksElements
            .filter(el => !el.dataset.sloplessScanned)
            .map(el => {
                el.dataset.sloplessScanned = 'true'
                return { element: el, id: extractTrackId(el.href) || '' }
            })
            .filter(t => t.id !== '0' && t.id !== '')

        if (validTracks.length === 0) return

        const uniqueIds = Array.from(new Set(validTracks.map(t => t.id)))
        const aiStatusMap = new Map<string, any>()

        await Promise.all(
            uniqueIds.map(async id => {
                aiStatusMap.set(id, await SloplessApiService.checkTrack(id))
            }),
        )

        for (const { element, id } of validTracks) {
            const stats = aiStatusMap.get(id)
            if (!stats || !stats.isAi) continue
            if (element.querySelector(`span.${this.SLOPLESS_LABEL}`)) continue

            element.classList.add('slopless-text-highlight')

            element.insertAdjacentElement(
                'beforeend',
                this.createLabel(settings.locale, 'track', {
                    score: stats.score,
                }),
            )
        }
    }

    protected clearLabels(type: 'artist' | 'track') {
        const labels = document.querySelectorAll(`span.slopless-label-${type}`)
        if (labels.length === 0) return

        labels.forEach(label => {
            const parent = label.parentElement
            if (parent) {
                parent.removeAttribute('data-slopless-scanned')
                parent.classList.remove('slopless-text-highlight')
            }
            label.remove()
        })
    }

    protected createLabel(locale: Locale, type: 'artist' | 'track', params?: Record<string, string | number>) {
        const borderColor = 'rgb(239 68 68)'
        const bgColor = 'rgba(239 68 68 / 0.12)'
        const textColor = 'rgb(239 68 68)'

        const span = document.createElement('span')
        span.className = `${this.SLOPLESS_LABEL} slopless-label-${type}`
        span.textContent = t(locale, type === 'artist' ? 'artist.label' : 'track.label')
        span.style.cssText = `margin: 0 6px; padding: 0 6px; border: 1px solid ${borderColor}; border-radius: 4px; background: ${bgColor}; color: ${textColor}; font-size: smaller;`
        span.title = t(locale, type === 'artist' ? 'tooltip.ai' : 'tooltip.track_ai', params)

        return span
    }

    public async start() {
        this.injectStyles()
        await this.scan()

        const observer = new MutationObserver(() => {
            this.debouncedScan()
        })
        observer.observe(document.body, { childList: true, subtree: true })

        try {
            const settingsStore = getAddonSettings(addonConfig.name)
            settingsStore.onChange(() => {
                this.debouncedScan()
            })
        } catch (e) {
            console.error('[Slopless] Failed to subscribe to settings', e)
        }
    }
}
