import { ReboilState } from '@reboil/store/next'
import reboilConfig from '../../reboil.config'
import './styles.css'

export const metadata = { title: 'Reboil production package with Next.js 16' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ReboilState config={reboilConfig}>{children}</ReboilState>
      </body>
    </html>
  )
}
