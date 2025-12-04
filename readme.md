# modern-talking-gr

A Hugo-powered website dedicated to Modern Talking, featuring a comprehensive database of albums, tracks, and artist information.

## Overview

This site showcases the complete Modern Talking discography with 37 albums and 580 tracks, featuring high-resolution album artwork, 30-second audio previews via jPlayer, and direct purchase links to iTunes, Spotify, Amazon, and Apple Music.

## Features

- **Album Pages**: Grid and detail views with 600x600 high-res artwork
- **Track Listings**: Inline jPlayer audio previews for each track
- **Song Pages**: Individual song details with metadata and purchase options
- **Audio Player**: jQuery jPlayer integration for streaming iTunes previews
- **Responsive Design**: Bootstrap 3 framework with custom styling
- **Database-Driven**: Python scripts generate Hugo content from SQLite database

## Tech Stack

- **Hugo**: v0.139.3 static site generator
- **Database**: SQLite with Modern Talking discography data
- **Audio**: jPlayer for m4a preview playback
- **CSS Framework**: Bootstrap 3
- **Icons**: Font Awesome 4.2.0
- **Content Generation**: Python scripts with database queries

## Project Structure

```
├── content/          # Generated markdown files
│   ├── album/        # 37 album pages
│   ├── song/         # 580 track pages
│   ├── artists/      # Artist profiles
│   └── bio/          # Biography content
├── layouts/          # Hugo templates (migrated from theme)
│   ├── album/        # Album list and single templates
│   ├── song/         # Song list and single templates
│   └── partials/     # Reusable template components
├── static/           # Static assets (CSS, JS, images)
├── data/             # SQLite database (gitignored)
├── scripts/          # Content generation scripts
│   ├── generate-content.js
│   └── generate-albums.js
└── hugo.yaml         # Hugo configuration

```

## Development

### Generate Content from Database

```bash
python3 generate_hugo_content.py
```

This script:
- Queries the SQLite database for albums and tracks
- Generates markdown files with proper YAML frontmatter
- Adds inline jPlayer controls to album track listings
- Escapes special characters in YAML strings

### Run Development Server

```bash
hugo server --buildDrafts
```

Site will be available at `http://localhost:1313/`

### Build for Production

```bash
hugo
```

Output goes to `public/` directory (gitignored)

## Database Schema

The SQLite database (`modern_talking.db`) contains:
- Albums table with artwork URLs, release dates, prices
- Tracks table with preview URLs, durations, track numbers
- Artist information and metadata
- Genre and collection data

## Layout System

Site uses custom layouts in the root `layouts/` directory (no theme dependency):
- High-resolution images via iTunes CDN (600x600)
- Bootstrap button-styled purchase links
- Inline audio players with right-aligned controls
- HTML in markdown enabled for jPlayer integration

## Deployment

Configured for Netlify deployment via `netlify.toml`
