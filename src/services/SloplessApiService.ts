import { AI_TRACK_THRESHOLD, API_BASE } from '../utils';
import ApiStatusIndicator from './ApiStatusIndicator';

interface CacheItem { data: any; timestamp: number }
const cache = new Map<string, CacheItem>();
const pendingRequests = new Map<string, Promise<any>>();

export default class SloplessApiService {
    private static async fetchWithCache(key: string, url: string) {
        if (cache.has(key)) {
            const item = cache.get(key)!;
            if (Date.now() - item.timestamp < 3600000) return item.data;
            cache.delete(key);
        }
        if (pendingRequests.has(key)) return pendingRequests.get(key);

        const request = fetch(url)
            .then(res => {
                if (!res.ok) throw new Error('API error');
                return res.json();
            })
            .then(data => {
                ApiStatusIndicator.hide();
                cache.set(key, { data, timestamp: Date.now() });
                return data;
            })
            .catch(() => {
                ApiStatusIndicator.show();
                cache.set(key, { data: null, timestamp: Date.now() });
                return null;
            })
            .finally(() => {
                pendingRequests.delete(key);
            });

        pendingRequests.set(key, request);
        return request;
    }

    public static async checkArtist(artistId: string, customThreshold: number): Promise<boolean> {
        const data = await this.fetchWithCache(`artist_${artistId}`, `${API_BASE}/artist/${artistId}`);
        if (!data) return false;

        if (data.totalTracks > 0) {
            return (data.aiTracks / data.totalTracks) >= customThreshold;
        }
        return false;
    }

    public static async checkTrack(trackId: string): Promise<boolean> {
        const data = await this.fetchWithCache(`track_${trackId}`, `${API_BASE}/track/${trackId}`);
        if (!data) return false;

        return data.score !== null && data.score > AI_TRACK_THRESHOLD;
    }

    public static async checkAlbum(albumId: string, customThreshold: number): Promise<boolean> {
        const data = await this.fetchWithCache(`album_${albumId}`, `${API_BASE}/album/${albumId}`);
        if (!data) return false;

        if (data.totalTracks > 0) {
            return (data.aiTracks / data.totalTracks) >= customThreshold;
        }
        return false;
    }
}