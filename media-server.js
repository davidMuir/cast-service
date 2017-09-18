const log = require('pino')().child({ server: 'media-server' });
const fs = require('fs');
const { statFileAsync, getFileType } = require('./file-utils');

module.exports = _ => async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const path = decodeURI(req.url);

  log.info('received request for', path);

  const stat = await statFileAsync(path);
  const contentType = await getFileType(path);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(path, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType.mime
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType.mime
    };

    res.writeHead(200, head);
    fs.createReadStream(path).pipe(res);
  }
};
