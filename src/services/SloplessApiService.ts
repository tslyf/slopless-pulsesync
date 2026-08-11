import { AI_TRACK_THRESHOLD, API_BASE } from '../utils'
import ApiStatusIndicator from './ApiStatusIndicator'

interface CacheItem {
    data: any
    timestamp: number
}
const cache = new Map<string, CacheItem>()
const pendingRequests = new Map<string, Promise<any>>()

const CACHE_TTL_SUCCESS = 60 * 60 * 1000
const CACHE_TTL_ERROR = 30 * 1000
const MAX_CACHE_SIZE = 1000

export default class SloplessApiService {
    private static async fetchWithCache(key: string, url: string) {
        if (cache.has(key)) {
            const item = cache.get(key)!
            const ttl = item.data == null ? CACHE_TTL_ERROR : CACHE_TTL_SUCCESS

            if (Date.now() - item.timestamp < ttl) return item.data
            cache.delete(key)
        }
        if (pendingRequests.has(key)) return pendingRequests.get(key)

        if (cache.size >= MAX_CACHE_SIZE) {
            const oldestKey = cache.keys().next().value
            if (oldestKey) cache.delete(oldestKey)
        }

        const request = fetch(url)
            .then(res => {
                if (!res.ok) throw new Error('API error')
                return res.json()
            })
            .then(data => {
                ApiStatusIndicator.hide()
                cache.set(key, { data, timestamp: Date.now() })
                return data
            })
            .catch(() => {
                ApiStatusIndicator.show()
                cache.set(key, { data: null, timestamp: Date.now() })
                return null
            })
            .finally(() => {
                pendingRequests.delete(key)
            })

        pendingRequests.set(key, request)
        return request
    }

    public static async checkArtist(artistId: string, customThreshold: number) {
        const data = await this.fetchWithCache(`artist_${artistId}`, `${API_BASE}/artist/${artistId}`)
        if (!data || data.totalTracks === 0) return { isAi: false }

        let realAiTracks = data.aiTracks
        if (data.aiTrackList && Array.isArray(data.aiTrackList)) {
            realAiTracks = 0
            data.aiTrackList.forEach((t: any) => {
                if (t.score > AI_TRACK_THRESHOLD) realAiTracks++

                const trackKey = `track_${t.id}`
                if (!cache.has(trackKey)) {
                    cache.set(trackKey, {
                        data: { score: t.score },
                        timestamp: Date.now(),
                    })
                }
            })
        }

        const percent = realAiTracks / data.totalTracks
        return {
            isAi: percent >= customThreshold,
            aiTracks: realAiTracks,
            totalTracks: data.totalTracks,
            percent: Math.round(percent * 100),
        }
    }

    public static async checkTrack(trackId: string, knownArtistIds: string[] = []) {
        const trackKey = `track_${trackId}`

        if (cache.has(trackKey)) {
            const cached = cache.get(trackKey)!
            if (Date.now() - cached.timestamp < CACHE_TTL_SUCCESS) {
                const data = cached.data
                if (!data || data.score === null) return { isAi: false, score: 0 }
                return {
                    isAi: data.score > AI_TRACK_THRESHOLD,
                    score: Math.round(data.score * 100),
                }
            }
        }

        let isDefinitivelyClean = false
        for (const aId of knownArtistIds) {
            const artistCache = cache.get(`artist_${aId}`)

            if (artistCache && artistCache.data && Date.now() - artistCache.timestamp < CACHE_TTL_SUCCESS) {
                const aiList = artistCache.data.aiTrackList || []
                const found = aiList.find((t: any) => String(t.id) === trackId)

                if (found) {
                    cache.set(trackKey, { data: { score: found.score }, timestamp: Date.now() })
                    return {
                        isAi: found.score > AI_TRACK_THRESHOLD,
                        score: Math.round(found.score * 100),
                    }
                }

                isDefinitivelyClean = true
            }
        }

        if (isDefinitivelyClean) {
            cache.set(trackKey, { data: { score: 0 }, timestamp: Date.now() })
            return { isAi: false, score: 0 }
        }

        const data = await this.fetchWithCache(trackKey, `${API_BASE}/track/${trackId}`)
        if (!data || data.score === null) return { isAi: false, score: 0 }

        return {
            isAi: data.score > AI_TRACK_THRESHOLD,
            score: Math.round(data.score * 100),
        }
    }

    public static async checkAlbum(albumId: string, customThreshold: number) {
        const data = await this.fetchWithCache(`album_${albumId}`, `${API_BASE}/album/${albumId}`)
        if (!data || data.totalTracks === 0) return { isAi: false }

        return { isAi: data.aiTracks / data.totalTracks >= customThreshold }
    }
}
