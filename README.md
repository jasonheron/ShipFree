# SmartScreens - Digital Signage Platform

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

A modern, web-based digital signage solution built with Next.js and Supabase. This platform allows for centralized management of media schedules and playback across multiple screens, with support for complex, synchronized, and extended display layouts.

## Key Features

-   **Multi-Screen Synchronization:** Group multiple physical screens together and control their content from a single dashboard.
-   **Advanced Layout Engine:**
    -   **Sync Mode:** Display different content on different screens within a group (e.g., layouts like `1-1-1` or `2-1`).
    -   **Spanned Layouts:** Treat multiple synchronized screens as a single canvas, spanning one piece of media across them (e.g., a layout of `3` on three screens).
    -   **Extend Mode:** Treat multiple monitors connected to a single player device as one continuous, ultra-widescreen display.
-   **Centralized Management:** A user-friendly dashboard to upload media, create screen groups, and build complex, time-based schedules.
-   **Custom Screen Ordering:** Drag-and-drop interface to define the physical order of screens within a group, ensuring layouts are rendered correctly.
-   **Offline-First Player:** The player application aggressively caches schedules and media files using IndexedDB, allowing for uninterrupted playback even if the network connection is lost.
-   **Real-time Updates:** Utilizes Supabase Realtime to push schedule updates to players instantly, with a leader-election mechanism to ensure smooth, synchronized transitions.

## Tech Stack

-   **Framework:** [Next.js](https://nextjs.org/) (App Router)
-   **Backend & Database:** [Supabase](https://supabase.com/)
    -   **Auth:** Manages user accounts.
    -   **PostgreSQL:** Main database for storing user data, screens, groups, and schedules.
    -   **Storage:** Hosts all uploaded media files (images, videos).
    -   **Realtime:** Powers the live synchronization between players in a `sync` group.
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Deployment:** [Vercel](https://vercel.com/)

## System Architecture

The project consists of two main parts: the management dashboard and the player application.

### 1. Management Dashboard

A standard Next.js web application where authenticated users can:
-   Manage their sites, screens, and license keys.
-   Group screens together and define their `sync_mode` (`sync` or `extend`).
-   Define the physical order of screens within a group.
-   Upload media files to Supabase Storage.
-   Create and edit schedules for each screen group using a visual editor.

### 2. Player Application (`/play/[screenId]`)

This is the core client-side application that runs on the physical digital signage players (e.g., a Raspberry Pi or a mini PC connected to a screen).

-   **Pairing:** Each player is paired to an account using a unique, one-time pairing code.
-   **Caching:** On startup, the player fetches its configuration and schedule. All media files and the schedule itself are stored locally in the browser's IndexedDB. This ensures that if the player reboots or loses internet, it can immediately start playing from its cache without contacting the server.
-   **Update Mechanism:** The player periodically checks a `last_updated` timestamp on its assigned screen group. If the server's timestamp is newer than the one it has cached, it triggers a full download of the new schedule and media, then reloads itself to apply the changes.
-   **Synchronization (`sync` mode):** Players in a `sync` group use Supabase's Realtime channels to communicate. One player is elected as the "leader" and is responsible for broadcasting "slide change" events to all other players in the group, ensuring they transition to the next item in the schedule at the exact same time.

## Getting Started

### Prerequisites

-   Node.js and npm (or yarn)
-   A Supabase account

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <your-repo-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Supabase:**
    -   Create a new project on Supabase.
    -   Use the SQL Editor to set up your tables (`screens_table`, `screen_groups`, `media_schedules`, etc.) and the required PostgreSQL functions (`get_group_for_screen`, `create_screen_with_license`).
    -   Find your Project URL and `anon` key in **Project Settings > API**.

4.  **Configure Environment Variables:**
    -   Create a `.env.local` file in the root of your project.
    -   Add your Supabase credentials:
        ```
        NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
        NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:3000`.

## Future Improvements

-   **Advanced User Roles:** Implement permissions for different users within an organization.
-   **Player Health Monitoring:** Add more detailed status reporting from players to the dashboard (e.g., online/offline status, current content, errors).
-   **Transition Effects:** Add configurable visual transitions between schedule items.
-   **More Layout Options:** Expand the layout engine to support more complex grid configurations.
