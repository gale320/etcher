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

const _ = require('lodash');
const stream = require('stream');
const fs = require('fs');
const debug = require('debug')('block-write-stream');

class BlockWriteStream extends stream.Writable {

  constructor(options) {

    options = Object.assign({}, BlockWriteStream.defaults, options);
    options.objectMode = true;
    // options.highWaterMark = 32;

    debug('block-write-stream %j', options)

    super(options);

    this._writableState.highWaterMark = 1;

    this.fs = options.fs;
    this.fd = options.fd;
    this.path = options.path;
    this.flags = options.flags;
    this.mode = options.mode;
    this.autoClose = options.autoClose;

    this.position = 0;
    this.bytesRead = 0;
    this.blocksRead = 0;
    this.bytesWritten = 0;
    this.blocksWritten = 0;

    this.closed = false;
    this.destroyed = false;

    this.once('finish', function() {
      if (this.autoClose) {
        this.close();
      }
    })

    this.open();

  }

  _handleWrite(chunk, next) {

    this.blocksRead++;
    this.bytesRead += chunk.length;
    this.position = _.isNil(chunk.position) ? this.position : chunk.position;

    this.fs.write(this.fd, chunk, 0, chunk.length, this.position, (error, bytesWritten) => {
      // debug( 'write', error || bytesWritten )
      if(error) {
        if(this.autoClose) {
          this.destroy();
        }
        next(error);
      } else {
        this.bytesWritten += bytesWritten;
        this.blocksWritten++;
        next();
      }
    })

    this.position += chunk.length;

  }

  _write(chunk, encoding, next) {
    if(!_.isNil(this.fd)) {
      debug('_write', chunk.length, '@', chunk.address )
      this._handleWrite(chunk, next);
    } else {
      debug('_write:open', chunk.length, '@', chunk.address )
      this.once('open', () => {
        this._handleWrite(chunk, next);
      });
    }
  }

  open() {

    if(!_.isNil(this.fd)) {
      return;
    }

    this.fs.open(this.path, this.flags, this.mode, (error, fd) => {
      if(error) {
        if(this.autoClose) {
          this.destroy();
        }
        this.emit('error', error);
      } else {
        this.fd = fd;
        this.emit('open', fd);
      }
    })

  }

  close(callback) {

    if(callback) {
      this.once('close', callback);
    }

    if(this.closed || _.isNil(this.fd)) {
      if(_.isNil(this.fd)) {
        this.once('open', () => {
          this.close();
        });
      } else {
        process.nextTick(() => {
          this.emit('close');
        });
      }
      return;
    }

    this.closed = true;

    this.fs.close(this.fd, (error) => {
      if(error) {
        this.emit('error', error);
      } else {
        this.emit('close');
      }
    });

    this.fd = null;

  }

  destroy() {
    if(this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.close();
  }

}

BlockWriteStream.defaults = {
  fs: fs,
  fd: null,
  path: null,
  flags: 'w',
  mode: 0o666,
  autoClose: true
};

module.exports = BlockWriteStream;
