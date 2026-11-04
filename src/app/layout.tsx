import type { Metadata, Viewport } from 'next'
import '@fontsource-variable/public-sans'
import '@fontsource-variable/source-serif-4'
import './globals.css'
import { THEME_INIT_SCRIPT, ThemeProvider } from '@/contexts/theme'

export const metadata: Metadata = {
  title: 'EstudAI',
  description: 'Painel central de estudos: o que estudar hoje, na semana e no ano',
  appleWebApp: { capable: true, title: 'EstudAI', statusBarStyle: 'black' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f7f9' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1219' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-theme é definido por um script antes da pintura; por isso o React não deve estranhar a diferença
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
