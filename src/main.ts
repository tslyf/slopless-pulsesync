import ArtistLabelingService from './services/ArtistLabelingService'
import PlayerApiService from './services/PlayerApiService'

async function initSlopless() {
    console.log('[Slopless] Initializing addon...')

    const labelingService = new ArtistLabelingService()
    await labelingService.start()

    const playerService = new PlayerApiService()
    playerService.start()

    console.log('[Slopless] Addon started successfully!')
}

initSlopless()
