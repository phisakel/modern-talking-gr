#!/usr/bin/env python3
"""
Remove duplicate albums from database, keeping the best version
"""

import sqlite3
from pathlib import Path

def remove_duplicate_albums():
    """Remove duplicate albums, keeping the one with most tracks or latest release"""
    db_path = Path(__file__).parent.parent / 'data' / 'modern_talking.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Find duplicates
    cursor.execute('''
        SELECT collection_name, COUNT(*) as count, GROUP_CONCAT(collection_id) as ids
        FROM albums
        GROUP BY collection_name
        HAVING count > 1
        ORDER BY collection_name
    ''')
    
    duplicates = cursor.fetchall()
    
    print(f"Found {len(duplicates)} duplicate album titles")
    print("=" * 70)
    
    albums_to_delete = []
    
    for album_name, count, ids_str in duplicates:
        ids = [int(id.strip()) for id in ids_str.split(',')]
        
        print(f"\n{album_name}: {count} versions")
        
        # Get details for each version
        versions = []
        for album_id in ids:
            cursor.execute('''
                SELECT collection_id, release_date, 
                       (SELECT COUNT(*) FROM tracks WHERE collection_id = ?) as track_count
                FROM albums
                WHERE collection_id = ?
            ''', (album_id, album_id))
            versions.append(cursor.fetchone())
        
        # Sort by track count (desc), then release date (desc)
        versions.sort(key=lambda x: (x[2] or 0, x[1] or ''), reverse=True)
        
        # Keep the first one (best version)
        keep_id = versions[0][0]
        delete_ids = [v[0] for v in versions[1:]]
        
        for v in versions:
            status = "KEEP" if v[0] == keep_id else "DELETE"
            print(f"  {status}: ID {v[0]} - {v[2] or 0} tracks - {v[1] or 'No date'}")
        
        albums_to_delete.extend(delete_ids)
    
    if albums_to_delete:
        print("\n" + "=" * 70)
        print(f"\nDeleting {len(albums_to_delete)} duplicate albums...")
        
        for album_id in albums_to_delete:
            # Delete associated tracks
            cursor.execute('DELETE FROM tracks WHERE collection_id = ?', (album_id,))
            tracks_deleted = cursor.rowcount
            
            # Delete from album_genres
            cursor.execute('DELETE FROM album_genres WHERE collection_id = ?', (album_id,))
            
            # Delete album
            cursor.execute('DELETE FROM albums WHERE collection_id = ?', (album_id,))
            
            print(f"  ✓ Deleted album {album_id} and {tracks_deleted} associated tracks")
        
        conn.commit()
        
        # Show final stats
        cursor.execute('SELECT COUNT(*) FROM albums')
        total_albums = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM tracks')
        total_tracks = cursor.fetchone()[0]
        
        print("\n" + "=" * 70)
        print(f"\nFinal database:")
        print(f"  Albums: {total_albums}")
        print(f"  Tracks: {total_tracks}")
    else:
        print("\nNo duplicates to remove!")
    
    conn.close()

if __name__ == '__main__':
    remove_duplicate_albums()
