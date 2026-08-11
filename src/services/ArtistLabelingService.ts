import SloplessApiService from './SloplessApiService'
import { t, type Locale } from '../locales'
import { DOM, extractArtistId, extractTrackId, getSettings, SCANNED_ATTR, unscanned } from '../utils'
import { getAddonSettings } from '@/pulsesync'
import addonConfig from '../../addon.config.mjs'

export type ElementInfo = {
    element: HTMLElement
    id: string
}

export type TrackElementInfo = ElementInfo & {
    artistIds: string[]
    hideBadge?: boolean
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

        const newArtistEls = Array.from(
            document.querySelectorAll<HTMLElement>(unscanned(DOM.artistProfileTitle, DOM.artistLinks, DOM.separatedArtists)),
        )

        const newTrackEls = Array.from(document.querySelectorAll<HTMLElement>(unscanned(DOM.trackLinks)))
        const playerTrackEls = Array.from(document.querySelectorAll<HTMLElement>(DOM.playerTrackTitle))
        const vibeTrackNode = document.querySelector<HTMLElement>(DOM.vibeTrackName)

        const allTrackEls = Array.from(new Set([...newTrackEls, ...playerTrackEls]))
        if (vibeTrackNode && !allTrackEls.includes(vibeTrackNode)) {
            allTrackEls.push(vibeTrackNode)
        }

        if (newArtistEls.length === 0 && allTrackEls.length === 0) {
            if (!settings.showArtistLabels) this.clearLabels('artist')
            if (!settings.showTrackLabels) this.clearLabels('track')
            return
        }

        newArtistEls.forEach(el => (el.dataset.sloplessScanned = 'true'))
        newTrackEls.forEach(el => (el.dataset.sloplessScanned = 'true'))

        const artistsToProcess = this.extractArtists(newArtistEls)
        const tracksToProcess = this.extractTracks(allTrackEls)

        if (settings.showArtistLabels) {
            await this.processArtists(artistsToProcess, settings)
        } else {
            this.clearLabels('artist')
        }

        if (settings.showTrackLabels) {
            await this.processTracks(tracksToProcess, settings)
        } else {
            this.clearLabels('track')
        }
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

    private extractArtists(elements: HTMLElement[]): ElementInfo[] {
        const artists: ElementInfo[] = []
        const vibeSpans: HTMLElement[] = []

        elements.forEach(el => {
            if (el.matches(DOM.separatedArtists)) {
                vibeSpans.push(el)
            } else {
                const id = extractArtistId(el instanceof HTMLAnchorElement ? el.href : location.href) || ''
                if (id !== '0' && id !== '') artists.push({ element: el, id })
            }
        })

        if (vibeSpans.length > 0) {
            // @ts-ignore
            const apiArtists = window.pulsesyncApi?.getCurrentTrack()?.artists || []
            if (vibeSpans.length === apiArtists.length) {
                vibeSpans.forEach((span, index) => {
                    artists.push({ element: span, id: String(apiArtists[index].id) })
                })
            }
        }
        return artists
    }

    private extractTracks(elements: HTMLElement[]): TrackElementInfo[] {
        const tracks: TrackElementInfo[] = []

        elements.forEach(el => {
            let id = ''
            let artistIds: string[] = []
            let isVibe = false

            if (el.matches(DOM.vibeTrackName)) {
                // @ts-ignore
                const currentTrack = window.pulsesyncApi?.getCurrentTrack()
                id = currentTrack ? String(currentTrack.id) : ''
                artistIds = currentTrack?.artists?.map((a: any) => String(a.id)) || []
                isVibe = true
            } else if (el instanceof HTMLAnchorElement) {
                id = extractTrackId(el.href) || ''
                const container = el.closest(DOM.trackContainer) || el.parentElement?.parentElement?.parentElement
                if (container) {
                    const artistNodes = Array.from(container.querySelectorAll<HTMLAnchorElement>(DOM.artistLinks))
                    artistIds = artistNodes.map(a => extractArtistId(a.href)).filter(Boolean) as string[]
                }
            }

            if (!id || id === '0') return

            if (el.dataset.sloplessTrackId !== id) {
                el.dataset.sloplessTrackId = id
                el.dataset.sloplessScanned = 'true'

                el.classList.remove('slopless-text-highlight')
                const oldLabel = el.querySelector(`.slopless-label-track`)
                if (oldLabel) oldLabel.remove()

                tracks.push({ element: el, id, artistIds, hideBadge: isVibe })
            }
        })

        return tracks
    }

    private async processArtists(artists: ElementInfo[], settings: ReturnType<typeof getSettings>) {
        if (artists.length === 0) return

        const uniqueIds = Array.from(new Set(artists.map(a => a.id)))
        const aiStatusMap = new Map<string, any>()

        await Promise.all(
            uniqueIds.map(async id => {
                aiStatusMap.set(id, await SloplessApiService.checkArtist(id, settings.artistThreshold))
            }),
        )

        for (const { element, id } of artists) {
            if (!document.body.contains(element)) continue

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

    private async processTracks(tracks: TrackElementInfo[], settings: ReturnType<typeof getSettings>) {
        if (tracks.length === 0) return

        const uniqueTracksMap = new Map<string, string[]>()
        tracks.forEach(t => {
            if (!uniqueTracksMap.has(t.id)) uniqueTracksMap.set(t.id, t.artistIds)
        })

        const aiStatusMap = new Map<string, any>()

        await Promise.all(
            Array.from(uniqueTracksMap.entries()).map(async ([id, artistIds]) => {
                aiStatusMap.set(id, await SloplessApiService.checkTrack(id, artistIds))
            }),
        )

        for (const { element, id, hideBadge } of tracks) {
            if (!document.body.contains(element)) continue

            const stats = aiStatusMap.get(id)
            if (!stats || !stats.isAi) continue

            element.classList.add('slopless-text-highlight')

            if (!hideBadge && !element.querySelector(`span.${this.SLOPLESS_LABEL}`)) {
                element.insertAdjacentElement(
                    'beforeend',
                    this.createLabel(settings.locale, 'track', {
                        score: stats.score,
                    }),
                )
            }
        }
    }

    protected clearLabels(type: 'artist' | 'track') {
        const labels = document.querySelectorAll(`span.slopless-label-${type}`)
        if (labels.length === 0) return

        labels.forEach(label => {
            const parent = label.parentElement
            if (parent) {
                parent.removeAttribute(SCANNED_ATTR)
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
        this.debouncedScan()

        const observer = new MutationObserver(() => {
            this.debouncedScan()
        })
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['href'],
            characterData: true,
        })

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
