import type { Metadata } from "next"
import "./styles-v2.css"

export const metadata: Metadata = {
  title: "dt.mr-salih.uk — iGCSE D&T Systems",
  description: "Pupil revision site for Edexcel iGCSE D&T Systems",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,500..700,50..100;1,9..144,500..700,50..100&family=Nunito:wght@500;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
