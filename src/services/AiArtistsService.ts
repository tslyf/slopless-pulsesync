type AiArtistsResponse = {
    deezer: {
        artists: number[]
        artists_100: number[]
        albums: number[]
        tracks: number[]
    }
    slopless: number[]
}

class AiArtistsService {
    private deezerArtists: Int32Array | null = null
    private deezerArtists100: Int32Array | null = null
    private deezerAlbums: Int32Array | null = null
    private deezerTracks: Int32Array | null = null
    private sloplessArtists: Int32Array | null = null

    private readonly SOURCE_URL = 'https://raw.githubusercontent.com/alexeyfv/slopless/refs/heads/main/data/v0.2.0.json.gz'
    private loading: Promise<void> | null = null

    public async ensureLoaded(): Promise<void> {
        if (this.deezerArtists) return
        if (this.loading) {
            await this.loading
            return
        }

        this.loading = (async () => {
            try {
                const response = await fetch(this.SOURCE_URL)
                const stream = response.body!.pipeThrough(new DecompressionStream('gzip'))
                const buffer = await new Response(stream).arrayBuffer()
                const json = JSON.parse(new TextDecoder().decode(buffer)) as AiArtistsResponse

                this.deezerArtists = new Int32Array(json.deezer.artists)
                this.deezerArtists100 = new Int32Array(json.deezer.artists_100)
                this.deezerAlbums = new Int32Array(json.deezer.albums)
                this.deezerTracks = new Int32Array(json.deezer.tracks)
                this.sloplessArtists = new Int32Array(json.slopless)

                console.log('[Slopless] Database loaded successfully')
            } catch (err) {
                console.error('[Slopless] Failed to load database:', err)
            } finally {
                this.loading = null
            }
        })()

        await this.loading
    }

    private static binarySearch(arr: Int32Array, id: number): boolean {
        if (!arr) return false
        let lo = 0
        let hi = arr.length - 1
        while (lo <= hi) {
            const mid = (lo + hi) >> 1
            const val = arr[mid]
            if (val === id) return true
            if (val < id) lo = mid + 1
            else hi = mid - 1
        }
        return false
    }

    public async hasDeezerArtist(artistId: string): Promise<boolean> {
        await this.ensureLoaded()
        return (
            AiArtistsService.binarySearch(this.deezerArtists!, Number(artistId)) ||
            AiArtistsService.binarySearch(this.deezerArtists100!, Number(artistId))
        )
    }

    public async hasDeezerArtist100(artistId: string): Promise<boolean> {
        await this.ensureLoaded()
        return AiArtistsService.binarySearch(this.deezerArtists100!, Number(artistId))
    }

    public async hasSlopless(artistId: string): Promise<boolean> {
        await this.ensureLoaded()
        return AiArtistsService.binarySearch(this.sloplessArtists!, Number(artistId))
    }

    public async getArtistSource(artistId: string): Promise<'deezer' | 'slopless' | null> {
        await this.ensureLoaded()
        if (
            AiArtistsService.binarySearch(this.deezerArtists!, Number(artistId)) ||
            AiArtistsService.binarySearch(this.deezerArtists100!, Number(artistId))
        )
            return 'deezer'
        if (AiArtistsService.binarySearch(this.sloplessArtists!, Number(artistId))) return 'slopless'
        return null
    }
}

export const AiArtistsServiceInstance = new AiArtistsService()
