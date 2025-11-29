#!/usr/bin/env python3
"""
Fetch complete track listings from iTunes API for all Modern Talking albums
"""

import json
import sqlite3
import urllib.request
import urllib.parse
import ssl
import time
from pathlib import Path

def fetch_album_tracks(collection_id):
    """Fetch all tracks for a specific album from iTunes API"""
    url = f"https://itunes.apple.com/lookup?id={collection_id}&entity=song&limit=200"
    
    try:
        # Create SSL context that doesn't verify certificates (for development)
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        
        with urllib.request.urlopen(url, context=context) as response:
            data = json.load(response)
            results = data.get('results', [])
            # First result is the collection itself, rest are tracks
            tracks = [r for r in results if r.get('wrapperType') == 'track']
            return tracks
    except Exception as e:
        print(f"  Error fetching album {collection_id}: {e}")
        return []

def main():
    # Connect to database
    db_path = Path(__file__).parent.parent / 'data' / 'modern_talking.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get all albums
    cursor.execute('SELECT collection_id, collection_name FROM albums ORDER BY collection_name')
    albums = cursor.fetchall()
    
    print(f"Fetching complete track data for {len(albums)} albums from iTunes API...")
    print("=" * 70)
    
    all_tracks = []
    total_new_tracks = 0
    
    for album_id, album_name in albums:
        # Check current track count
        cursor.execute('SELECT COUNT(*) FROM tracks WHERE collection_id = ?', (album_id,))
        current_count = cursor.fetchone()[0]
        
        print(f"\n{album_name} (ID: {album_id})")
        print(f"  Current tracks in DB: {current_count}")
        
        # Fetch from iTunes
        tracks = fetch_album_tracks(album_id)
        
        if tracks:
            print(f"  Tracks from iTunes: {len(tracks)}")
            
            # Import new tracks
            new_count = 0
            for track in tracks:
                # Skip if track already exists
                cursor.execute('SELECT COUNT(*) FROM tracks WHERE track_id = ?', 
                             (track.get('trackId'),))
                if cursor.fetchone()[0] > 0:
                    continue
                
                # Insert new track
                try:
                    cursor.execute('''
                        INSERT INTO tracks (
                            track_id, artist_id, collection_id, track_name, track_censored_name,
                            kind, wrapper_type, track_view_url, preview_url, artwork_url_30,
                            artwork_url_60, artwork_url_100, track_price, release_date,
                            track_explicitness, disc_count, disc_number, track_count, track_number,
                            track_time_millis, country, currency, primary_genre_name, is_streamable
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        track.get('trackId'),
                        track.get('artistId'),
                        track.get('collectionId'),
                        track.get('trackName'),
                        track.get('trackCensoredName'),
                        track.get('kind'),
                        track.get('wrapperType'),
                        track.get('trackViewUrl'),
                        track.get('previewUrl'),
                        track.get('artworkUrl30'),
                        track.get('artworkUrl60'),
                        track.get('artworkUrl100'),
                        track.get('trackPrice'),
                        track.get('releaseDate'),
                        track.get('trackExplicitness'),
                        track.get('discCount'),
                        track.get('discNumber'),
                        track.get('trackCount'),
                        track.get('trackNumber'),
                        track.get('trackTimeMillis'),
                        track.get('country'),
                        track.get('currency'),
                        track.get('primaryGenreName'),
                        1 if track.get('isStreamable') else 0
                    ))
                    new_count += 1
                    all_tracks.append(track)
                except sqlite3.IntegrityError:
                    pass  # Track already exists
            
            if new_count > 0:
                print(f"  ✓ Added {new_count} new tracks")
                total_new_tracks += new_count
            else:
                print(f"  ✓ All tracks already in database")
        
        # Be nice to the API
        time.sleep(0.5)
    
    conn.commit()
    
    # Get final statistics
    cursor.execute('SELECT COUNT(*) FROM tracks')
    total_tracks = cursor.fetchone()[0]
    
    print("\n" + "=" * 70)
    print(f"\nCompleted!")
    print(f"Total tracks in database: {total_tracks}")
    print(f"New tracks added: {total_new_tracks}")
    
    # Save all fetched tracks to JSON file for reference
    if all_tracks:
        output_file = Path(__file__).parent.parent / 'data' / 'mt-tracks-complete.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump({'results': all_tracks}, f, indent=2)
        print(f"\nSaved complete track data to: {output_file}")
    
    conn.close()

if __name__ == '__main__':
    main()
