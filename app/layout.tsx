import Header from '@/components/Header'
import './globals.css'
import { ThemeProvider } from 'next-themes'
import localFont from 'next/font/local'

export const metadata = {
  title: 'Orbit',
  description: 'Your friendly AI superconnector at the University of Calgary. I help you find exactly who you\'re looking for through a single warm intro.',
}

const fontHeading = localFont({
  src: '../public/fonts/Gambarino-Regular.woff2',
  variable: '--font-heading',
});
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={fontHeading.className}>
      <ThemeProvider
          enableSystem={false}
          attribute="class"
          defaultTheme="dark"
        >
        {/* <div className="container" style={{ padding: '50px 0 100px 0' }}> */}
        <Header />
        {children}
        {/* </div> */}
      </ThemeProvider>
      </body>
    </html>
  )
}
