const path = require('path');
const { Client, DefaultMediaReceiver } = require('castv2-client');
const { getFileType } = require('./file-utils');
const bonjour = require('bonjour')();
const EventEmitter = require('events').EventEmitter;

const eventEmitter = new EventEmitter();

const services = bonjour
  .find({ type: 'googlecast' })
  .on('up', service => onUp(service.addresses[0]));

function onUp(host) {
  const client = new Client();

  client.connect(host, () => {
    console.log('connected');

    eventEmitter.on('PLAY', media => {
      console.log(media);

      client.launch(DefaultMediaReceiver, (err, player) => {
        player.on('status', status => {
          console.log(status);
          console.log('status: ', status.playerState);
        });

        player.load(media, { autoplay: true }, (err, status) => {
          if (err) {
            console.error(err);
            return;
          }
          console.log('media loaded', status.playerState);
        });
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
  const path = decodeURI(req.url);
  const type = await getFileType(path);

  eventEmitter.emit('PLAY', {
    contentId: MEDIA_SERVER + path,
    contentType: type.mime,
    streamType: 'BUFFERED',
    metadata: {
      type: 0,
      metadataType: 0,
      title: 'testing',
      images: []
    }
  });
};
