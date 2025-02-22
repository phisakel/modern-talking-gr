const fs = require('fs');
const path = require('path');

// Read JSON data
const albumsData = JSON.parse(fs.readFileSync('data/mt-albums.json', 'utf8'));
const tracksData = JSON.parse(fs.readFileSync('data/mt-tracks.json', 'utf8'));

// Function to generate markdown content for albums
function generateAlbumMarkdown(album, tracks) {
  const tracksMarkdown = tracks.map(track => `  - title: "${track.trackName}"
    link: "${track.trackViewUrl}"
    preview: "${track.previewUrl}"`).join('\n');

  return `---
title: "${album.collectionName}"
album:
  link: "${album.collectionViewUrl}"
  image: "${album.artworkUrl100}"
purchase:
  itunes: "${album.collectionViewUrl}"
coverimage: "${album.artworkUrl100}"
excerpt: "${album.collectionName}"
description: "${album.collectionName}"
Description: "${album.collectionName}"
Date: "${album.releaseDate.substring(0,10)}"
author: "${album.artistName}"
tracks:
${tracksMarkdown}
---
`;
}

// Create content/albums directory if it doesn't exist
const contentDir = path.join(__dirname, 'content/albums');
if (!fs.existsSync(contentDir)) {
  fs.mkdirSync(contentDir, { recursive: true });
}

// Generate markdown files for each album
albumsData.results.forEach((album, index) => {
  const albumTracks = tracksData.results.filter(track => track.collectionId === album.collectionId);
  const markdownContent = generateAlbumMarkdown(album, albumTracks);
  const filePath = path.join(contentDir, `album-${album.releaseDate.substring(0,10)}-${album.collectionName.replace(' ','-')}.md`);
  fs.writeFileSync(filePath, markdownContent, 'utf8');
});