const path = require('path');
const fs = require('fs');
const readChunk = require('read-chunk');
const fileType = require('file-type');

function readdirAsync(filepath) {
  return new Promise((resolve, reject) => {
    fs.readdir(filepath, (err, files) => {
      if (err) {
        return reject(err);
      }

      return resolve(files);
    });
  });
}

function statFileAsync(filepath) {
  return new Promise((resolve, reject) => {
    fs.stat(filepath, (err, stat) => {
      if (err) {
        return reject(err);
      }

      return resolve(stat);
    });
  });
}

async function getFileType(filepath) {
  var buffer = await readChunk(filepath, 0, 4100);

  return fileType(buffer);
}

async function readdirAsyncWithStats(filepath) {
  const files = await readdirAsync(filepath);

  return await Promise.all(
    files.map(async file => ({
      path: file,
      isDirectory: (await statFileAsync(
        path.join(filepath, file)
      )).isDirectory()
    }))
  );
}

module.exports = {
  statFileAsync,
  getFileType,
  readdirAsyncWithStats
};
