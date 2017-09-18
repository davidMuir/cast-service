const micro = require('micro');
const pino = require('pino')();
const mediaServer = require('./media-server');
const graphServer = require('./graph-server');
const castServer = require('./cast-server');

createServer(mediaServer, 5000, 'media');
createServer(graphServer, 5005, 'graph', {
  basePath: '/media/david/SAMSUNG/Videos'
});
createServer(castServer, 5010, 'cast');

function createServer(server, port, name, options = null) {
  return micro(server(options)).listen(port, () =>
    pino.info(`started ${name} server on ${port}`)
  );
}
