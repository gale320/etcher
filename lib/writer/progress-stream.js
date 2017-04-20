const stream = require('stream');
const speedometer = require('speedometer');
const debug = require('debug')('progress-stream');

class ProgressStream extends stream.Transform {

  constructor(options) {

    options = options || {};
    options.objectMode = true;
    options.highWaterMark = 16;

    super(options);

    this.total = options.length || 0;
    this.timestep = options.time || 100;
    this.speed = speedometer(5);
    this.lastSpeed = 0;
    this.bytesRead = 0;
    this.started = 0;

    this.interval = null;

  }

  update() {
    const speed = this.speed()
    this.emit('progress', {
      percentage: ( this.bytesRead / this.total ),
      transferred: this.bytesRead,
      length: this.total,
      remaining: this.total - this.bytesRead,
      eta: ( this.total - this.bytesRead ) / speed,
      runtime: ( Date.now() / 1000 ) - this.started,
      delta: speed - this.lastSpeed,
      speed: speed,
      avgSpeed: this.bytesRead / (( Date.now() / 1000 ) - this.started),
    })
  }

  start() {
    this.started = Date.now() / 1000
    this.interval = setInterval(() => {
      this.update()
    }, this.timestep )
    this.update()
  }

  _transform(chunk, encoding, next) {
    if(!this.interval) this.start();
    debug('chunk', chunk.length)
    this.bytesRead += chunk.length;
    this.speed(chunk.length);
    next(null, chunk);
  }

  _flush(done) {
    clearInterval(this.interval);
    done();
  }

}

module.exports = ProgressStream
