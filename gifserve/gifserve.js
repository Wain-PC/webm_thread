const express = require('express');
const serveIndex = require('serve-index');
const config = require('config').get('webmthread');
const app = express();

const storagePath = config.webm2gif.storagePath;
// Serve URLs like /ftp/thing as public/ftp/thing
// The express.static serves the file contents
// The serveIndex is this module serving the directory
app.use('/', express.static(storagePath), serveIndex(storagePath, {'icons': true}));

app.listen(8080, () => console.log(`WebmThread Serve Static has started on port 8080 (serving ${storagePath})`));
