export type Locale = 'ru' | 'en'

const messages: Record<Locale, Record<string, string>> = {
    ru: {
        'artist.label': 'ИИ',
        'tooltip.deezer': 'У этого артиста есть треки, созданные с помощью ИИ',
        'tooltip.slopless': 'У этого артиста, скорее всего, есть треки, созданные с помощью ИИ',
    },
    en: {
        'artist.label': 'AI',
        'tooltip.deezer': 'This artist has tracks that were generated with the use of AI',
        'tooltip.slopless': 'This artist most probably has tracks that were generated with the use of AI',
    },
}

export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
    const msg = messages[locale]?.[key] ?? messages.en?.[key] ?? key
    if (!params) return msg
    return msg.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`))
}
