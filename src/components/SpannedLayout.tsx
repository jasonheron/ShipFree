// src/components/SpannedLayout.tsx
"use client";

// Define the types for the props this component receives
type Media = { id: string; file_url: string; file_type: string; };

interface SpannedLayoutProps {
  mediaItem: Media | null;
  screenIndex: number;
  totalScreens: number;
}

export default function SpannedLayout({ mediaItem, screenIndex, totalScreens }: SpannedLayoutProps) {
  // If there's no media, just show a blank placeholder
  if (!mediaItem) {
    return <div className="w-full h-full bg-gray-900"></div>;
  }

  // This calculation determines which slice of the wide media to show.
  const objectPosition = totalScreens > 1 ? `${(screenIndex / (totalScreens - 1)) * 100}% 50%` : '50% 50%';

  // This style object makes the media element wide enough to span all screens
  // and then positions it correctly so only the relevant slice is visible.
  const mediaStyle = {
    width: `${totalScreens * 100}%`,
    height: '100%',
    maxWidth: 'none',
    objectFit: 'cover' as const,
    objectPosition: objectPosition,
    position: 'absolute' as const,
    left: `-${screenIndex * 100}%`,
  };

  if (mediaItem.file_type.startsWith("video")) {
    return <video src={mediaItem.file_url} style={mediaStyle} autoPlay muted loop />;
  } else {
    return <img src={mediaItem.file_url} style={mediaStyle} alt="" />;
  }
}
