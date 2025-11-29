# Hugo Content Generation from Database

This document explains how the Hugo archetypes have been adapted to match the database schema and how to generate content automatically.

## Updated Archetypes

The Hugo archetypes have been updated to match the database schema:

### 1. Artist Archetype (`themes/stage/archetypes/artist.md`)

Includes fields from the `artists` table:
- `artist_id` - Unique artist identifier
- `artist_name` - Artist name
- `amg_artist_id` - AMG artist ID
- `artist_view_url` - iTunes artist URL
- Statistics: `total_albums`, `total_tracks`, `first_release`, `latest_release`

### 2. Album Archetype (`themes/stage/archetypes/album.md`)

Includes fields from the `albums` table:
- `collection_id` - Unique album identifier
- `collection_name` - Album title
- `artist_id`, `artist_name` - Artist reference
- `artwork_url_60`, `artwork_url_100` - Album artwork
- `collection_price`, `currency`, `country` - Pricing info
- `track_count` - Number of tracks
- `primary_genre_name` - Music genre
- `release_date` - Release date
- `copyright` - Copyright information
- Purchase links (iTunes, Spotify, Amazon)

### 3. Song Archetype (`themes/stage/archetypes/song.md`)

Includes fields from the `tracks` table:
- `track_id` - Unique track identifier
- `track_name` - Song title
- `artist_id`, `collection_id` - References
- `artwork_url_30`, `artwork_url_60`, `artwork_url_100` - Artwork
- `track_price` - Track price
- `disc_number`, `track_number` - Position in album
- `track_time_millis` - Duration in milliseconds
- `track_duration_formatted` - Duration as MM:SS
- `primary_genre_name` - Genre
- `preview_url` - 30-second preview URL
- `is_streamable` - Streaming availability
- Album reference with link

## Database to Hugo Mapping

### Field Mapping

| Database Field | Hugo Front Matter | Type |
|----------------|-------------------|------|
| `artist_id` | `artist_id` | integer |
| `collection_id` | `collection_id` | integer |
| `track_id` | `track_id` | integer |
| `artist_name` | `artist_name` | string |
| `collection_name` | `collection_name` / album.title | string |
| `track_name` | `track_name` / title | string |
| `artwork_url_100` | `coverimage` | URL |
| `preview_url` | `song.preview` | URL |
| `track_view_url` | `purchase.itunes` | URL |
| `primary_genre_name` | `tags` | taxonomy |
| `release_date` | `date` / `release_date` | datetime |

## Automatic Content Generation

Use the `generate_hugo_content.py` script to automatically create Hugo content from the database.

### Prerequisites

1. Create the database first:
```bash
cd data
python3 import_json_to_db.py
```

2. Ensure the script can access the database:
```bash
ls data/modern_talking.db
```

### Generate Content

From the project root:

```bash
python3 generate_hugo_content.py
```

This will create:
- `content/artists/{artist_id}.md` - Artist pages
- `content/album/{collection_id}.md` - Album pages with track listings
- `content/song/{track_id}.md` - Individual song pages

### Output Example

The script generates fully-populated markdown files:

**Album Page** (`content/album/348891987.md`):
```markdown
---
title: "25 Years of Disco-Pop"
collection_id: 348891987
artist_name: "Modern Talking"
track_count: 32
primary_genre_name: "Pop"
release_date: "2010-01-22T08:00:00Z"
artwork_url_100: "https://..."
purchase:
  itunes: "https://music.apple.com/..."
---

## 25 Years of Disco-Pop

Track Listing:
1. [You're My Heart, You're My Soul](/song/348891988/) - 3:49
2. [Cheri Cheri Lady](/song/348891989/) - 3:46
...
```

**Song Page** (`content/song/348891988.md`):
```markdown
---
title: "You're My Heart, You're My Soul"
track_id: 348891988
collection_id: 348891987
artist_name: "Modern Talking"
track_number: 1
track_duration_formatted: "3:49"
preview_url: "https://audio-ssl.itunes.apple.com/..."
---

## You're My Heart, You're My Soul

**Album:** [25 Years of Disco-Pop](/album/348891987/)
**Duration:** 3:49

<audio controls src="preview_url">...</audio>
```

## Manual Content Creation

To create content manually using the updated archetypes:

```bash
# Create an artist page
hugo new artists/thomas-anders.md

# Create an album page
hugo new album/the-first-album.md

# Create a song page
hugo new song/youre-my-heart.md
```

Then edit the generated files and fill in the database fields.

## Hugo Layouts Integration

### Accessing Database Fields in Templates

In your Hugo templates, access the database fields:

```go-html-template
<!-- layouts/album/single.html -->
<article>
  <h1>{{ .Title }}</h1>
  
  <!-- Album artwork -->
  {{ with .Params.artwork_url_100 }}
  <img src="{{ . }}" alt="{{ $.Title }}">
  {{ end }}
  
  <!-- Album info -->
  <p>Artist: {{ .Params.artist_name }}</p>
  <p>Released: {{ dateFormat "Jan 2, 2006" .Params.release_date }}</p>
  <p>Genre: {{ .Params.primary_genre_name }}</p>
  <p>Tracks: {{ .Params.track_count }}</p>
  
  <!-- Purchase links -->
  {{ with .Params.purchase }}
  <a href="{{ .itunes }}">Buy on iTunes</a>
  <a href="{{ .spotify }}">Listen on Spotify</a>
  {{ end }}
  
  <!-- Content (track listing) -->
  {{ .Content }}
</article>
```

```go-html-template
<!-- layouts/song/single.html -->
<article>
  <h1>{{ .Title }}</h1>
  
  <!-- Album link -->
  {{ with .Params.album }}
  <p>From: <a href="{{ .link }}">{{ .title }}</a></p>
  {{ end }}
  
  <!-- Track info -->
  <p>Track {{ .Params.track_number }} of {{ .Params.track_count }}</p>
  <p>Duration: {{ .Params.track_duration_formatted }}</p>
  
  <!-- Audio preview -->
  {{ with .Params.preview_url }}
  <audio controls src="{{ . }}">
    Your browser does not support the audio element.
  </audio>
  {{ end }}
  
  {{ .Content }}
</article>
```

### List Templates

```go-html-template
<!-- layouts/album/list.html -->
<h1>Albums</h1>

{{ range .Pages }}
<div class="album">
  <img src="{{ .Params.artwork_url_100 }}" alt="{{ .Title }}">
  <h2><a href="{{ .RelPermalink }}">{{ .Title }}</a></h2>
  <p>{{ .Params.artist_name }}</p>
  <p>{{ .Params.track_count }} tracks</p>
  <p>${{ .Params.collection_price }}</p>
</div>
{{ end }}
```

## Taxonomy Integration

The archetypes include Hugo taxonomies:

```yaml
categories: ["albums"]
tags: ["modern-talking", "pop", "dance"]
```

Access in templates:
```go-html-template
{{ range .Params.tags }}
  <span class="tag">{{ . }}</span>
{{ end }}
```

## Database Updates

When you update the database:

1. Re-import the data:
```bash
cd data
python3 import_json_to_db.py
```

2. Regenerate Hugo content:
```bash
python3 generate_hugo_content.py
```

3. Build Hugo site:
```bash
hugo
```

## Best Practices

1. **Use Collection/Track IDs as filenames** - Ensures uniqueness and easy reference
2. **Include all database fields** - Even if not displayed, useful for filtering/sorting
3. **Add computed fields** - Like `track_duration_formatted` for display
4. **Maintain relationships** - Album → Track links via `collection_id`
5. **Keep purchase links updated** - Generate from base URLs + IDs
6. **Use Hugo taxonomies** - Genre, artist tags for filtering

## Troubleshooting

### Content not generating
```bash
# Check database exists
ls -lh data/modern_talking.db

# Test database connection
cd data && python3 query_db.py
```

### Missing fields in templates
- Check archetype has the field defined
- Verify field name matches database schema
- Use `{{ printf "%#v" .Params }}` to debug available fields

### Broken links
- Ensure collection_id/track_id match between content files
- Check URL structure in Hugo config matches template links
- Verify `slug` or `url` not overriding default paths

## Summary

The Hugo archetypes now match the database schema, enabling:
- ✅ Automatic content generation from database
- ✅ Consistent field naming across DB and Hugo
- ✅ Rich metadata for albums and tracks
- ✅ Purchase links and preview audio
- ✅ Proper artist → album → track relationships
- ✅ Easy integration with Hugo templates

For more details, see:
- `data/DATABASE_README.md` - Database schema documentation
- `data/README.md` - Database usage guide
- Hugo documentation: https://gohugo.io/content-management/archetypes/
