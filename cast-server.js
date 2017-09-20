const path = require('path');
const { Client, DefaultMediaReceiver } = require('castv2-client');
const { getFileType } = require('./file-utils');
const bonjour = require('bonjour')();
const EventEmitter = require('events').EventEmitter;
const log = require('pino')().child({ server: 'cast-server' });

const eventEmitter = new EventEmitter();

const services = bonjour
  .find({ type: 'googlecast' })
  .on('up', service => onUp(service.addresses[0]));

function onUp(host) {
  const client = new Client();

  client.connect(host, () => {
    log.info('connected');

    const media = {
      // Here you can plug an URL to any mp4, webm, mp3 or jpg file with the proper contentType.
      contentId:
        'http://192.168.1.126:5000/media/external-hdd/Videos/Anime/Eve no Jikan/output.mp4',
      contentType: 'video/mp4',
      streamType: 'BUFFERED', // or LIVE

      // Title and cover displayed while buffering
      metadata: {
        type: 0,
        metadataType: 0,
        title: 'Eve no Jikan - ep1',
        images: []
      },

      tracks: [
        {
          trackId: 1,
          type: 'TEXT',
          trackContentId:
            'http://192.168.1.126:5000/media/external-hdd/Videos/Anime/Eve no Jikan/out.vtt',
          trackContentType: 'text/vtt',
          name: 'English',
          language: 'en-US',
          subtype: 'SUBTITLES'
        }
      ]
    };

    eventEmitter.on('PLAY', () => {
      log.info('media', media);

      client.launch(DefaultMediaReceiver, (err, player) => {
        player.on('status', status => {
          log.info(status);
          log.info('status: ', status.playerState);
        });

        player.load(
          media,
          { autoplay: true, activeTrackIds: [1] },
          (err, status) => {
            if (err) {
              log.error(err);
              return;
            }
            log.info('media loaded', status.playerState);
          }
        );
      });
    });
  });
}

// const media = {
//   // Here you can plug an URL to any mp4, webm, mp3 or jpg file with the proper contentType.
//   contentId:
//     'http://192.168.1.123:3000/Videos/Animated/Big Hero 6 (2014)/Big.Hero.6.2014.1080p.BluRay.x264.YIFY.mp4',
//   contentType: 'video/web',
//   streamType: 'BUFFERED', // or LIVE
//
//   // Title and cover displayed while buffering
//   metadata: {
//     type: 0,
//     metadataType: 0,
//     title: 'Girls und Panzer Der Film',
//     images: []
//   }
// };

const MEDIA_SERVER = 'http://192.168.1.123:5000';

module.exports = _ => async (req, res) => {
  eventEmitter.emit('PLAY');

  return 'OK';
};
