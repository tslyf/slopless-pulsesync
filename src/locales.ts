export type Locale = 'ru' | 'en'

const messages: Record<Locale, Record<string, string>> = {
    ru: {
        'artist.label': 'ИИ',
        'tooltip.ai': 'У этого артиста есть треки, созданные с помощью ИИ',
        'track.label': 'ИИ',
        'tooltip.track_ai': 'Этот трек создан с помощью ИИ',
        'api_error.label': '⚠️ Slopless API',
        'api_error.tooltip': 'Сервер slopless.art недоступен. Проверка и пропуск ИИ-треков временно не работают.',
    },
    en: {
        'artist.label': 'AI',
        'tooltip.ai': 'This artist has tracks that were generated with the use of AI',
        'track.label': 'AI',
        'tooltip.track_ai': 'This track was generated with the use of AI',
        'api_error.label': '⚠️ Slopless API',
        'api_error.tooltip': 'The slopless.art server is unreachable. AI track detection is temporarily disabled.',
    },
}

export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
    const msg = messages[locale]?.[key] ?? messages.en?.[key] ?? key
    if (!params) return msg
    return msg.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`))
}
