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
const debug = require('debug')('block-stream');

class BlockStream extends stream.Transform {

  constructor(options) {

    options = Object.assign({}, BlockStream.defaults, options);
    options.objectMode = true;
    // options.highWaterMark = 1;

    super(options);

    this._readableState.objectMode = true;
    // this._readableState.highWaterMark = 1;

    this.blockSize = options.blockSize;
    this.minBlockSize = options.minBlockSize;
    this.bytesRead = 0;
    this.blocksRead = 0;
    this.bytesWritten = 0;
    this.blocksWritten = 0;

    this._lastChunk = null;

    debug( 'new %j', options )

  }

  _transform(chunk, encoding, next) {

    if(this._lastChunk) {
      debug('concat', this._lastChunk.length, '+', chunk.length)
      chunk = Buffer.concat([ this._lastChunk, chunk ])
    }

    let block = null
    let offset = 0

    debug( 'in', chunk.length )

    while(offset < chunk.length) {

      block = new Buffer(this.blockSize)

      this.blocksRead++;
      this.bytesRead += block.length;

      block.address = this.blocksRead - 1;
      block.position = block.address * this.blockSize;

      chunk.copy(block, 0, offset, offset + this.blockSize)
      offset = offset + this.blockSize

      debug( 'out', block.length )

      this.push(block)

      this.blocksWritten++;
      this.bytesWritten += block.length;

    }

    if(offset < chunk.length) {
      this._lastChunk = chunk.slice(offset)
    } else {
      this._lastChunk = null
    }

    next();

  }

  _flush(done) {

    if(!this._lastChunk) return done();

    const buffer = Buffer.alloc(this.blockSize)

    this._lastChunk.copy(buffer);
    this._lastChunk = null
    this.push(buffer);

    done();

  }

}

BlockStream.defaults = {
  blockSize: 4096,
  minBlockSize: 512
};

module.exports = BlockStream;
