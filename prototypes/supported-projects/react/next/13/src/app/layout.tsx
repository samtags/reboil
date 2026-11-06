import { ReboilState } from 'reboil/next'
import reboilConfig from '../../reboil.config'
import './styles.css'

export const metadata = { title: 'Reboil Next 13 compatibility' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ReboilState config={reboilConfig}>{children}</ReboilState>
      </body>
    </html>
  )
}
