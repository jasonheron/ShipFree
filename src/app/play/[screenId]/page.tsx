// src/app/play/[screenId]/page.tsx
"use client"; // This directive marks the component as a Client Component

import dynamic from 'next/dynamic'

// Dynamically import the Player component with Server-Side Rendering (SSR) turned off.
// This ensures it only ever renders on the client-side, fixing hydration errors.
const Player = dynamic(() => import('@/components/Player'), { ssr: false })

export default function PlayerPage() {
  return <Player />
}
