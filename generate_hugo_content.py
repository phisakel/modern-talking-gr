#!/usr/bin/env python3
"""
Generate Hugo content files from Modern Talking database
Creates markdown files for albums and songs based on database records
"""

import sys
import os
from pathlib import Path
from datetime import datetime
sys.path.append(str(Path(__file__).parent / 'data'))

from query_db import ModernTalkingDB


def format_duration(millis):
    """Convert milliseconds to MM:SS format"""
    if not millis:
        return "0:00"
    seconds = millis / 1000
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{minutes}:{secs:02d}"


def sanitize_filename(text):
    """Sanitize text for use in filenames"""
    return text.replace('/', '-').replace('\\', '-').replace(':', '-')


def escape_yaml_string(text):
    """Escape quotes in YAML string values"""
    if not text:
        return text
    return str(text).replace('"', '\\"')


def generate_album_content(album, db, output_dir='content/album'):
    """Generate Hugo markdown file for an album"""
    os.makedirs(output_dir, exist_ok=True)
    
    filename = f"{album['collection_id']}.md"
    filepath = Path(output_dir) / filename
    
    # Get tracks for this album
    tracks = db.get_album_tracks(album['collection_id'])
    duration_minutes = db.get_album_duration(album['collection_id'])
    
    # Format duration properly
    duration_formatted = f"{duration_minutes:.2f}" if duration_minutes is not None else "0"
    
    content = f"""---
title: "{album['collection_name']}"
date: {album.get('release_date', datetime.now().isoformat())}
draft: false

# Album Information (from database: albums table)
collection_id: {album['collection_id']}
artist_id: {album['artist_id']}
artist_name: "{album['artist_name']}"
collection_name: "{album['collection_name']}"
collection_censored_name: "{album.get('collection_censored_name', album['collection_name'])}"
collection_type: "{album.get('collection_type', 'Album')}"
wrapper_type: "{album.get('wrapper_type', 'collection')}"

# URLs
collection_view_url: "{album.get('collection_view_url', '')}"
artist_view_url: "{album.get('artist_view_url', '')}"

# Artwork
artwork_url_60: "{album.get('artwork_url_60', '')}"
artwork_url_100: "{album.get('artwork_url_100', '')}"
coverimage: "{album.get('artwork_url_100', '/images/stage.jpg')}"

# Pricing
collection_price: {album.get('collection_price', 0)}
currency: "{album.get('currency', 'USD')}"
country: "{album.get('country', 'USA')}"

# Content Rating
collection_explicitness: "{album.get('collection_explicitness', 'notExplicit')}"
content_advisory_rating: "{album.get('content_advisory_rating', '')}"

# Metadata
track_count: {album.get('track_count', len(tracks))}
actual_track_count: {len(tracks)}
primary_genre_name: "{album.get('primary_genre_name', 'Pop')}"
release_date: "{album.get('release_date', '')}"
copyright: "{album.get('copyright', '').replace('"', "'")}"
total_duration_minutes: {duration_formatted}

# Hugo Fields
excerpt: "Album by {album['artist_name']}"
description: |
  {album['collection_name']} by {album['artist_name']}
  Released: {album.get('release_date', 'Unknown')[:10]}
  Tracks: {album.get('track_count', len(tracks))}
  Genre: {album.get('primary_genre_name', 'Pop')}

# Purchase Links
purchase:
  itunes: "{album.get('collection_view_url', '')}"
  spotify: "https://open.spotify.com/search/{album['collection_name'].replace(' ', '%20')}"
  amazon: "https://amazon.com/s?k={album['collection_name'].replace(' ', '+')}"

# Hugo Taxonomy
categories: ["albums"]
tags: ["{album['artist_name'].lower().replace(' ', '-')}", "{album.get('primary_genre_name', 'Pop').lower()}"]
---

## {album['collection_name']}

**Artist:** {album['artist_name']}  
**Released:** {album.get('release_date', 'Unknown')[:10]}  
**Genre:** {album.get('primary_genre_name', 'Pop')}  
**Tracks:** {album.get('track_count', len(tracks))}  
**Duration:** {int(duration_minutes) if duration_minutes else 0} minutes

{album.get('copyright', '').replace('"', "'")}

### Track Listing

"""
    
    # Add track listing
    current_disc = None
    track_player_id = 1
    for track in tracks:
        if track['disc_count'] and track['disc_count'] > 1:
            if current_disc != track['disc_number']:
                current_disc = track['disc_number']
                content += f"\n**Disc {current_disc}**\n\n"
        
        duration = format_duration(track['track_time_millis'])
        track_link = f"/song/{track['track_id']}/"
        
        # Add track number and title
        content += f"{track['track_number']}. [{track['track_name']}]({track_link}) - {duration}"
        
        # Add jPlayer if preview URL exists - all on one line to preserve markdown list
        if track.get('preview_url'):
            preview_url = track['preview_url']
            track_title = escape_yaml_string(track['track_name'])
            content += f' <span style="float:right;" id="{track_player_id}" class="song-player" data-src="{preview_url}" title="{track_title}"><span id="jquery_jplayer_{track_player_id}" class="jp-jplayer"></span><span id="jp_container_{track_player_id}" class="jp-audio-stream"><span class="jp-type-single"><span class="jp-gui jp-interface"><span class="jp-controls"><a href="javascript:;" class="jp-play" tabindex="1"><i class="fa fa-play"></i></a> <a href="javascript:;" class="jp-pause" tabindex="1"><i class="fa fa-pause"></i></a></span></span></span></span></span>'
            track_player_id += 1
        
        content += "\n"
    
    content += f"\n\n[View on Apple Music]({album.get('collection_view_url', '#')})\n"
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return filepath


def generate_song_content(track, output_dir='content/song'):
    """Generate Hugo markdown file for a song"""
    os.makedirs(output_dir, exist_ok=True)
    
    filename = f"{track['track_id']}.md"
    filepath = Path(output_dir) / filename
    
    duration_formatted = format_duration(track.get('track_time_millis', 0))
    
    # Escape all string values for YAML
    track_name_escaped = escape_yaml_string(track['track_name'])
    artist_name_escaped = escape_yaml_string(track['artist_name'])
    collection_name_escaped = escape_yaml_string(track['collection_name'])
    
    content = f"""---
title: "{track_name_escaped}"
date: {track.get('release_date', datetime.now().isoformat())}
draft: false

# Track Information (from database: tracks table)
track_id: {track['track_id']}
artist_id: {track['artist_id']}
collection_id: {track['collection_id']}
artist_name: "{artist_name_escaped}"
collection_name: "{collection_name_escaped}"
track_name: "{track_name_escaped}"
track_censored_name: "{escape_yaml_string(track.get('track_censored_name', track['track_name']))}"
track_kind: "{track.get('kind', 'song')}"
wrapper_type: "{track.get('wrapper_type', 'track')}"

# URLs
track_view_url: "{track.get('track_view_url', '')}"
collection_view_url: "{track.get('collection_view_url', '')}"
artist_view_url: "{track.get('artist_view_url', '')}"
preview_url: "{track.get('preview_url', '')}"

# Artwork
artwork_url_30: "{track.get('artwork_url_30', '')}"
artwork_url_60: "{track.get('artwork_url_60', '')}"
artwork_url_100: "{track.get('artwork_url_100', '')}"
coverimage: "{track.get('artwork_url_100', '/images/stage.jpg')}"

# Pricing
track_price: {track.get('track_price', 0)}
currency: "{track.get('currency', 'USD')}"
country: "{track.get('country', 'USA')}"

# Content Rating
track_explicitness: "{track.get('track_explicitness', 'notExplicit')}"

# Track Position
disc_count: {track.get('disc_count', 1)}
disc_number: {track.get('disc_number', 1)}
track_count: {track.get('track_count', 0)}
track_number: {track.get('track_number', 0)}

# Duration
track_time_millis: {track.get('track_time_millis', 0)}
track_duration_formatted: "{duration_formatted}"

# Metadata
primary_genre_name: "{track.get('primary_genre_name', 'Pop')}"
release_date: "{track.get('release_date', '')}"
is_streamable: {str(track.get('is_streamable', False)).lower()}

# Audio File
song:
  preview: "{track.get('preview_url', '')}"

# Album Reference
album:
  title: "{collection_name_escaped}"
  link: "/album/{track['collection_id']}/"
  image: "{track.get('artwork_url_60', '/images/stage-small.jpg')}"

# Hugo Fields
excerpt: "{track_name_escaped} by {artist_name_escaped}"
description: |
  {track_name_escaped} by {artist_name_escaped}
  From the album: {collection_name_escaped}
  Duration: {duration_formatted}

# Purchase Links
purchase:
  itunes: "{track.get('track_view_url', '')}"
  spotify: "https://open.spotify.com/search/{escape_yaml_string(track['track_name']).replace(' ', '%20')}"
  amazon: "https://amazon.com/s?k={escape_yaml_string(track['track_name']).replace(' ', '+')}"

# Hugo Taxonomy
categories: ["songs"]
tags: ["{track['artist_name'].lower().replace(' ', '-')}", "{track.get('primary_genre_name', 'Pop').lower()}", "{track['collection_name'].lower().replace(' ', '-')}"]
---

## {track['track_name']}

**Artist:** {track['artist_name']}  
**Album:** [{track['collection_name']}](/album/{track['collection_id']}/)  
**Track:** {track.get('track_number', 'N/A')} of {track.get('track_count', 'N/A')}  
**Duration:** {duration_formatted}  
**Released:** {track.get('release_date', 'Unknown')[:10]}  
**Genre:** {track.get('primary_genre_name', 'Pop')}

"""
    
    content += f"\n[View on Apple Music]({track.get('track_view_url', '#')})\n"
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return filepath


def generate_artist_content(artist, output_dir='content/artists'):
    """Generate Hugo markdown file for an artist"""
    os.makedirs(output_dir, exist_ok=True)
    
    filename = f"{artist['artist_id']}.md"
    filepath = Path(output_dir) / filename
    
    content = f"""---
title: "{artist['artist_name']}"
date: {datetime.now().isoformat()}
draft: false

# Artist Information (from database: artists table)
artist_id: {artist['artist_id']}
artist_name: "{artist['artist_name']}"
amg_artist_id: {artist.get('amg_artist_id', 0)}
artist_view_url: "{artist.get('artist_view_url', '')}"

# Display Fields
coverimage: "/images/stage.jpg"
excerpt: "{artist['artist_name']} - Artist Profile"
description: "Complete discography and information about {artist['artist_name']}"

# Statistics (from database)
total_albums: {artist.get('total_albums', 0)}
total_tracks: {artist.get('total_tracks', 0)}
first_release: "{artist.get('first_release', 'Unknown')}"
latest_release: "{artist.get('latest_release', 'Unknown')}"

# Hugo Taxonomy
categories: ["artists"]
tags: ["{artist['artist_name'].lower().replace(' ', '-')}"]
---

## {artist['artist_name']}

**Total Albums:** {artist.get('total_albums', 0)}  
**Total Tracks:** {artist.get('total_tracks', 0)}  
**First Release:** {artist.get('first_release', 'Unknown')[:10]}  
**Latest Release:** {artist.get('latest_release', 'Unknown')[:10]}

[View on Apple Music]({artist.get('artist_view_url', '#')})
"""
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return filepath


def main():
    """Generate all Hugo content from database"""
    print("Generating Hugo content from Modern Talking database...\n")
    print("=" * 60)
    
    # Database is in data/ subdirectory
    db_path = Path(__file__).parent / 'data' / 'modern_talking.db'
    
    with ModernTalkingDB(str(db_path)) as db:
        # Generate artist content
        print("\nGenerating artist content...")
        artists = db.get_artist_stats()
        for artist in artists:
            filepath = generate_artist_content(artist)
            print(f"  ✓ Created: {filepath}")
        
        # Generate album content
        print("\nGenerating album content...")
        albums = db.get_all_albums()
        for album in albums:
            filepath = generate_album_content(album, db)
            print(f"  ✓ Created: {filepath}")
        
        # Generate song content
        print("\nGenerating song content...")
        # Get all albums first, then tracks for each
        albums = db.get_all_albums()
        track_count = 0
        for album in albums:
            tracks = db.get_album_tracks(album['collection_id'])
            for track in tracks:
                # Add collection name to track
                track['collection_name'] = album['collection_name']
                track['artist_name'] = album['artist_name']
                filepath = generate_song_content(track)
                track_count += 1
                if track_count % 10 == 0:
                    print(f"  Generated {track_count} songs...")
        
        print(f"  ✓ Created {track_count} song files")
    
    print("\n" + "=" * 60)
    print("\nContent generation complete!")
    print(f"\nGenerated:")
    print(f"  • {len(artists)} artist(s) in content/artists/")
    print(f"  • {len(albums)} albums in content/album/")
    print(f"  • {track_count} songs in content/song/")
    print("\nRun 'hugo server' to preview your site!")


if __name__ == '__main__':
    main()
