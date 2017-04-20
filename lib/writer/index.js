/*
 * Copyright 2017 resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const stream = require('stream');
const ProgressStream = require('./progress-stream');
const Pipage = require('pipage');
const BlockMap = require('blockmap');
const BlockStream = require('./block-stream');
const BlockWriteStream = require('./block-write-stream');
const ChecksumStream = require('./checksum-stream');
const debug = require('debug')('image-writer');

module.exports = function What(options) {

  var image = options.image
  var source = image.stream
  var progressStream = null

  // if(image.size.final.estimation) {
  //   progressStream = new ProgressStream({
  //     length: image.size.original,
  //     time: 500
  //   });
  //   source = source.pipe( progressStream )
  // }

  // var isPassThrough = image.transform instanceof stream.PassThrough

  // if(image.transform && !isPassThrough) {
  //   source = source.pipe( image.transform )
  // }

  // if(!image.size.final.estimation) {
  //   progressStream = new ProgressStream({
  //     length: image.size.final.value,
  //     time: 500
  //   });
  //   source = source.pipe( progressStream )
  // }

  if(image.bmap) {
    debug('bmap')
    var blockMap = BlockMap.parse(image.bmap);
    source = source.pipe( new BlockMap.FilterStream( blockMap ) )
  } else {
    debug('blockstream')
    source = source.pipe( new BlockStream({ blockSize: 4096 }) )
  }

  var target = new BlockWriteStream({
    fd: options.fd,
    path: options.path,
    flags: options.flags,
    mode: options.mode
  })

  // progressStream.on('progress', (state) => {
  //   state.type = 'write'
  //   target.emit('progress', state)
  // })

  return source.pipe( target )

}

// // class ImageWriter extends Pipage {

//   // constructor(options) {

// module.exports = function what(options) {

//     // super({
//     //   objectMode: true,
//     // });

//     this.image = options.image;
//     this.blockMap = null;

//     if(!(this.image.transform instanceof stream.PassThrough)) {
//       this.prepend(this.image.transform);
//     }

//     // let progressStream = null;

//     // if(this.image.size.final.estimation) {
//     //   progressStream = new ProgressStream({
//     //     length: this.image.size.original,
//     //     time: 500
//     //   });
//     //   this.prepend(progressStream);
//     // } else {
//     //   progressStream = new ProgressStream({
//     //     length: this.image.size.final.value,
//     //     time: 500
//     //   });
//     //   this.append(progressStream);
//     // }

//     // progressStream.on('progress', (state) => {
//     //   state.type = 'write';
//     //   debug('progress %j', state)
//     //   this.emit('progress', state);
//     // })

//     if(this.image.bmap) {
//       debug('bmap')
//       this.blockMap = BlockMap.parse(this.image.bmap);
//       this.append(new BlockMap.FilterStream(this.blockMap));
//     } else {
//       // debug('blockstream')
//       // this.append(new BlockStream());
//     }

//     this.readStream = this.image.stream;
//     this.writeStream = new BlockWriteStream({
//       fd: options.fd,
//       path: options.path,
//       flags: options.flags,
//       mode: options.mode
//     });

//     this.bind(this.readStream, 'error')
//     this.bind(this.writeStream, 'error')

//     this.readStream
//       .pipe(this.writeStream)

//   }

// // }

// // module.exports = ImageWriter;
