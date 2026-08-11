import SloplessApiService from './SloplessApiService'
import { getSettings } from '../utils'

export default class PlayerApiService {
    public start(): void {
        // @ts-ignore
        window.pulsesyncApi?._waitForPlayer((player: any) => {
            console.log('[Slopless] Connected to player!')

            this.handleTrack()

            player.state?.queueState?.currentEntity?.onChange(() => {
                this.handleTrack()
            })
        })
    }

    private async handleTrack(): Promise<void> {
        // @ts-ignore
        const api = window.pulsesyncApi
        if (!api) return

        const trackMeta = api.getCurrentTrack()
        if (!trackMeta || !trackMeta.artists || trackMeta.artists.length === 0) return

        const settings = getSettings()
        if (settings.behavior === 'nothing') return

        const trackId = String(trackMeta.id)
        const albumId = trackMeta.albums?.[0]?.id ? String(trackMeta.albums[0].id) : undefined
        const artistIds = trackMeta.artists.map((a: any) => String(a.id))

        let isAi = false
        const mode = settings.detectionMode

        let hasAnyAiAuthor = false
        let allAuthorsAreAi = true

        if (mode !== 'track_only' && artistIds.length > 0) {
            for (const id of artistIds) {
                const res = await SloplessApiService.checkArtist(id, settings.artistThreshold)
                if (res.isAi) {
                    hasAnyAiAuthor = true
                } else {
                    allAuthorsAreAi = false
                }

                if (mode === 'paranoid' && hasAnyAiAuthor) break
            }
        } else {
            allAuthorsAreAi = false
        }

        if (mode === 'paranoid' && hasAnyAiAuthor) {
            isAi = true
        } else if (mode === 'balance' && allAuthorsAreAi) {
            isAi = true
        } else {
            const trackRes = await SloplessApiService.checkTrack(trackId)
            if (trackRes.isAi) {
                isAi = true
            } else if (albumId) {
                const albumRes = await SloplessApiService.checkAlbum(albumId, settings.artistThreshold)
                if (albumRes.isAi) isAi = true
            }
        }

        if (!isAi) return

        const isLiked = api.isTrackLiked(trackId, albumId)

        const delay = Math.floor(Math.random() * 500) + 300
        await new Promise(resolve => setTimeout(resolve, delay))

        const currentTrackId = String(api.getCurrentTrack()?.id)
        if (currentTrackId !== trackId) return

        const { behavior } = settings

        if ((behavior === 'dislike' || behavior === 'dislike_if_not_liked') && (!isLiked || behavior === 'dislike')) {
            api.dislikeTrack(trackId, { albumId })
            api.next()
        } else if (behavior === 'like') {
            api.likeTrack(trackId, { albumId })
        } else if ((behavior === 'skip' || behavior === 'skip_if_not_liked') && (!isLiked || behavior === 'skip')) {
            api.next()
        }
    }
}
