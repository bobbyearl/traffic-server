const express = require('express')
const thumbnailGenerator = require('hls-live-thumbnails').ThumbnailGenerator;
const path = require('path');
const fs = require('fs-extra');
const glob = require('glob');

const feeds = require('./feeds/cameras-2018-08-26.json');
const PORT = process.env.PORT || 5000;

function generateThumb(id, request, response) {
  const feature = feeds.features.find(feature => feature.id === id);
  const thumbs = new thumbnailGenerator({
    playlistUrl: feature.properties.http_url,
    outputDir: './thumbs',
    tempDir: './thumbs-tmp',
    initialThumbnailCount: 1,
    thumbnailWidth: request.query['w'] || 360,
  });

  const emitter = thumbs.getEmitter();

  emitter.on('newThumbnail', (thumb) => {
    thumbs.destroy();
    const ts = (new Date()).getTime();
    const file = `./thumbs-by-id/${id}/${ts}-${thumb.name}`;

    fs.copySync(`./thumbs/${thumb.name}`, file);
    response.sendFile(path.resolve(file));
  });

  emitter.on('error', () => {
    thumbs.destroy();
    response.send('Error generating thumbnail');      
  });
}

express()
  .get('/thumbnail/:id', (request, response) => {
    const id = request.params.id;
    const latest = glob.sync(`./thumbs-by-id/${id}/*`)
      .sort()
      .pop();

    if (latest) {
      const ts = (new Date()).getTime();
      const tsFile = path.basename(latest, path.extname(latest))
        .split('-')
        .shift();
      const age = ts - tsFile;

      if (age < 60000) {
        console.log(`Sent cached file.`, id, latest, age);
        response.sendFile(path.resolve(latest));
      } else {
        console.log(`Cache out of date.`, id, latest, age);
        generateThumb(id, request, response);
      }

    } else {
      console.log('No cache exists', id);
      generateThumb(id, request, response);
    }
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))