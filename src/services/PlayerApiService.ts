import { AiArtistsServiceInstance } from './AiArtistsService'
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
        for (const id of artistIds) {
            if (settings.threshold !== 'deezer_100') {
                if (
                    (await AiArtistsServiceInstance.hasDeezerArtist(id)) ||
                    (settings.threshold === 'any' && (await AiArtistsServiceInstance.hasSlopless(id)))
                ) {
                    isAi = true
                    break
                }
            } else {
                if (await AiArtistsServiceInstance.hasDeezerArtist100(id)) {
                    isAi = true
                    break
                }
            }
        }

        if (!isAi && settings.strictTracks) {
            if (await AiArtistsServiceInstance.hasDeezerTrack(trackId)) {
                isAi = true
            }
        }

        if (!isAi) return

        const isLiked = api.isTrackLiked(trackId, albumId)

        const delay = Math.floor(Math.random() * 500) + 300
        await new Promise(resolve => setTimeout(resolve, delay))

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
