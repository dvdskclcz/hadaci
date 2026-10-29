import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Hádači.cz – Denní vědomostní dedukce',
        short_name: 'Hádači',
        description: 'Uhádni dnešní českou osobnost, památku či vynález na co nejméně stop!',
        start_url: '/',
        display: 'standalone',
        background_color: '#020617',
        theme_color: '#020617',
        orientation: 'portrait',
        icons: [
            {
                src: '/icon',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/apple-icon',
                sizes: '180x180',
                type: 'image/png',
            },
        ],
    }
}