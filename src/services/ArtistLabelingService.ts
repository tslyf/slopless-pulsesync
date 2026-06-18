import { AiArtistsServiceInstance } from './AiArtistsService'
import { t, type Locale } from '../locales'
import { DOM, extractArtistId, getSettings } from '../utils'

export type ArtistInfo = {
    element: HTMLElement
    id: string
}

export default class ArtistLabelingService {
    protected SLOPLESS_LABEL = 'slopless-label'

    protected async scan() {
        const titleElements = Array.from(document.querySelectorAll<HTMLElement>(DOM.artistProfileTitle))
        const linksElements = Array.from(document.querySelectorAll<HTMLAnchorElement>(DOM.artistLinks))

        const elements = [...titleElements, ...linksElements]

        const artists: ArtistInfo[] = elements
            .map(el => ({ element: el, id: extractArtistId(el instanceof HTMLAnchorElement ? el.href : location.href) || '' }))
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

        const settings = getSettings()

        const uniqueIds = Array.from(new Set(validArtists.map(a => a.id)))
        const aiStatusMap = new Map<string, { ai: boolean; source: 'deezer' | 'slopless' | null }>()

        await Promise.all(
            uniqueIds.map(async id => {
                let ai = false
                let source: 'deezer' | 'slopless' | null = null

                if (settings.threshold === 'any') {
                    source = await AiArtistsServiceInstance.getArtistSource(id)
                    ai = source !== null
                } else if (settings.threshold === 'deezer_any') {
                    ai = await AiArtistsServiceInstance.hasDeezerArtist(id)
                    source = ai ? 'deezer' : null
                } else {
                    ai = await AiArtistsServiceInstance.hasDeezerArtist100(id)
                    source = ai ? 'deezer' : null
                }
                aiStatusMap.set(id, { ai, source })
            }),
        )

        for (const { element, id } of artists) {
            const status = aiStatusMap.get(id)
            if (!status || !status.ai) continue

            if (element.querySelector(`span.${this.SLOPLESS_LABEL}`)) continue

            const label = this.createLabel(status.source, settings.locale)
            element.insertAdjacentElement('beforeend', label)
        }
    }

    protected createLabel(source: 'deezer' | 'slopless' | null, locale: Locale) {
        const isSlopless = source === 'slopless'
        const borderColor = isSlopless ? 'rgb(245 158 11)' : 'rgb(239 68 68)'
        const bgColor = isSlopless ? 'rgba(245 158 11 / 0.12)' : 'rgba(239 68 68 / 0.12)'
        const textColor = isSlopless ? 'rgb(245 158 11)' : 'rgb(239 68 68)'

        const span = document.createElement('span')
        span.className = this.SLOPLESS_LABEL
        span.textContent = t(locale, 'artist.label')
        span.style.cssText = `margin: 0 6px; padding: 0 6px; border: 1px solid ${borderColor}; border-radius: 4px; background: ${bgColor}; color: ${textColor}; font-size: smaller;`

        const tooltipKey = source === 'deezer' ? 'tooltip.deezer' : source === 'slopless' ? 'tooltip.slopless' : null
        if (tooltipKey) span.title = t(locale, tooltipKey)

        return span
    }

    public async start() {
        await this.scan()
        const observer = new MutationObserver(() => {
            void this.scan()
        })
        observer.observe(document.body, { childList: true, subtree: true })
    }
}
