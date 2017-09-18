const log = require('pino')().child({ server: 'graph-server' });
const path = require('path');
const { readdirAsyncWithStats, getFileType } = require('./file-utils');

async function createGraph(basePath) {
  const dir = await readdirAsyncWithStats(basePath);

  return {
    path: basePath,
    directories: await Promise.all(
      dir
        .filter(x => x.isDirectory)
        .map(async x => createGraph(path.join(basePath, x.path)))
    ),
    files: await Promise.all(
      dir.filter(x => !x.isDirectory).map(async x =>
        Object.assign({}, x, {
          type: await getFileType(path.join(basePath, x.path))
        })
      )
    )
  };
}

module.exports = ({ basePath }) => async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  log.info('received request');
  const graph = await createGraph(basePath);

  return graph;
};
