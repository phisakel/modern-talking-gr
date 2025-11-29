# Hugo Layout Updates - Database Integration

This document describes the updated Hugo layouts that display album and song information from the database.

## Updated Layouts

### Album Layouts

#### 1. `layouts/album/single.html` ✅
**Complete album detail page with:**
- Album artwork as cover image (from `artwork_url_100`)
- Artist name with link to artist view
- Release date, genre, track count
- Total duration in minutes
- Price in USD/other currency
- Explicit content warning (if applicable)
- Purchase links (iTunes, Spotify, Amazon, Apple Music)
- Copyright information
- Track listing in content area

**Database Fields Used:**
- `artwork_url_100` - Album cover image
- `artist_name` - Artist name display
- `artist_view_url` - Link to iTunes artist page
- `release_date` - Release date
- `primary_genre_name` - Genre classification
- `track_count` - Number of tracks
- `total_duration_minutes` - Total album duration
- `collection_price` - Album price
- `currency` - Currency code
- `collection_explicitness` - Content rating
- `collection_view_url` - iTunes album link
- `copyright` - Copyright text

#### 2. `layouts/album/summary.html` ✅
**Album card for list views with:**
- Album artwork thumbnail
- Album title with link
- Artist name
- Release date, genre, track count
- Price information
- Responsive grid layout

#### 3. `layouts/album/list.html` ✅ NEW
**Album catalog/library page with:**
- Grid layout (4 columns on large screens)
- Album thumbnails with artwork
- Genre filter buttons
- Sortable by release date
- Quick view buttons
- iTunes links

### Song/Track Layouts

#### 4. `layouts/song/single.html` ✅
**Complete track detail page with:**
- Track artwork as cover image
- Artist name with link
- Album reference with thumbnail and link
- Track position (disc #, track #)
- Duration formatted as MM:SS
- Release date and genre
- Price information
- Content rating (explicit/streamable)
- **Audio preview player** (30-second preview from iTunes)
- Purchase links (iTunes, Spotify, Amazon, Apple Music)
- Lyrics/content in main area

**Database Fields Used:**
- `artwork_url_100`, `artwork_url_60`, `artwork_url_30` - Artwork
- `artist_name`, `artist_view_url` - Artist info
- `album.title`, `album.link`, `album.image` - Album reference
- `disc_number`, `track_number`, `disc_count`, `track_count` - Position
- `track_duration_formatted` - Duration display
- `track_time_millis` - Duration raw value
- `release_date` - Release date
- `primary_genre_name` - Genre
- `track_price`, `currency` - Pricing
- `track_explicitness` - Content rating
- `is_streamable` - Streaming availability
- `preview_url` - 30-second audio preview
- `track_view_url` - iTunes track link

**Audio Preview Features:**
- Automatically uses `preview_url` from database
- Fallback to `song.preview` or `song.m4a` if available
- jPlayer integration for playback
- Play/pause controls

#### 5. `layouts/song/summary.html` ✅
**Track card for list views with:**
- Album artwork thumbnail (linked to album)
- Track title with link
- Artist name
- Album name with link
- Track number and duration
- Price information

#### 6. `layouts/song/list.html` ✅ NEW
**Track catalog page with:**
- Table layout with sortable columns
- Album artwork thumbnails
- Track title, artist, album
- Duration and price
- Preview availability indicator
- Explicit content badges
- Streamable indicators
- Pagination support

### Artist Layouts

#### 7. `layouts/artist/single.html` ✅
**Artist profile page with:**
- Statistics panel showing:
  - Total albums
  - Total tracks
  - First release year
  - Latest release year
  - Link to iTunes artist page
- Artist biography in content area
- **Discography section** - Lists all albums by artist
- Uses `artist_name` to filter albums

**Database Fields Used:**
- `artist_name` - Artist identification
- `total_albums` - Album count
- `total_tracks` - Track count
- `first_release` - First release date
- `latest_release` - Latest release date
- `artist_view_url` - iTunes link

## New Partials

### 8. `layouts/partials/track-meta.html` ✅
**Reusable track metadata component:**
- Artist name with link
- Album name with link
- Track position
- Duration
- Release date
- Genre
- Price
- Streaming availability

**Usage:**
```go-html-template
{{ partial "track-meta.html" . }}
```

### 9. `layouts/partials/album-meta.html` ✅
**Reusable album metadata component:**
- Artist name with link
- Release date
- Genre
- Track count
- Total duration
- Price
- Content rating
- Copyright

**Usage:**
```go-html-template
{{ partial "album-meta.html" . }}
```

## Key Features

### 🎨 Visual Enhancements
- ✅ High-resolution album artwork (100px, 60px, 30px)
- ✅ Cover images as page backgrounds
- ✅ Thumbnail grids for albums
- ✅ Responsive layouts (mobile-friendly)

### 🎵 Audio Features
- ✅ 30-second audio previews (from iTunes API)
- ✅ jPlayer integration
- ✅ Play/pause controls
- ✅ Fallback audio sources

### 🔗 Navigation
- ✅ Artist → Albums → Tracks linking
- ✅ Album artwork links to album page
- ✅ Artist links to iTunes
- ✅ Track links to album

### 💰 Commerce Features
- ✅ Price display (USD/other currencies)
- ✅ Purchase links (iTunes, Spotify, Amazon)
- ✅ "View on Apple Music" buttons
- ✅ Direct iTunes preview links

### 📊 Metadata Display
- ✅ Release dates (formatted properly)
- ✅ Track positions (disc #, track #)
- ✅ Duration formatting (MM:SS)
- ✅ Genre tags
- ✅ Track counts
- ✅ Explicit content badges
- ✅ Streamable indicators

### 🎯 Content Features
- ✅ Track listings on album pages
- ✅ Discography on artist pages
- ✅ Genre filtering
- ✅ Pagination on list pages
- ✅ Sortable tables

## Database Integration

All layouts use the database fields defined in the updated archetypes:

### Album Front Matter → Layout
```yaml
collection_id: 348891987          → Unique identifier
artist_name: "Modern Talking"     → Display artist
artwork_url_100: "https://..."    → Cover image
release_date: "2010-01-22..."     → Release date
track_count: 32                   → Track count
primary_genre_name: "Pop"         → Genre display
collection_price: 16.99           → Price display
purchase.itunes: "https://..."    → Purchase link
```

### Track Front Matter → Layout
```yaml
track_id: 348891988               → Unique identifier
track_name: "You're My Heart..."  → Title
artist_name: "Modern Talking"     → Artist
collection_id: 348891987          → Album reference
track_number: 1                   → Position
track_duration_formatted: "3:49"  → Duration
preview_url: "https://..."        → Audio preview
track_price: 1.29                 → Price
is_streamable: true               → Streaming badge
album.link: "/album/348891987/"   → Album link
```

## Template Examples

### Display Album Info
```go-html-template
<h1>{{ .Title }}</h1>
<p>by {{ .Params.artist_name }}</p>
<img src="{{ .Params.artwork_url_100 }}" alt="{{ .Title }}">
<p>Released: {{ dateFormat "January 2, 2006" .Params.release_date }}</p>
<p>Genre: {{ .Params.primary_genre_name }}</p>
<p>{{ .Params.track_count }} tracks - ${{ .Params.collection_price }}</p>
```

### Display Track with Audio Preview
```go-html-template
<h1>{{ .Title }}</h1>
<p>by {{ .Params.artist_name }}</p>

{{ if .Params.preview_url }}
<audio controls src="{{ .Params.preview_url }}">
  Your browser does not support audio.
</audio>
{{ end }}

<p>Duration: {{ .Params.track_duration_formatted }}</p>
<p>Track {{ .Params.track_number }} from 
   <a href="{{ .Params.album.link }}">{{ .Params.album.title }}</a>
</p>
```

### List Albums
```go-html-template
{{ range where .Site.RegularPages "Section" "album" }}
<div class="album-card">
  <img src="{{ .Params.artwork_url_100 }}" alt="{{ .Title }}">
  <h3><a href="{{ .RelPermalink }}">{{ .Title }}</a></h3>
  <p>{{ .Params.artist_name }}</p>
  <p>{{ dateFormat "2006" .Params.release_date }} - {{ .Params.track_count }} tracks</p>
</div>
{{ end }}
```

### Filter by Genre
```go-html-template
{{ range where .Site.RegularPages "Section" "album" }}
  {{ if eq .Params.primary_genre_name "Pop" }}
    {{ .Render "summary" }}
  {{ end }}
{{ end }}
```

## Responsive Design

All layouts are responsive using Bootstrap classes:

- **Desktop (lg):** 4-column grid for albums, full table for tracks
- **Tablet (md):** 3-column grid, responsive table
- **Mobile (sm):** 2-column grid, stacked table
- **Extra Small (xs):** 1-column, mobile-optimized

## Styling Recommendations

Add to your CSS for optimal display:

```css
.album-image {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.track-metadata dt {
  font-weight: 600;
}

.article-cover {
  background-size: cover;
  background-position: center;
  height: 400px;
}

.song-player {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}
```

## Testing

To test the layouts:

1. Generate content from database:
```bash
python3 generate_hugo_content.py
```

2. Start Hugo server:
```bash
hugo server -D
```

3. Visit pages:
- Albums: `http://localhost:1313/album/`
- Songs: `http://localhost:1313/song/`
- Single album: `http://localhost:1313/album/348891987/`
- Single song: `http://localhost:1313/song/348891988/`

## Browser Support

Audio preview features require:
- Modern browser with HTML5 audio support
- JavaScript enabled (for jPlayer)
- Internet connection (for iTunes preview URLs)

## Next Steps

Potential enhancements:
1. Add AJAX track loading
2. Implement playlist creation
3. Add search functionality
4. Create genre/year archive pages
5. Add social sharing buttons
6. Implement "Related Albums" section
7. Add album reviews/ratings

## Summary

All Hugo layouts have been updated to fully display database information:

✅ **5 layouts updated**: album single/summary, song single/summary, artist single
✅ **2 new list layouts**: album list, song list  
✅ **2 new partials**: track-meta, album-meta
✅ **Complete database integration**: All iTunes API fields displayed
✅ **Audio preview support**: 30-second previews from database
✅ **Commerce features**: Purchase links and pricing
✅ **Responsive design**: Mobile-friendly layouts
✅ **Rich metadata**: Release dates, genres, track counts, durations

The layouts are production-ready and work seamlessly with content generated from the database!
