const log = require('pino')().child({ server: 'media-server' });
const fs = require('fs');
const { statFileAsync, getFileType } = require('./file-utils');
const ffmpeg = require('fluent-ffmpeg');

function getRange(rangeHeader, fileSize) {
  if (!rangeHeader) {
    return null;
  }

  const parts = rangeHeader.replace(/bytes=/, '').split('-');
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

  return { start, end };
}

function getFileStream(path, range) {
  if (range) {
    return fs.createReadStream(path, range);
  }

  return fs.createReadStream(path);
}

function getHead(rangeHeader, fileSize, mimeType) {
  if (rangeHeader) {
    const { start, end } = getRange(rangeHeader, fileSize);
    const chunksize = end - start + 1;

    return {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': mimeType
    };
  }

  return {
    'Content-Length': fileSize,
    'Content-Type': mimeType
  };
}

module.exports = _ => async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const path = decodeURI(req.url);

  log.info('received request for', path);

  const stat = await statFileAsync(path);
  const contentType = await getFileType(path);
  const fileSize = stat.size;
  const range = req.headers.range;

  const head = getHead(
    req.headers.range,
    fileSize,
    contentType && contentType.mime
  );

  const file = getFileStream(path, getRange(req.headers.range, fileSize));

  const responseCode = range ? 206 : 200;

  res.writeHead(responseCode, head);

  file.pipe(res);
};
