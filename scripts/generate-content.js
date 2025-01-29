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
author: "${album.artistName}"
tracks:
${tracksMarkdown}
---
`;
}

// Function to generate markdown content for tracks
function generateTrackMarkdown(track) {
  return `---
title: "${track.trackName}"
album:
  title: "${track.collectionName}"
  link: "${track.collectionViewUrl}"
  image: "${track.artworkUrl100}"
purchase:
  itunes: "${track.trackViewUrl}"
song:
  m4a: "${track.previewUrl}"
coverimage: "${track.artworkUrl100}"
excerpt: "${track.trackName}"
description: "${track.trackName}"
author: "${track.artistName}"
---
`;
}

// Function to group tracks by album
function groupTracksByAlbum(tracks) {
  return tracks.reduce((acc, track) => {
    if (!acc[track.collectionId]) {
      acc[track.collectionId] = [];
    }
    acc[track.collectionId].push(track);
    return acc;
  }, {});
}

// Group tracks by album
const tracksByAlbum = groupTracksByAlbum(tracksData.results);

// Generate markdown files for albums
albumsData.results.forEach(album => {
  const albumTracks = tracksByAlbum[album.collectionId] || [];
  const albumMarkdown = generateAlbumMarkdown(album, albumTracks);
  const albumFilePath = path.join('content/album', `${album.collectionId}.md`);
  fs.writeFileSync(albumFilePath, albumMarkdown);
});

// Generate markdown files for tracks
tracksData.results.forEach(track => {
  const trackMarkdown = generateTrackMarkdown(track);
  const trackFilePath = path.join('content/song', `${track.trackId}.md`);
  fs.writeFileSync(trackFilePath, trackMarkdown);
});

console.log('Content generation complete.');
