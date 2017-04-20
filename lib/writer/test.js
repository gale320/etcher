const UDIF = require('udif')
const stream = require('stream')
const path = require('path')
const fs = require('fs')
const ImageWriter = require('./index')
const debug = require('debug')('test')

const imageFile = '/Users/Jonas/Downloads/Etcher-1.0.0-rc.2-darwin-x64.dmg'

UDIF.getUncompressedSize( imageFile, ( error, uncompressedSize ) => {

  if( error ) throw error;

  var iw = new ImageWriter({
    path: '/dev/rdisk2',
    flags: 'rs+',
    image: {
      stream: UDIF.createReadStream(imageFile),
      transform: new stream.PassThrough(),
      size: {
        original: fs.statSync(imageFile).size,
        final: {
          estimation: false,
          value: uncompressedSize
        }
      }
    }
  })

  iw.on('progress', (state) => {
    debug('progress', state)
  })

  iw.on('done', () => console.log('done'))
  iw.on('finish', () => console.log('finish'))

})
