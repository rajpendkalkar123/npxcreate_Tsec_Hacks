import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CropLock: Tokenized Agri-Liquidity',
    short_name: 'CropLock',
    description: 'Self-custody wallet for digitizing agricultural value chains through eWR tokenization.',
    start_url: '/',
    display: 'standalone', // This hides the browser address bar to make it feel like a native app
    background_color: '#ffffff',
    theme_color: '#2e7d32', // An agri-themed green color
    icons: [
      {
        src: '/icon.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'maskable', // Allows the icon to look good on different Android shapes
      },
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
  }
}