var EventEmitter;
var __slice = Array.prototype.slice;

EventEmitter = (function() {

  function EventEmitter() {}

  EventEmitter.prototype.on = function(event, fn) {
    var _base, _ref, _ref2;
    if ((_ref = this.events) == null) this.events = {};
    if ((_ref2 = (_base = this.events)[event]) == null) _base[event] = [];
    return this.events[event].push(fn);
  };

  EventEmitter.prototype.off = function(event, fn) {
    var index, _ref;
    if (!((_ref = this.events) != null ? _ref[event] : void 0)) return;
    index = this.events[event].indexOf(fn);
    if (~index) return this.events[event].splice(index, 1);
  };

  EventEmitter.prototype.once = function(event, fn) {
    var cb;
    var _this = this;
    return this.on(event, cb = function() {
      _this.off(event, cb);
      return fn.apply(null, arguments);
    });
  };

  EventEmitter.prototype.emit = function() {
    var args, event, fn, _i, _len, _ref, _ref2;
    event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    if (!((_ref = this.events) != null ? _ref[event] : void 0)) return;
    _ref2 = this.events[event];
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      fn = _ref2[_i];
      fn.apply(null, args);
    }
  };

  return EventEmitter;

})();

var Bitstream, Buffer, BufferList, Stream;

Buffer = (function() {

  function Buffer(data) {
    this.data = data;
    this.length = this.data.length;
    this.timestamp = null;
    this.duration = null;
    this.final = false;
    this.discontinuity = false;
  }

  Buffer.allocate = function(size) {
    return new Buffer(new Uint8Array(size));
  };

  Buffer.prototype.copy = function() {
    var buffer;
    buffer = new Buffer(new Uint8Array(this.data));
    buffer.timestamp = this.timestamp;
    buffer.duration = this.duration;
    buffer.final = this.final;
    return buffer.discontinuity = this.discontinuity;
  };

  Buffer.prototype.slice = function(position, length) {
    if (position === 0 && length >= this.length) {
      return this;
    } else {
      return new Buffer(this.data.subarray(position, length));
    }
  };

  return Buffer;

})();

BufferList = (function() {

  function BufferList() {
    this.buffers = [];
    this.availableBytes = 0;
    this.availableBuffers = 0;
    this.bufferHighWaterMark = null;
    this.bufferLowWaterMark = null;
    this.bytesHighWaterMark = null;
    this.bytesLowWaterMark = null;
    this.onLowWaterMarkReached = null;
    this.onHighWaterMarkReached = null;
    this.onLevelChange = null;
    this.endOfList = false;
    this.first = null;
  }

  BufferList.prototype.copy = function() {
    var result;
    result = new BufferList();
    result.buffers = this.buffers.slice(0);
    result.availableBytes = this.availableBytes;
    result.availableBuffers = this.availableBuffers;
    return result.endOfList = this.endOfList;
  };

  BufferList.prototype.shift = function() {
    var result;
    result = this.buffers.shift();
    this.availableBytes -= result.length;
    this.availableBuffers -= 1;
    this.first = this.buffers[0];
    return result;
  };

  BufferList.prototype.push = function(buffer) {
    this.buffers.push(buffer);
    this.availableBytes += buffer.length;
    this.availableBuffers += 1;
    if (!this.first) this.first = buffer;
    return this;
  };

  BufferList.prototype.unshift = function(buffer) {
    this.buffers.unshift(buffer);
    this.availableBytes += buffer.length;
    this.availableBuffers += 1;
    this.first = buffer;
    return this;
  };

  return BufferList;

})();

Stream = (function() {
  var Float32, Float64, FromFloat32, FromFloat64, ToFloat32, ToFloat64;

  Float64 = new ArrayBuffer(8);

  Float32 = new ArrayBuffer(4);

  FromFloat64 = new Float64Array(Float64);

  FromFloat32 = new Float32Array(Float32);

  ToFloat64 = new Uint32Array(Float64);

  ToFloat32 = new Uint32Array(Float32);

  function Stream(list) {
    this.list = list;
    this.localOffset = 0;
    this.offset = 0;
  }

  Stream.prototype.copy = function() {
    var result;
    result = new Stream(this.list.copy);
    result.localOffset = this.localOffset;
    result.offset = this.offset;
    return result;
  };

  Stream.prototype.available = function(bytes) {
    return this.list.availableBytes - this.localOffset >= bytes;
  };

  Stream.prototype.advance = function(bytes) {
    this.localOffset += bytes;
    this.offset += bytes;
    while (this.list.first && (this.localOffset >= this.list.first.length)) {
      this.localOffset -= this.list.shift().length;
    }
    return this;
  };

  Stream.prototype.readUInt32 = function() {
    var a0, a1, a2, a3, buffer;
    buffer = this.list.first.data;
    if (buffer.length > this.localOffset + 3) {
      a0 = buffer[this.localOffset + 0];
      a1 = buffer[this.localOffset + 1];
      a2 = buffer[this.localOffset + 2];
      a3 = buffer[this.localOffset + 3];
      this.advance(4);
    } else {
      a0 = this.readUInt8();
      a1 = this.readUInt8();
      a2 = this.readUInt8();
      a3 = this.readUInt8();
    }
    return ((a0 << 24) >>> 0) + (a1 << 16) + (a2 << 8) + a3;
  };

  Stream.prototype.peekUInt32 = function(offset) {
    var a0, a1, a2, a3, buffer;
    if (offset == null) offset = 0;
    buffer = this.list.first.data;
    if (buffer.length > this.localOffset + offset + 3) {
      a0 = buffer[this.localOffset + offset + 0];
      a1 = buffer[this.localOffset + offset + 1];
      a2 = buffer[this.localOffset + offset + 2];
      a3 = buffer[this.localOffset + offset + 3];
    } else {
      a0 = this.peekUInt8(offset + 0);
      a1 = this.peekUInt8(offset + 1);
      a2 = this.peekUInt8(offset + 2);
      a3 = this.peekUInt8(offset + 3);
    }
    return ((a0 << 24) >>> 0) + (a1 << 16) + (a2 << 8) + a3;
  };

  Stream.prototype.readInt32 = function() {
    var a0, a1, a2, a3, buffer;
    buffer = this.list.first.data;
    if (buffer.length > this.localOffset + offset + 3) {
      a0 = buffer[this.localOffset + 0];
      a1 = buffer[this.localOffset + 1];
      a2 = buffer[this.localOffset + 2];
      a3 = buffer[this.localOffset + 3];
      this.advance(4);
    } else {
      a0 = this.readUInt8();
      a1 = this.readUInt8();
      a2 = this.readUInt8();
      a3 = this.readUInt8();
    }
    return (a0 << 24) + (a1 << 16) + (a2 << 8) + a3;
  };

  Stream.prototype.peekInt32 = function(offset) {
    var a0, a1, a2, a3, buffer;
    if (offset == null) offset = 0;
    buffer = this.list.first.data;
    if (buffer.length > this.localOffset + offset + 3) {
      a0 = buffer[this.localOffset + offset + 0];
      a1 = buffer[this.localOffset + offset + 1];
      a2 = buffer[this.localOffset + offset + 2];
      a3 = buffer[this.localOffset + offset + 3];
    } else {
      a0 = this.peekUInt8(offset + 0);
      a1 = this.peekUInt8(offset + 1);
      a2 = this.peekUInt8(offset + 2);
      a3 = this.peekUInt8(offset + 3);
    }
    return (a0 << 24) + (a1 << 16) + (a2 << 8) + a3;
  };

  Stream.prototype.readUInt16 = function() {
    var a0, a1, buffer;
    buffer = this.list.first.data;
    if (buffer.length > this.localOffset + 1) {
      a0 = buffer[this.localOffset + 0];
      a1 = buffer[this.localOffset + 1];
      this.advance(2);
    } else {
      a0 = this.readUInt8();
      a1 = this.readUInt8();
    }
    return (a0 << 8) + a1;
  };

  Stream.prototype.peekUInt16 = function(offset) {
    var a0, a1, buffer;
    if (offset == null) offset = 0;
    buffer = this.list.first.data;
    if (buffer.length > this.localOffset + offset + 1) {
      a0 = buffer[this.localOffset + offset + 0];
      a1 = buffer[this.localOffset + offset + 1];
    } else {
      a0 = this.peekUInt8(offset + 0);
      a1 = this.peekUInt8(offset + 1);
    }
    return (a0 << 8) + a1;
  };

  Stream.prototype.readInt16 = function() {
    var a0, a1, buffer;
    buffer = this.list.first.data;
    if (buffer.length > this.localOffset + 1) {
      a0 = buffer[this.localOffset + 0];
      a1 = buffer[this.localOffset + 1];
    } else {
      a0 = this.readInt8();
      a1 = this.readUInt8();
    }
    return (a0 << 8) + a1;
  };

  Stream.prototype.peekInt16 = function(offset) {
    var a0, a1, buffer;
    if (offset == null) offset = 0;
    buffer = this.list.first.data;
    if (buffer.length > this.localOffset + offset + 1) {
      a0 = buffer[this.localOffset + offset + 0];
      a1 = buffer[this.localOffset + offset + 1];
    } else {
      a0 = this.peekInt8(offset + 0);
      a1 = this.peekUInt8(offset + 1);
    }
    return (a0 << 8) + a1;
  };

  Stream.prototype.readUInt8 = function() {
    var a0;
    a0 = this.list.first.data[this.localOffset];
    this.localOffset += 1;
    this.offset += 1;
    if (this.localOffset === this.list.first.length) {
      this.localOffset = 0;
      this.buffers.shift();
    }
    return a0;
  };

  Stream.prototype.peekUInt8 = function(offset) {
    var buffer, i;
    if (offset == null) offset = 0;
    offset = this.localOffset + offset;
    i = 0;
    buffer = this.list.buffers[i].data;
    while (!(buffer.length > offset)) {
      offset -= buffer.length;
      buffer = this.list.buffers[++i].data;
    }
    return buffer[offset];
  };

  Stream.prototype.peekSafeUInt8 = function(offset) {
    var buffer, i, list, _ref;
    if (offset == null) offset = 0;
    offset = this.localOffset + offset;
    list = this.list.buffers;
    for (i = 0, _ref = list.length; i < _ref; i += 1) {
      buffer = list[i];
      if (buffer.length > offset) {
        return buffer.data[offset];
      } else {
        offset -= buffer.length;
      }
    }
    return 0;
  };

  Stream.prototype.readInt8 = function() {
    var a0;
    a0 = (this.list.first.data[this.localOffset] << 24) >> 24;
    this.advance(1);
    return a0;
  };

  Stream.prototype.peekInt8 = function(offset) {
    var buffer, i;
    if (offset == null) offset = 0;
    offset = this.localOffset + offset;
    i = 0;
    buffer = this.list.buffers[i].data;
    while (!(buffer.length > offset)) {
      offset -= buffer.length;
      buffer = this.list.buffers[++i].data;
    }
    return (buffer[offset] << 24) >> 24;
  };

  Stream.prototype.readFloat64 = function() {
    ToFloat64[1] = this.readUInt32();
    ToFloat64[0] = this.readUInt32();
    return FromFloat64[0];
  };

  Stream.prototype.readFloat32 = function() {
    ToFloat32[0] = this.readUInt32();
    return FromFloat32[0];
  };

  Stream.prototype.readString = function(length) {
    var i, result;
    result = [];
    for (i = 0; 0 <= length ? i < length : i > length; 0 <= length ? i++ : i--) {
      result.push(String.fromCharCode(this.readUInt8()));
    }
    return result.join('');
  };

  Stream.prototype.peekString = function(offset, length) {
    var i, result;
    result = [];
    for (i = 0; 0 <= length ? i < length : i > length; 0 <= length ? i++ : i--) {
      result.push(String.fromCharCode(this.peekUInt8(offset + i)));
    }
    return result.join('');
  };

  Stream.prototype.readBuffer = function(length) {
    var i, result, to;
    result = Buffer.allocate(length);
    to = result.data;
    for (i = 0; 0 <= length ? i < length : i > length; 0 <= length ? i++ : i--) {
      to[i] = this.readUInt8();
    }
    return result;
  };

  Stream.prototype.readSingleBuffer = function(length) {
    var result;
    result = this.list.first.slice(this.localOffset, length);
    this.advance(result.length);
    return result;
  };

  return Stream;

})();

Bitstream = (function() {

  function Bitstream(stream) {
    this.stream = stream;
    this.bitPosition = 0;
  }

  Bitstream.prototype.copy = function() {
    var result;
    result = new Bitstream(this.stream.copy());
    result.bitPosition = this.bitPosition;
    return result;
  };

  Bitstream.prototype.offset = function() {
    return 8 * this.stream.offset + this.bitPosition;
  };

  Bitstream.prototype.available = function(bits) {
    return this.stream.available((bits + 8 - this.bitPosition) / 8);
  };

  Bitstream.prototype.advance = function(bits) {
    this.bitPosition += bits;
    this.stream.advance(this.bitPosition >> 3);
    this.bitPosition = this.bitPosition & 7;
    return this;
  };

  Bitstream.prototype.align = function() {
    if (this.bitPosition !== 0) {
      this.bitPosition = 0;
      this.stream.advance(1);
    }
    return this;
  };

  Bitstream.prototype.readBig = function(bits) {
    var a, a0, a1, a2, a3, a4;
    a0 = this.stream.peekUInt8(0) * 0x0100000000;
    a1 = this.stream.peekUInt8(1) * 0x0001000000;
    a2 = this.stream.peekUInt8(2) * 0x0000010000;
    a3 = this.stream.peekUInt8(3) * 0x0000000100;
    a4 = this.stream.peekUInt8(4) * 0x0000000001;
    a = a0 + a1 + a2 + a3 + a4;
    a = a % Math.pow(2, 40 - this.bitPosition);
    a = a / Math.pow(2, 40 - this.bitPosition - bits);
    this.advance(bits);
    return a << 0;
  };

  Bitstream.prototype.peekBig = function(bits) {
    var a, a0, a1, a2, a3, a4;
    a0 = this.stream.peekUInt8(0) * 0x0100000000;
    a1 = this.stream.peekUInt8(1) * 0x0001000000;
    a2 = this.stream.peekUInt8(2) * 0x0000010000;
    a3 = this.stream.peekUInt8(3) * 0x0000000100;
    a4 = this.stream.peekUInt8(4) * 0x0000000001;
    a = a0 + a1 + a2 + a3 + a4;
    a = a % Math.pow(2, 40 - this.bitPosition);
    a = a / Math.pow(2, 40 - this.bitPosition - bits);
    return a << 0;
  };

  Bitstream.prototype.peekSafeBig = function(bits) {
    var a, a0, a1, a2, a3, a4;
    a0 = this.stream.peekSafeUInt8(0) * 0x0100000000;
    a1 = this.stream.peekSafeUInt8(1) * 0x0001000000;
    a2 = this.stream.peekSafeUInt8(2) * 0x0000010000;
    a3 = this.stream.peekSafeUInt8(3) * 0x0000000100;
    a4 = this.stream.peekSafeUInt8(4) * 0x0000000001;
    a = a0 + a1 + a2 + a3 + a4;
    a = a % Math.pow(2, 40 - this.bitPosition);
    a = a / Math.pow(2, 40 - this.bitPosition - bits);
    return a << 0;
  };

  Bitstream.prototype.read = function(bits) {
    var a;
    a = this.stream.peekUInt32(0);
    a = (a << this.bitPosition) >>> (32 - bits);
    this.advance(bits);
    return a;
  };

  Bitstream.prototype.readSmall = function(bits) {
    var a;
    a = this.stream.peekUInt16(0);
    a = ((a << this.bitPosition) & 0xFFFF) >>> (16 - bits);
    this.advance(bits);
    return a;
  };

  Bitstream.prototype.readOne = function() {
    var a;
    a = this.stream.peekUInt8(0);
    a = ((a << this.bitPosition) & 0xFF) >>> 7;
    this.advance(1);
    return a;
  };

  return Bitstream;

})();

var Queue;
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

Queue = (function() {

  __extends(Queue, EventEmitter);

  function Queue(decoder) {
    this.decoder = decoder;
    this.write = __bind(this.write, this);
    this.readyMark = 64;
    this.finished = false;
    this.buffering = true;
    this.buffers = [];
    this.decoder.on('data', this.write);
    this.decoder.readChunk();
  }

  Queue.prototype.write = function(buffer) {
    this.buffers.push(buffer);
    if (this.buffering) {
      if (this.buffers.length >= this.readyMark) {
        this.buffering = false;
        return this.emit('ready');
      } else {
        return this.decoder.readChunk();
      }
    }
  };

  Queue.prototype.read = function() {
    if (this.buffers.length === 0) return null;
    this.decoder.readChunk();
    return this.buffers.shift();
  };

  return Queue;

})();

var HTTPSource;
var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

HTTPSource = (function() {

  __extends(HTTPSource, EventEmitter);

  function HTTPSource(url) {
    this.url = url;
    this.chunkSize = 1 << 20;
    this.inflight = false;
    this.reset();
  }

  HTTPSource.prototype.start = function() {
    var _this = this;
    this.inflight = true;
    this.xhr = new XMLHttpRequest();
    this.xhr.onload = function(event) {
      _this.length = parseInt(_this.xhr.getResponseHeader("Content-Length"));
      _this.inflight = false;
      return _this.loop();
    };
    this.xhr.onerror = function(err) {
      _this.pause();
      return _this.emit('error', err);
    };
    this.xhr.onabort = function(event) {
      console.log("HTTP Aborted: Paused?");
      return _this.inflight = false;
    };
    this.xhr.open("HEAD", this.url, true);
    return this.xhr.send(null);
  };

  HTTPSource.prototype.loop = function() {
    var endPos;
    var _this = this;
    if (this.inflight || !this.length) {
      return this.emit('error', 'Something is wrong in HTTPSource.loop');
    }
    if (this.offset === this.length) {
      this.inflight = false;
      this.emit('end');
      return;
    }
    this.inflight = true;
    this.xhr = new XMLHttpRequest();
    this.xhr.onprogress = function(event) {
      return _this.emit('progress', (_this.offset + event.loaded) / _this.length * 100);
    };
    this.xhr.onload = function(event) {
      var buf, buffer, i, txt, _ref;
      if (_this.xhr.response) {
        buf = new Uint8Array(_this.xhr.response);
      } else {
        txt = _this.xhr.responseText;
        buf = new Uint8Array(txt.length);
        for (i = 0, _ref = txt.length; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
          buf[i] = txt.charCodeAt(i) & 0xff;
        }
      }
      buffer = new Buffer(buf);
      _this.offset += buffer.length;
      _this.emit('data', buffer, _this.offset === _this.length);
      _this.inflight = false;
      return _this.loop();
    };
    this.xhr.onerror = function(err) {
      _this.emit('error', err);
      return _this.pause();
    };
    this.xhr.onabort = function(event) {
      console.log("HTTP Aborted: Paused?");
      return _this.inflight = false;
    };
    this.xhr.open("GET", this.url, true);
    this.xhr.responseType = "arraybuffer";
    endPos = Math.min(this.offset + this.chunkSize, this.length);
    this.xhr.setRequestHeader("Range", "bytes=" + this.offset + "-" + endPos);
    this.xhr.overrideMimeType('text/plain; charset=x-user-defined');
    return this.xhr.send(null);
  };

  HTTPSource.prototype.pause = function() {
    this.inflight = false;
    if (this.xhr) return this.xhr.abort();
  };

  HTTPSource.prototype.reset = function() {
    this.pause();
    return this.offset = 0;
  };

  return HTTPSource;

})();

var Demuxer;
var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

Demuxer = (function() {
  var formats;

  __extends(Demuxer, EventEmitter);

  Demuxer.probe = function(buffer) {
    return false;
  };

  function Demuxer(source, chunk) {
    var list;
    var _this = this;
    list = new BufferList();
    list.push(chunk);
    this.stream = new Stream(list);
    source.on('data', function(chunk, final) {
      list.push(chunk);
      return _this.readChunk(chunk, final);
    });
    source.on('error', function(err) {
      return _this.emit('error', err);
    });
    source.on('end', function() {
      return _this.emit('end');
    });
  }

  Demuxer.prototype.readChunk = function(chunk) {};

  Demuxer.prototype.seek = function(timestamp) {
    return 0;
  };

  formats = [];

  Demuxer.register = function(demuxer) {
    return formats.push(demuxer);
  };

  Demuxer.find = function(buffer) {
    var format, list, stream, _i, _len;
    list = new BufferList;
    list.push(buffer);
    stream = new Stream(list);
    for (_i = 0, _len = formats.length; _i < _len; _i++) {
      format = formats[_i];
      if (format.probe(stream)) return format;
    }
    return null;
  };

  return Demuxer;

})();

var Decoder;
var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

Decoder = (function() {
  var codecs;

  __extends(Decoder, EventEmitter);

  function Decoder(demuxer, format) {
    var list;
    var _this = this;
    this.format = format;
    list = new BufferList;
    this.stream = new Stream(list);
    this.bitstream = new Bitstream(this.stream);
    demuxer.on('cookie', function(cookie) {
      return _this.setCookie(cookie);
    });
    demuxer.on('data', function(chunk, final) {
      list.push(chunk);
      return _this.emit('available');
    });
  }

  Decoder.prototype.setCookie = function(cookie) {};

  Decoder.prototype.readChunk = function(chunk) {};

  Decoder.prototype.seek = function(position) {
    return 'Not Implemented.';
  };

  codecs = {};

  Decoder.register = function(id, decoder) {
    return codecs[id] = decoder;
  };

  Decoder.find = function(id) {
    return codecs[id] || null;
  };

  return Decoder;

})();

(function (global){

/**
 * Creates a Sink according to specified parameters, if possible.
 *
 * @class
 *
 * @arg =!readFn
 * @arg =!channelCount
 * @arg =!bufferSize
 * @arg =!sampleRate
 *
 * @param {Function} readFn A callback to handle the buffer fills.
 * @param {Number} channelCount Channel count.
 * @param {Number} bufferSize (Optional) Specifies a pre-buffer size to control the amount of latency.
 * @param {Number} sampleRate Sample rate (ms).
 * @param {Number} default=0 writePosition Write position of the sink, as in how many samples have been written per channel.
 * @param {String} default=async writeMode The default mode of writing to the sink.
 * @param {String} default=interleaved channelMode The mode in which the sink asks the sample buffers to be channeled in.
 * @param {Number} default=0 previousHit The previous time of a callback.
 * @param {Buffer} default=null ringBuffer The ring buffer array of the sink. If null, ring buffering will not be applied.
 * @param {Number} default=0 ringOffset The current position of the ring buffer.
*/
function Sink(readFn, channelCount, bufferSize, sampleRate){
	var	sinks	= Sink.sinks,
		dev;
	for (dev in sinks){
		if (sinks.hasOwnProperty(dev) && sinks[dev].enabled){
			try{
				return new sinks[dev](readFn, channelCount, bufferSize, sampleRate);
			} catch(e1){}
		}
	}

	throw Sink.Error(0x02);
}

/**
 * A light event emitter.
 *
 * @class
 * @static Sink
*/
function EventEmitter () {
	var k;
	for (k in EventEmitter.prototype) {
		if (EventEmitter.prototype.hasOwnProperty(k)) {
			this[k] = EventEmitter.prototype[k];
		}
	}
	this._listeners = {};
};

EventEmitter.prototype = {
	_listeners: null,
/**
 * Emits an event.
 *
 * @method EventEmitter
 *
 * @arg {String} name The name of the event to emit.
 * @arg {Array} args The arguments to pass to the event handlers.
*/
	emit: function (name, args) {
		if (this._listeners[name]) {
			for (var i=0; i<this._listeners[name].length; i++) {
				this._listeners[name][i].apply(this, args);
			}
		}
		return this;
	},
/**
 * Adds an event listener to an event.
 *
 * @method EventEmitter
 *
 * @arg {String} name The name of the event.
 * @arg {Function} listener The event listener to attach to the event.
*/
	on: function (name, listener) {
		this._listeners[name] = this._listeners[name] || [];
		this._listeners[name].push(listener);
		return this;
	},
/**
 * Adds an event listener to an event.
 *
 * @method EventEmitter
 *
 * @arg {String} name The name of the event.
 * @arg {Function} !listener The event listener to remove from the event. If not specified, will delete all.
*/
	off: function (name, listener) {
		if (this._listeners[name]) {
			if (!listener) {
				delete this._listeners[name];
				return this;
			}
			for (var i=0; i<this._listeners[name].length; i++) {
				if (this._listeners[name][i] === listener) {
					this._listeners[name].splice(i--, 1);
				}
			}
			this._listeners[name].length || delete this._listeners[name];
		}
		return this;
	},
};

Sink.EventEmitter = EventEmitter;

/*
 * A Sink-specific error class.
 *
 * @class
 * @static Sink
 * @name Error
 *
 * @arg =code
 *
 * @param {Number} code The error code.
 * @param {String} message A brief description of the error.
 * @param {String} explanation A more verbose explanation of why the error occured and how to fix.
*/

function SinkError(code) {
	if (!SinkError.hasOwnProperty(code)) throw SinkError(1);
	if (!(this instanceof SinkError)) return new SinkError(code);

	var k;
	for (k in SinkError[code]) {
		if (SinkError[code].hasOwnProperty(k)) {
			this[k] = SinkError[code][k];
		}
	}

	this.code = code;
}

SinkError.prototype = new Error();

SinkError.prototype.toString = function () {
	return 'SinkError 0x' + this.code.toString(16) + ': ' + this.message;
};

SinkError[0x01] = {
	message: 'No such error code.',
	explanation: 'The error code does not exist.',
};
SinkError[0x02] = {
	message: 'No audio sink available.',
	explanation: 'The audio device may be busy, or no supported output API is available for this browser.',
};

SinkError[0x10] = {
	message: 'Buffer underflow.',
	explanation: 'Trying to recover...',
};
SinkError[0x11] = {
	message: 'Critical recovery fail.',
	explanation: 'The buffer underflow has reached a critical point, trying to recover, but will probably fail anyway.',
};
SinkError[0x12] = {
	message: 'Buffer size too large.',
	explanation: 'Unable to allocate the buffer due to excessive length, please try a smaller buffer. Buffer size should probably be smaller than the sample rate.',
};

Sink.Error = SinkError;

/**
 * A Recording class for recording sink output.
 *
 * @class
 * @arg {Object} bindTo The sink to bind the recording to.
*/

function Recording(bindTo){
	this.boundTo = bindTo;
	this.buffers = [];
	bindTo.activeRecordings.push(this);
}

Recording.prototype = {
/**
 * Adds a new buffer to the recording.
 *
 * @arg {Array} buffer The buffer to add.
 *
 * @method Recording
*/
	add: function(buffer){
		this.buffers.push(buffer);
	},
/**
 * Empties the recording.
 *
 * @method Recording
*/
	clear: function(){
		this.buffers = [];
	},
/**
 * Stops the recording and unbinds it from it's host sink.
 *
 * @method Recording
*/
	stop: function(){
		var	recordings = this.boundTo.activeRecordings,
			i;
		for (i=0; i<recordings.length; i++){
			if (recordings[i] === this){
				recordings.splice(i--, 1);
			}
		}
	},
/**
 * Joins the recorded buffers into a single buffer.
 *
 * @method Recording
*/
	join: function(){
		var	bufferLength	= 0,
			bufPos		= 0,
			buffers		= this.buffers,
			newArray,
			n, i, l		= buffers.length;

		for (i=0; i<l; i++){
			bufferLength += buffers[i].length;
		}
		newArray = new Float32Array(bufferLength);
		for (i=0; i<l; i++){
			for (n=0; n<buffers[i].length; n++){
				newArray[bufPos + n] = buffers[i][n];
			}
			bufPos += buffers[i].length;
		}
		return newArray;
	}
};

function SinkClass(){
}

Sink.SinkClass		= SinkClass;

SinkClass.prototype = {
	sampleRate: 44100,
	channelCount: 2,
	bufferSize: 4096,
	writePosition: 0,
	writeMode: 'async',
	channelMode: 'interleaved',
	previousHit: 0,
	ringBuffer: null,
	ringOffset: 0,
/**
 * Does the initialization of the sink.
 * @method Sink
*/
	start: function(readFn, channelCount, bufferSize, sampleRate){
		this.channelCount	= isNaN(channelCount) || channelCount === null ? this.channelCount: channelCount;
		this.bufferSize	= isNaN(bufferSize) || bufferSize === null ? this.bufferSize : bufferSize;
		this.sampleRate		= isNaN(sampleRate) || sampleRate === null ? this.sampleRate : sampleRate;
		this.readFn		= readFn;
		this.activeRecordings	= [];
		this.previousHit	= +new Date;
		this.asyncBuffers	= [];
		this.syncBuffers	= [];
		Sink.EventEmitter.call(this);
	},
/**
 * The method which will handle all the different types of processing applied on a callback.
 * @method Sink
*/
	process: function(soundData, channelCount) {
		this.ringBuffer && (this.channelMode === 'interleaved' ? this.ringSpin : this.ringSpinInterleaved).apply(this, arguments);
		this.writeBuffersSync.apply(this, arguments);
		if (this.channelMode === 'interleaved') {
			this.readFn && this.readFn.apply(this, arguments);
			this.emit('audioprocess', arguments);
		} else {
			var	soundDataSplit	= Sink.deinterleave(soundData, this.channelCount),
				args		= [soundDataSplit].concat([].slice.call(arguments, 1));
			this.readFn && this.readFn.apply(this, args);
			this.emit('audioprocess', args);
			Sink.interleave(soundDataSplit, this.channelCount, soundData);
		}
		this.writeBuffersAsync.apply(this, arguments);
		this.recordData.apply(this, arguments);
		this.previousHit = +new Date;
		this.writePosition += soundData.length / channelCount;
	},
/**
 * Starts recording the sink output.
 *
 * @method Sink
 *
 * @return {Recording} The recording object for the recording started.
*/
	record: function(){
		return new Recording(this);
	},
/**
 * Private method that handles the adding the buffers to all the current recordings.
 *
 * @method Sink
 *
 * @arg {Array} buffer The buffer to record.
*/
	recordData: function(buffer){
		var	activeRecs	= this.activeRecordings,
			i, l		= activeRecs.length;
		for (i=0; i<l; i++){
			activeRecs[i].add(buffer);
		}
	},
/**
 * Private method that handles the mixing of asynchronously written buffers.
 *
 * @method Sink
 *
 * @arg {Array} buffer The buffer to write to.
*/
	writeBuffersAsync: function(buffer){
		var	buffers		= this.asyncBuffers,
			l		= buffer.length,
			buf,
			bufLength,
			i, n, offset;
		if (buffers){
			for (i=0; i<buffers.length; i++){
				buf		= buffers[i];
				bufLength	= buf.b.length;
				offset		= buf.d;
				buf.d		-= Math.min(offset, l);
				
				for (n=0; n + offset < l && n < bufLength; n++){
					buffer[n + offset] += buf.b[n];
				}
				buf.b = buf.b.subarray(n + offset);
				i >= bufLength && buffers.splice(i--, 1);
			}
		}
	},
/**
 * A private method that handles mixing synchronously written buffers.
 *
 * @method Sink
 *
 * @arg {Array} buffer The buffer to write to.
*/
	writeBuffersSync: function(buffer){
		var	buffers		= this.syncBuffers,
			l		= buffer.length,
			i		= 0,
			soff		= 0;
		for(;i<l && buffers.length; i++){
			buffer[i] += buffers[0][soff];
			if (buffers[0].length <= soff){
				buffers.splice(0, 1);
				soff = 0;
				continue;
			}
			soff++;
		}
		if (buffers.length){
			buffers[0] = buffers[0].subarray(soff);
		}
	},
/**
 * Writes a buffer asynchronously on top of the existing signal, after a specified delay.
 *
 * @method Sink
 *
 * @arg {Array} buffer The buffer to write.
 * @arg {Number} delay The delay to write after. If not specified, the Sink will calculate a delay to compensate the latency.
 * @return {Number} The number of currently stored asynchronous buffers.
*/
	writeBufferAsync: function(buffer, delay){
		buffer			= this.mode === 'deinterleaved' ? Sink.interleave(buffer, this.channelCount) : buffer;
		var	buffers		= this.asyncBuffers;
		buffers.push({
			b: buffer,
			d: isNaN(delay) ? ~~((+new Date - this.previousHit) / 1000 * this.sampleRate) : delay
		});
		return buffers.length;
	},
/**
 * Writes a buffer synchronously to the output.
 *
 * @method Sink
 *
 * @param {Array} buffer The buffer to write.
 * @return {Number} The number of currently stored synchronous buffers.
*/
	writeBufferSync: function(buffer){
		buffer			= this.mode === 'deinterleaved' ? Sink.interleave(buffer, this.channelCount) : buffer;
		var	buffers		= this.syncBuffers;
		buffers.push(buffer);
		return buffers.length;
	},
/**
 * Writes a buffer, according to the write mode specified.
 *
 * @method Sink
 *
 * @arg {Array} buffer The buffer to write.
 * @arg {Number} delay The delay to write after. If not specified, the Sink will calculate a delay to compensate the latency. (only applicable in asynchronous write mode)
 * @return {Number} The number of currently stored (a)synchronous buffers.
*/
	writeBuffer: function(){
		return this[this.writeMode === 'async' ? 'writeBufferAsync' : 'writeBufferSync'].apply(this, arguments);
	},
/**
 * Gets the total amount of yet unwritten samples in the synchronous buffers.
 *
 * @method Sink
 *
 * @return {Number} The total amount of yet unwritten samples in the synchronous buffers.
*/
	getSyncWriteOffset: function(){
		var	buffers		= this.syncBuffers,
			offset		= 0,
			i;
		for (i=0; i<buffers.length; i++){
			offset += buffers[i].length;
		}
		return offset;
	},
/**
 * Get the current output position, defaults to writePosition - bufferSize.
 *
 * @method Sink
 *
 * @return {Number} The position of the write head, in samples, per channel.
*/
	getPlaybackTime: function(){
		return this.writePosition - this.bufferSize;
	},
/**
 * A private method that applies the ring buffer contents to the specified buffer, while in interleaved mode.
 *
 * @method Sink
 *
 * @arg {Array} buffer The buffer to write to.
*/
	ringSpin: function(buffer){
		var	ring	= this.ringBuffer,
			l	= buffer.length,
			m	= ring.length,
			off	= this.ringOffset,
			i;
		for (i=0; i<l; i++){
			buffer[i] += ring[off];
			off = (off + 1) % m;
		}
		this.ringOffset = off;
	},
/**
 * A private method that applies the ring buffer contents to the specified buffer, while in deinterleaved mode.
 *
 * @method Sink
 *
 * @param {Array} buffer The buffers to write to.
*/
	ringSpinDeinterleaved: function(buffer){
		var	ring	= this.ringBuffer,
			l	= buffer.length,
			ch	= ring.length,
			m	= ring[0].length,
			len	= ch * m,
			off	= this.ringOffset,
			i, n;
		for (i=0; i<l; i+=ch){
			for (n=0; n<ch; n++){
				buffer[i + n] += ring[n][off];
			}
			off = (off + 1) % m;
		}
		this.ringOffset = n;
	}
};

/**
 * The container for all the available sinks. Also a decorator function for creating a new Sink class and binding it.
 *
 * @method Sink
 *
 * @arg {String} type The name / type of the Sink.
 * @arg {Function} constructor The constructor function for the Sink.
 * @arg {Object} prototype The prototype of the Sink. (optional)
 * @arg {Boolean} disabled Whether the Sink should be disabled at first.
*/

function sinks(type, constructor, prototype, disabled){
	prototype = prototype || constructor.prototype;
	constructor.prototype = new Sink.SinkClass();
	constructor.prototype.type = type;
	constructor.enabled = !disabled;
	for (disabled in prototype){
		if (prototype.hasOwnProperty(disabled)){
			constructor.prototype[disabled] = prototype[disabled];
		}
	}
	sinks[type] = constructor;
}

/**
 * A Sink class for the Mozilla Audio Data API.
*/

sinks('moz', function(){
	var	self			= this,
		currentWritePosition	= 0,
		tail			= null,
		audioDevice		= new Audio(),
		written, currentPosition, available, soundData, prevPos,
		timer; // Fix for https://bugzilla.mozilla.org/show_bug.cgi?id=630117
	self.start.apply(self, arguments);
	self.preBufferSize = isNaN(arguments[4]) || arguments[4] === null ? this.preBufferSize : arguments[4];

	function bufferFill(){
		if (tail){
			written = audioDevice.mozWriteAudio(tail);
			currentWritePosition += written;
			if (written < tail.length){
				tail = tail.subarray(written);
				return tail;
			}
			tail = null;
		}

		currentPosition = audioDevice.mozCurrentSampleOffset();
		available = Number(currentPosition + (prevPos !== currentPosition ? self.bufferSize : self.preBufferSize) * self.channelCount - currentWritePosition);
		currentPosition === prevPos && self.emit('error', [Sink.Error(0x10)]);
		if (available > 0 || prevPos === currentPosition){
			try {
				soundData = new Float32Array(prevPos === currentPosition ? self.preBufferSize * self.channelCount :
					self.forceBufferSize ? available < self.bufferSize * 2 ? self.bufferSize * 2 : available : available);
			} catch(e) {
				self.emit('error', [Sink.Error(0x12)]);
				self.kill();
				return;
			}
			self.process(soundData, self.channelCount);
			written = self._audio.mozWriteAudio(soundData);
			if (written < soundData.length){
				tail = soundData.subarray(written);
			}
			currentWritePosition += written;
		}
		prevPos = currentPosition;
	}

	audioDevice.mozSetup(self.channelCount, self.sampleRate);

	this._timers = [];

	this._timers.push(Sink.doInterval(function () {
		// Check for complete death of the output
		if (+new Date - self.previousHit > 2000) {
			self._audio = audioDevice = new Audio();
			audioDevice.mozSetup(self.channelCount, self.sampleRate);
			currentWritePosition = 0;
			self.emit('error', [Sink.Error(0x11)]);
		}
	}, 1000));

	this._timers.push(Sink.doInterval(bufferFill, self.interval));

	self._bufferFill	= bufferFill;
	self._audio		= audioDevice;
}, {
	// These are somewhat safe values...
	bufferSize: 24576,
	preBufferSize: 24576,
	forceBufferSize: false,
	interval: 20,
	kill: function () {
		while(this._timers.length){
			this._timers[0]();
			this._timers.splice(0, 1);
		}
		this.emit('kill');
	},
	getPlaybackTime: function() {
		return this._audio.mozCurrentSampleOffset() / this.channelCount;
	}
});

/**
 * A sink class for the Web Audio API
*/

var fixChrome82795 = [];

sinks('webkit', function(readFn, channelCount, bufferSize, sampleRate){
	var	self		= this,
		// For now, we have to accept that the AudioContext is at 48000Hz, or whatever it decides.
		context		= new (window.AudioContext || webkitAudioContext)(/*sampleRate*/),
		node		= context.createJavaScriptNode(bufferSize, 0, channelCount);
	self.start.apply(self, arguments);

	function bufferFill(e){
		var	outputBuffer	= e.outputBuffer,
			channelCount	= outputBuffer.numberOfChannels,
			i, n, l		= outputBuffer.length,
			size		= outputBuffer.size,
			channels	= new Array(channelCount),
			soundData	= new Float32Array(l * channelCount),
			tail;

		for (i=0; i<channelCount; i++){
			channels[i] = outputBuffer.getChannelData(i);
		}

		self.process(soundData, self.channelCount);

		for (i=0; i<l; i++){
			for (n=0; n < channelCount; n++){
				channels[n][i] = soundData[i * self.channelCount + n];
			}
		}
	}

	if (sinks.webkit.forceSampleRate && self.sampleRate !== context.sampleRate){
		bufferFill = function bufferFill(e){
			var	outputBuffer	= e.outputBuffer,
				channelCount	= outputBuffer.numberOfChannels,
				i, n, l		= outputBuffer.length,
				size		= outputBuffer.size,
				channels	= new Array(channelCount),
				soundData	= new Float32Array(Math.floor(l * self.sampleRate / context.sampleRate) * channelCount),
				channel;

			for (i=0; i<channelCount; i++){
				channels[i] = outputBuffer.getChannelData(i);
			}

			self.process(soundData, self.channelCount);
			soundData = Sink.deinterleave(soundData, self.channelCount);
			for (n=0; n<channelCount; n++){
				channel = Sink.resample(soundData[n], self.sampleRate, context.sampleRate);
				for (i=0; i<l; i++){
					channels[n][i] = channel[i];
				}
			}
		}
	} else {
		self.sampleRate = context.sampleRate;
	}

	node.onaudioprocess = bufferFill;
	node.connect(context.destination);

	self._context		= context;
	self._node		= node;
	self._callback		= bufferFill;
	/* Keep references in order to avoid garbage collection removing the listeners, working around http://code.google.com/p/chromium/issues/detail?id=82795 */
	// Thanks to @baffo32
	fixChrome82795.push(node);
}, {
	//TODO: Do something here.
	kill: function(){
		this._node.disconnect(0);
		for (var i=0; i<fixChrome82795.length; i++) {
			fixChrome82795[i] === this._node && fixChrome82795.splice(i--, 1);
		}
		this._node = this._context = null;
		this.kill();
		this.emit('kill');
	},
	getPlaybackTime: function(){
		return this._context.currentTime * this.sampleRate;
	},
});

sinks.webkit.fix82795 = fixChrome82795;

/**
 * A dummy Sink. (No output)
*/

sinks('dummy', function(){
	var 	self		= this;
	self.start.apply(self, arguments);
	
	function bufferFill(){
		var	soundData = new Float32Array(self.bufferSize * self.channelCount);
		self.process(soundData, self.channelCount);
	}

	self._kill = Sink.doInterval(bufferFill, self.bufferSize / self.sampleRate * 1000);

	self._callback		= bufferFill;
}, {
	kill: function () {
		this._kill();
		this.emit('kill');
	},
}, true);

Sink.sinks		= Sink.devices = sinks;
Sink.Recording		= Recording;

(function(){

var	BlobBuilder	= typeof window === 'undefined' ? undefined :
	window.MozBlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder || window.OBlobBuilder || window.BlobBuilder,
	URL		= typeof window === 'undefined' ? undefined : (window.MozURL || window.webkitURL || window.MSURL || window.OURL || window.URL);

/**
 * Creates an inline worker using a data/blob URL, if possible.
 *
 * @static Sink
 *
 * @arg {String} script
 *
 * @return {Worker} A web worker, or null if impossible to create.
*/

function inlineWorker (script) {
	var	worker	= null,
		url, bb;
	try {
		bb	= new BlobBuilder();
		bb.append(script);
		url	= URL.createObjectURL(bb.getBlob());
		worker	= new Worker(url);

		worker._terminate	= worker.terminate;
		worker._url		= url;
		bb			= null;

		worker.terminate = function () {
			this._terminate;
			URL.revokeObjectURL(this._url);
		};

		inlineWorker.type = 'blob';

		return worker;

	} catch (e) {}

	try {
		worker			= new Worker('data:text/javascript;base64,' + btoa(script));
		inlineWorker.type	= 'data';

		return worker;

	} catch (e) {}

	return worker;
}

inlineWorker.ready = inlineWorker.working = false;

Sink.EventEmitter.call(inlineWorker);

inlineWorker.test = function () {
	var	worker	= inlineWorker('this.onmessage=function(e){postMessage(e.data)}'),
		data	= 'inlineWorker';
	inlineWorker.ready = inlineWorker.working = false;

	function ready(success) {
		if (inlineWorker.ready) return;
		inlineWorker.ready	= true;
		inlineWorker.working	= success;
		inlineWorker.emit('ready', [success]);
		inlineWorker.off('ready');
		success && worker && worker.terminate();
		worker = null;
	}

	if (!worker) {
		ready(false);
	} else {
		worker.onmessage = function (e) {
			ready(e.data === data);
		};
		worker.postMessage(data);
		setTimeout(function () {
			ready(false);
		}, 1000);
	}
};

Sink.inlineWorker = inlineWorker;

inlineWorker.test();

}());

/**
 * Creates a timer with consistent (ie. not clamped) intervals even in background tabs.
 * Uses inline workers to achieve this. If not available, will revert to regular timers.
 *
 * @static Sink
 * @name doInterval
 *
 * @arg {Function} callback The callback to trigger on timer hit.
 * @arg {Number} timeout The interval between timer hits.
 *
 * @return {Function} A function to cancel the timer.
*/

Sink.doInterval		= function (callback, timeout) {
	var timer, kill;

	function create (noWorker) {
		if (Sink.inlineWorker.working && !noWorker) {
			timer = Sink.inlineWorker('setInterval(function(){ postMessage("tic"); }, ' + timeout + ');');
			timer.onmessage = function(){
				callback();
			};
			kill = function () {
				timer.terminate();
			};
		} else {
			timer = setInterval(callback, timeout);
			kill = function(){
				clearInterval(timer);
			};
		}
	}

	if (Sink.doInterval.backgroundWork || Sink.devices.moz.backgroundWork){
		Sink.inlineWorker.ready ? create() : Sink.inlineWorker.on('ready', function(){
			create();
		});
	} else {
		create(true);
	}

	return function () {
		if (!kill) {
			Sink.inlineWorker.ready || Sink.inlineWorker.on('ready', function () {
				kill && kill();
			});
		} else {
			kill();
		}
	};
};

Sink.doInterval.backgroundWork = true;

(function(){

/**
 * If method is supplied, adds a new interpolation method to Sink.interpolation, otherwise sets the default interpolation method (Sink.interpolate) to the specified property of Sink.interpolate.
 *
 * @arg {String} name The name of the interpolation method to get / set.
 * @arg {Function} !method The interpolation method.
*/

function interpolation(name, method){
	if (name && method){
		interpolation[name] = method;
	} else if (name && interpolation[name] instanceof Function){
		Sink.interpolate = interpolation[name];
	}
	return interpolation[name];
}

Sink.interpolation = interpolation;


/**
 * Interpolates a fractal part position in an array to a sample. (Linear interpolation)
 *
 * @param {Array} arr The sample buffer.
 * @param {number} pos The position to interpolate from.
 * @return {Float32} The interpolated sample.
*/
interpolation('linear', function(arr, pos){
	var	first	= Math.floor(pos),
		second	= first + 1,
		frac	= pos - first;
	second		= second < arr.length ? second : 0;
	return arr[first] * (1 - frac) + arr[second] * frac;
});

/**
 * Interpolates a fractal part position in an array to a sample. (Nearest neighbour interpolation)
 *
 * @param {Array} arr The sample buffer.
 * @param {number} pos The position to interpolate from.
 * @return {Float32} The interpolated sample.
*/
interpolation('nearest', function(arr, pos){
	return pos >= arr.length - 0.5 ? arr[0] : arr[Math.round(pos)];
});

interpolation('linear');

}());


/**
 * Resamples a sample buffer from a frequency to a frequency and / or from a sample rate to a sample rate.
 *
 * @static Sink
 * @name resample
 *
 * @arg {Buffer} buffer The sample buffer to resample.
 * @arg {Number} fromRate The original sample rate of the buffer, or if the last argument, the speed ratio to convert with.
 * @arg {Number} fromFrequency The original frequency of the buffer, or if the last argument, used as toRate and the secondary comparison will not be made.
 * @arg {Number} toRate The sample rate of the created buffer.
 * @arg {Number} toFrequency The frequency of the created buffer.
 *
 * @return The new resampled buffer.
*/
Sink.resample	= function(buffer, fromRate /* or speed */, fromFrequency /* or toRate */, toRate, toFrequency){
	var
		argc		= arguments.length,
		speed		= argc === 2 ? fromRate : argc === 3 ? fromRate / fromFrequency : toRate / fromRate * toFrequency / fromFrequency,
		l		= buffer.length,
		length		= Math.ceil(l / speed),
		newBuffer	= new Float32Array(length),
		i, n;
	for (i=0, n=0; i<l; i += speed){
		newBuffer[n++] = Sink.interpolate(buffer, i);
	}
	return newBuffer;
};

/**
 * Splits a sample buffer into those of different channels.
 *
 * @static Sink
 * @name deinterleave
 *
 * @arg {Buffer} buffer The sample buffer to split.
 * @arg {Number} channelCount The number of channels to split to.
 *
 * @return {Array} An array containing the resulting sample buffers.
*/

Sink.deinterleave = function(buffer, channelCount){
	var	l	= buffer.length,
		size	= l / channelCount,
		ret	= [],
		i, n;
	for (i=0; i<channelCount; i++){
		ret[i] = new Float32Array(size);
		for (n=0; n<size; n++){
			ret[i][n] = buffer[n * channelCount + i];
		}
	}
	return ret;
};

/**
 * Joins an array of sample buffers into a single buffer.
 *
 * @static Sink
 * @name resample
 *
 * @arg {Array} buffers The buffers to join.
 * @arg {Number} !channelCount The number of channels. Defaults to buffers.length
 * @arg {Buffer} !buffer The output buffer.
 *
 * @return {Buffer} The interleaved buffer created.
*/

Sink.interleave = function(buffers, channelCount, buffer){
	channelCount		= channelCount || buffers.length;
	var	l		= buffers[0].length,
		bufferCount	= buffers.length,
		i, n;
	buffer			= buffer || new Float32Array(l * channelCount);
	for (i=0; i<bufferCount; i++){
		for (n=0; n<l; n++){
			buffer[i + n * channelCount] = buffers[i][n];
		}
	}
	return buffer;
};

/**
 * Mixes two or more buffers down to one.
 *
 * @static Sink
 * @name mix
 *
 * @arg {Buffer} buffer The buffer to append the others to.
 * @arg {Buffer} bufferX The buffers to append from.
 *
 * @return {Buffer} The mixed buffer.
*/

Sink.mix = function(buffer){
	var	buffers	= [].slice.call(arguments, 1),
		l, i, c;
	for (c=0; c<buffers.length; c++){
		l = Math.max(buffer.length, buffers[c].length);
		for (i=0; i<l; i++){
			buffer[i] += buffers[c][i];
		}
	}
	return buffer;
};

/**
 * Resets a buffer to all zeroes.
 *
 * @static Sink
 * @name resetBuffer
 *
 * @arg {Buffer} buffer The buffer to reset.
 *
 * @return {Buffer} The 0-reset buffer.
*/

Sink.resetBuffer = function(buffer){
	var	l	= buffer.length,
		i;
	for (i=0; i<l; i++){
		buffer[i] = 0;
	}
	return buffer;
};

/**
 * Copies the content of a buffer to another buffer.
 *
 * @static Sink
 * @name clone
 *
 * @arg {Buffer} buffer The buffer to copy from.
 * @arg {Buffer} !result The buffer to copy to.
 *
 * @return {Buffer} A clone of the buffer.
*/

Sink.clone = function(buffer, result){
	var	l	= buffer.length,
		i;
	result = result || new Float32Array(l);
	for (i=0; i<l; i++){
		result[i] = buffer[i];
	}
	return result;
};

/**
 * Creates an array of buffers of the specified length and the specified count.
 *
 * @static Sink
 * @name createDeinterleaved
 *
 * @arg {Number} length The length of a single channel.
 * @arg {Number} channelCount The number of channels.
 * @return {Array} The array of buffers.
*/

Sink.createDeinterleaved = function(length, channelCount){
	var	result	= new Array(channelCount),
		i;
	for (i=0; i<channelCount; i++){
		result[i] = new Float32Array(length);
	}
	return result;
};

global.Sink = Sink;
}(function(){ return this; }()));
var Player;
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

Player = (function() {

  __extends(Player, EventEmitter);

  function Player(source) {
    var _this = this;
    this.source = source;
    this.startPlaying = __bind(this.startPlaying, this);
    this.findDecoder = __bind(this.findDecoder, this);
    this.probe = __bind(this.probe, this);
    this.playing = false;
    this.buffered = 0;
    this.currentTime = 0;
    this.duration = 0;
    this.volume = 100;
    this.metadata = {};
    this.demuxer = null;
    this.decoder = null;
    this.queue = null;
    this.source.once('data', this.probe);
    this.source.on('error', function(err) {
      _this.pause();
      return _this.emit('error', err);
    });
    this.source.on('progress', function(percent) {
      _this.buffered = percent;
      return _this.emit('buffer', percent);
    });
  }

  Player.fromURL = function(url) {
    var source;
    source = new HTTPSource(url);
    return new Player(source);
  };

  Player.fromFile = function(file) {
    var source;
    source = new FileSource(file);
    return new Player(file);
  };

  Player.prototype.preload = function() {
    if (!this.source) return;
    return this.source.start();
  };

  Player.prototype.play = function() {
    var _this = this;
    this.playing = true;
    return this._timer = setInterval(function() {
      var _ref;
      _this.currentTime = (((_ref = _this.sink) != null ? _ref.getPlaybackTime() : void 0) || 0) / 44100 * 1000 | 0;
      if (_this.currentTime > 0) return _this.emit('progress', _this.currentTime);
    }, 200);
  };

  Player.prototype.pause = function() {
    this.playing = false;
    return clearInterval(this._timer);
  };

  Player.prototype.probe = function(chunk) {
    var demuxer;
    var _this = this;
    demuxer = Demuxer.find(chunk);
    if (!demuxer) {
      return this.emit('error', 'A demuxer for this container was not found.');
    }
    this.demuxer = new demuxer(this.source, chunk);
    this.demuxer.on('format', this.findDecoder);
    return this.demuxer.on('duration', function(d) {
      return _this.duration = d;
    });
  };

  Player.prototype.findDecoder = function(format) {
    var decoder;
    console.log(format);
    decoder = Decoder.find(format.formatID);
    if (!decoder) {
      return this.emit('error', "A decoder for " + format.formatID + " was not found.");
    }
    this.decoder = new decoder(this.demuxer, format);
    this.queue = new Queue(this.decoder);
    return this.queue.on('ready', this.startPlaying);
  };

  Player.prototype.startPlaying = function() {
    var frame, frameOffset;
    var _this = this;
    frame = new Int16Array(this.queue.read());
    frameOffset = 0;
    Sink.sinks.moz.prototype.interval = 100;
    this.sink = Sink(function(buffer, channelCount) {
      var bufferOffset, f, i, max, vol;
      if (!_this.playing) return;
      bufferOffset = 0;
      vol = _this.volume / 100;
      while (frame && bufferOffset < buffer.length) {
        max = Math.min(frame.length - frameOffset, buffer.length - bufferOffset);
        for (i = 0; i < max; i += 1) {
          buffer[bufferOffset + i] = (frame[frameOffset + i] / 0x8000) * vol;
        }
        bufferOffset += i;
        frameOffset += i;
        if (frameOffset === frame.length) {
          if (f = _this.queue.read()) {
            frame = new Int16Array(f);
            frameOffset = 0;
          } else {
            frame = null;
            frameOffset = 0;
          }
        }
      }
    }, 2, null, 44100);
    return this.emit('ready');
  };

  return Player;

})();

var CAFDemuxer;
var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

CAFDemuxer = (function() {

  __extends(CAFDemuxer, Demuxer);

  function CAFDemuxer() {
    CAFDemuxer.__super__.constructor.apply(this, arguments);
  }

  Demuxer.register(CAFDemuxer);

  CAFDemuxer.probe = function(buffer) {
    return buffer.peekString(0, 4) === 'caff';
  };

  CAFDemuxer.prototype.readChunk = function() {
    var buffer;
    if (!this.format && this.stream.available(64)) {
      if (this.stream.readString(4) !== 'caff') {
        return this.emit('error', "Invalid CAF, does not begin with 'caff'");
      }
      this.stream.advance(4);
      if (this.stream.readString(4) !== 'desc') {
        return this.emit('error', "Invalid CAF, 'caff' is not followed by 'desc'");
      }
      if (!(this.stream.readUInt32() === 0 && this.stream.readUInt32() === 32)) {
        return this.emit('error', "Invalid 'desc' size, should be 32");
      }
      this.format = {
        sampleRate: this.stream.readFloat64(),
        formatID: this.stream.readString(4),
        formatFlags: this.stream.readUInt32(),
        bytesPerPacket: this.stream.readUInt32(),
        framesPerPacket: this.stream.readUInt32(),
        channelsPerFrame: this.stream.readUInt32(),
        bitsPerChannel: this.stream.readUInt32()
      };
      this.emit('format', this.format);
    }
    while ((this.headerCache && this.stream.available(1)) || this.stream.available(13)) {
      if (!this.headerCache) {
        this.headerCache = {
          type: this.stream.readString(4),
          oversize: this.stream.readUInt32() !== 0,
          size: this.stream.readUInt32()
        };
        if (this.headerCache.type === 'data') {
          this.stream.advance(4);
          this.headerCache.size -= 4;
        }
      }
      if (this.headerCache.oversize) {
        return this.emit('error', "Holy Shit, an oversized file, not supported in JS");
      }
      switch (this.headerCache.type) {
        case 'kuki':
          if (this.stream.available(this.headerCache.size)) {
            buffer = this.stream.readBuffer(this.headerCache.size);
            this.emit('cookie', buffer);
            this.headerCache = null;
          }
          break;
        case 'pakt':
          if (this.stream.available(this.headerCache.size)) {
            if (this.stream.readUInt32() !== 0) {
              return this.emit('error', 'Sizes greater than 32 bits are not supported.');
            }
            this.numPackets = this.stream.readUInt32();
            if (this.stream.readUInt32() !== 0) {
              return this.emit('error', 'Sizes greater than 32 bits are not supported.');
            }
            this.numFrames = this.stream.readUInt32();
            this.primingFrames = this.stream.readUInt32();
            this.remainderFrames = this.stream.readUInt32();
            this.emit('duration', this.numFrames / this.format.sampleRate * 1000 | 0);
            this.stream.advance(this.headerCache.size - 24);
            this.headerCache = null;
          }
          break;
        case 'data':
          buffer = this.stream.readSingleBuffer(this.headerCache.size);
          this.headerCache.size -= buffer.length;
          if (this.headerCache.size <= 0) this.headerCache = null;
          this.emit('data', buffer);
          break;
        default:
          if (this.stream.available(this.headerCache.size)) {
            this.stream.advance(this.headerCache.size);
            this.headerCache = null;
          }
      }
    }
  };

  return CAFDemuxer;

})();

var ALAC;

ALAC = {};

ALAC.channelAtomSize = 12;

ALAC.maxChannels = 8;

ALAC.maxEscapeHeaderBytes = 8;

ALAC.maxSearches = 16;

ALAC.maxCoefs = 16;

ALAC.defaultFramesPerPacket = 4096;

ALAC.errors = {
  noError: 0,
  unimplementedError: -4,
  fileNotFoundError: -43,
  paramError: -50,
  memFullError: -108
};

ALAC.formats = {
  appleLossless: 'alac',
  linearPCM: 'lpcm'
};

ALAC.sampleTypes = {
  isFloat: 1 << 0,
  isBigEndian: 1 << 1,
  isSignedInteger: 1 << 2,
  isPacked: 1 << 3,
  isAlignedHigh: 1 << 4
};

ALAC.channelLayouts = {
  mono: (100 << 16) | 1,
  stereo: (101 << 16) | 2,
  MPEG_3_0_B: (113 << 16) | 3,
  MPEG_4_0_B: (116 << 16) | 4,
  MPEG_5_0_D: (120 << 16) | 5,
  MPEG_5_1_D: (124 << 16) | 6,
  AAC_6_1: (142 << 16) | 7,
  MPEG_7_1_B: (127 << 16) | 8
};

ALAC.channelLayoutArray = [ALAC.channelLayouts.mono, ALAC.channelLayouts.stereo, ALAC.channelLayouts.MPEG_3_0_B, ALAC.channelLayouts.MPEG_4_0_B, ALAC.channelLayouts.MPEG_5_0_D, ALAC.channelLayouts.MPEG_5_1_D, ALAC.channelLayouts.AAC_6_1, ALAC.channelLayouts.MPEG_7_1_B];

var ALACDecoder;

ALACDecoder = (function() {
  var ID_CCE, ID_CPE, ID_DSE, ID_END, ID_FIL, ID_LFE, ID_PCE, ID_SCE;

  ID_SCE = 0;

  ID_CPE = 1;

  ID_CCE = 2;

  ID_LFE = 3;

  ID_DSE = 4;

  ID_PCE = 5;

  ID_FIL = 6;

  ID_END = 7;

  function ALACDecoder(cookie) {
    var atom, data, list, offset, predictorBuffer, remaining, _ref;
    this.cookie = cookie;
    _ref = [0, this.cookie.byteLength], offset = _ref[0], remaining = _ref[1];
    list = new BufferList();
    list.push(this.cookie);
    data = new Stream(list);
    atom = data.peekString(4, 4);
    if (atom === 'frma') {
      console.log("Skipping 'frma'");
      data.advance(12);
      atom = data.peekString(4, 4);
    }
    if (atom === 'alac') {
      console.log("Skipping 'alac'");
      data.advance(12);
      atom = data.peekString(4, 4);
    }
    if (!data.available(24)) {
      console.log("Cookie too short");
      return [ALAC.errors.paramError];
    }
    this.config = {
      frameLength: data.readUInt32(),
      compatibleVersion: data.readUInt8(),
      bitDepth: data.readUInt8(),
      pb: data.readUInt8(),
      mb: data.readUInt8(),
      kb: data.readUInt8(),
      numChannels: data.readUInt8(),
      maxRun: data.readUInt16(),
      maxFrameBytes: data.readUInt32(),
      avgBitRate: data.readUInt32(),
      sampleRate: data.readUInt32()
    };
    this.mixBufferU = new Int32Array(this.config.frameLength);
    this.mixBufferV = new Int32Array(this.config.frameLength);
    predictorBuffer = new ArrayBuffer(this.config.frameLength * 4);
    this.predictor = new Int32Array(predictorBuffer);
    this.shiftBuffer = new Int16Array(predictorBuffer);
  }

  ALACDecoder.prototype.decode = function(data, samples, channels) {
    var agParams, bits1, bytesShifted, chanBits, channelIndex, coefsU, coefsV, count, dataByteAlignFlag, denShiftU, denShiftV, elementInstanceTag, end, escapeFlag, headerByte, i, j, maxBits, mixBits, mixRes, modeU, modeV, numU, numV, out16, output, params, partialFrame, pb, pbFactorU, pbFactorV, shift, shiftbits, status, tag, unused, unusedHeader, val, _ref;
    if (!(channels > 0)) {
      console.log("Requested less than a single channel");
      return [ALAC.errors.paramError];
    }
    this.activeElements = 0;
    channelIndex = 0;
    coefsU = new Int16Array(32);
    coefsV = new Int16Array(32);
    output = new ArrayBuffer(samples * channels * this.config.bitDepth / 8);
    status = ALAC.errors.noError;
    end = false;
    while (status === ALAC.errors.noError && end === false) {
      pb = this.config.pb;
      if (!data.available(3)) return [status, output];
      tag = data.readSmall(3);
      switch (tag) {
        case ID_SCE:
        case ID_LFE:
          elementInstanceTag = data.readSmall(4);
          this.activeElements |= 1 << elementInstanceTag;
          unused = data.read(12);
          if (unused !== 0) {
            console.log("Unused part of header does not contain 0, it should");
            return [ALAC.errors.paramError];
          }
          headerByte = data.read(4);
          partialFrame = headerByte >>> 3;
          bytesShifted = (headerByte >>> 1) & 0x3;
          if (bytesShifted === 3) {
            console.log("Bytes are shifted by 3, they shouldn't be");
            return [ALAC.errors.paramError];
          }
          shift = bytesShifted * 8;
          escapeFlag = headerByte & 0x1;
          chanBits = this.config.bitDepth - shift;
          if (partialFrame !== 0) samples = data.read(16) << 16 + data.read(16);
          if (escapeFlag === 0) {
            mixBits = data.read(8);
            mixRes = data.read(8);
            headerByte = data.read(8);
            modeU = headerByte >>> 4;
            denShiftU = headerByte & 0xf;
            headerByte = data.read(8);
            pbFactorU = headerByte >>> 5;
            numU = headerByte & 0x1f;
            for (i = 0; i < numU; i += 1) {
              coefsU[i] = data.read(16);
            }
            if (bytesShifted !== 0) {
              shiftbits = data.copy();
              data.advance(shift * samples);
            }
            params = Aglib.ag_params(this.config.mb, (this.config.pb * pbFactorU) / 4, this.config.kb, samples, samples, this.config.maxRun);
            status = Aglib.dyn_decomp(params, data, this.predictor, samples, chanBits);
            if (status !== ALAC.errors.noError) return status;
            if (modeU === 0) {
              Dplib.unpc_block(this.predictor, this.mixBufferU, samples, coefsU, numU, chanBits, denShiftU);
            } else {
              Dplib.unpc_block(this.predictor, this.predictor, samples, null, 31, chanBits, 0);
              Dplib.unpc_block(this.predictor, this.mixBufferU, samples, coefsU, numU, chanBits, denShiftU);
            }
          } else {
            shift = 32 - chanBits;
            if (chanBits <= 16) {
              for (i = 0; i < samples; i += 1) {
                val = (data.read(chanBits) << shift) >> shift;
                this.mixBufferU[i] = val;
              }
            } else {
              for (i = 0; i < samples; i += 1) {
                val = (data.readBig(chanBits) << shift) >> shift;
                this.mixBufferU[i] = val;
              }
            }
            maxBits = mixRes = 0;
            bits1 = chanbits * samples;
            bytesShifted = 0;
          }
          if (bytesShifted !== 0) {
            shift = bytesShifted * 8;
            for (i = 0; 0 <= samples ? i < samples : i > samples; 0 <= samples ? i++ : i--) {
              this.shiftBuffer[i] = shiftbits.read(shift);
            }
          }
          switch (this.config.bitDepth) {
            case 16:
              out16 = new Int16Array(output, channelIndex);
              j = 0;
              for (i = 0; i < samples; i += 1) {
                out16[j] = this.mixBufferU[i];
                j += channels;
              }
              break;
            default:
              console.log("Only supports 16-bit samples right now");
              return -9000;
          }
          channelIndex += 1;
          return [status, output];
        case ID_CPE:
          if ((channelIndex + 2) > channels) {
            console.log("No more channels, please");
            return [ALAC.errors.paramError];
          }
          elementInstanceTag = data.readSmall(4);
          this.activeElements |= 1 << elementInstanceTag;
          unusedHeader = data.read(12);
          if (unusedHeader !== 0) {
            console.log("Error! Unused header is silly");
            return [ALAC.errors.paramError];
          }
          headerByte = data.readSmall(4);
          partialFrame = headerByte >>> 3;
          bytesShifted = (headerByte >>> 1) & 0x03;
          if (bytesShifted === 3) {
            console.log("Moooom, the reference said that bytes shifted couldn't be 3!");
            return [ALAC.errors.paramError];
          }
          escapeFlag = headerByte & 0x01;
          chanBits = this.config.bitDepth - (bytesShifted * 8) + 1;
          if (partialFrame !== 0) samples = data.readBig(32);
          if (escapeFlag === 0) {
            mixBits = data.read(8);
            mixRes = data.read(8);
            headerByte = data.read(8);
            modeU = headerByte >>> 4;
            denShiftU = headerByte & 0x0F;
            headerByte = data.read(8);
            pbFactorU = headerByte >>> 5;
            numU = headerByte & 0x1F;
            for (i = 0; i < numU; i += 1) {
              coefsU[i] = data.read(16);
            }
            headerByte = data.read(8);
            modeV = headerByte >>> 4;
            denShiftV = headerByte & 0x0F;
            headerByte = data.read(8);
            pbFactorV = headerByte >>> 5;
            numV = headerByte & 0x1F;
            for (i = 0; i < numV; i += 1) {
              coefsV[i] = data.read(16);
            }
            if (bytesShifted !== 0) {
              shiftbits = data.copy();
              bits.advance((bytesShifted * 8) * 2 * samples);
            }
            agParams = Aglib.ag_params(this.config.mb, (pb * pbFactorU) / 4, this.config.kb, samples, samples, this.config.maxRun);
            status = Aglib.dyn_decomp(agParams, data, this.predictor, samples, chanBits);
            if (status !== ALAC.errors.noError) {
              console.log("Mom said there should be no errors in the adaptive Goloumb code (part 1)...");
              return status;
            }
            if (modeU === 0) {
              Dplib.unpc_block(this.predictor, this.mixBufferU, samples, coefsU, numU, chanBits, denShiftU);
            } else {
              Dplib.unpc_block(this.predictor, this.predictor, samples, null, 31, chanBits, 0);
              Dplib.unpc_block(this.predictor, this.mixBufferU, samples, coefsU, numU, chanBits, denShiftU);
            }
            agParams = Aglib.ag_params(this.config.mb, (pb * pbFactorV) / 4, this.config.kb, samples, samples, this.config.maxRun);
            status = Aglib.dyn_decomp(agParams, data, this.predictor, samples, chanBits);
            if (status !== ALAC.errors.noError) {
              console.log("Mom said there should be no errors in the adaptive Goloumb code (part 2)...");
              return status;
            }
            if (modeV === 0) {
              Dplib.unpc_block(this.predictor, this.mixBufferV, samples, coefsV, numV, chanBits, denShiftV);
            } else {
              Dplib.unpc_block(this.predictor, this.predictor, samples, null, 31, chanBits, 0);
              Dplib.unpc_block(this.predictor, this.mixBufferV, samples, coefsV, numV, chanBits, denShiftV);
            }
          } else {
            chanBits = this.config.bitDepth;
            shift = 32 - chanBits;
            if (chanBits <= 16) {
              for (i = 0; i < samples; i += 1) {
                val = (data.readBig(chanBits) << shift) >> shift;
                this.mixBufferU[i] = val;
                val = (data.readBig(chanBits) << shift) >> shift;
                this.mixBufferV[i] = val;
              }
            } else {
              for (i = 0; i < samples; i += 1) {
                val = (data.readBig(chanBits) << shift) >> shift;
                this.mixBufferU[i] = val;
                val = (data.readBig(chanBits) << shift) >> shift;
                this.mixBufferV[i] = val;
              }
            }
            mixBits = mixRes = 0;
            bits1 = chanBits * samples;
            bytesShifted = 0;
          }
          if (bytesShifted !== 0) {
            shift = bytesShifted * 8;
            for (i = 0, _ref = samples * 2; i < _ref; i += 2) {
              this.shiftBuffer[i + 0] = shiftbits.read(shift);
              this.shiftBuffer[i + 1] = shiftbits.read(shift);
            }
          }
          switch (this.config.bitDepth) {
            case 16:
              out16 = new Int16Array(output, channelIndex);
              Matrixlib.unmix16(this.mixBufferU, this.mixBufferV, out16, channels, samples, mixBits, mixRes);
              break;
            default:
              console.log("Evil bit depth");
              return [-1231];
          }
          channelIndex += 2;
          break;
        case ID_CCE:
        case ID_PCE:
          console.log("Unsupported element");
          return [ALAC.errors.paramError];
        case ID_DSE:
          console.log("Data Stream element, ignoring");
          elementInstanceTag = data.readSmall(4);
          dataByteAlignFlag = data.readOne();
          count = data.readSmall(8);
          if (count === 255) count += data.readSmall(8);
          if (dataByteAlignFlag) data.align();
          data.advance(count * 8);
          if (!(data.pos < data.length)) {
            console.log("My first overrun");
            return [ALAC.errors.paramError];
          }
          status = ALAC.errors.noError;
          break;
        case ID_FIL:
          console.log("Fill element, ignoring");
          count = data.readSmall(4);
          if (count === 15) count += data.readSmall(8) - 1;
          data.advance(count * 8);
          if (!(data.pos < data.length)) {
            console.log("Another overrun");
            return [ALAC.errors.paramError];
          }
          status = ALAC.errors.noError;
          break;
        case ID_END:
          data.align();
          end = true;
          break;
        default:
          console.log("Error in frame");
          return [ALAC.errors.paramError];
      }
      if (channelIndex > channels) console.log("Channel Index is high");
    }
    return [status, output];
  };

  return ALACDecoder;

})();

this.ALACDecoder = ALACDecoder;

var Aglib;

Aglib = (function() {
  var BITOFF, KB0, MAX_DATATYPE_BITS_16, MAX_PREFIX_16, MAX_PREFIX_32, MAX_RUN_DEFAULT, MB0, MDENSHIFT, MMULSHIFT, MOFF, N_MAX_MEAN_CLAMP, N_MEAN_CLAMP_VAL, PB0, QB, QBSHIFT, dyn_get_16, dyn_get_32, lead;

  function Aglib() {}

  PB0 = 40;

  MB0 = 10;

  KB0 = 14;

  MAX_RUN_DEFAULT = 255;

  MAX_PREFIX_16 = 9;

  MAX_PREFIX_32 = 9;

  QBSHIFT = 9;

  QB = 1 << QBSHIFT;

  MMULSHIFT = 2;

  MDENSHIFT = QBSHIFT - MMULSHIFT - 1;

  MOFF = 1 << (MDENSHIFT - 2);

  N_MAX_MEAN_CLAMP = 0xFFFF;

  N_MEAN_CLAMP_VAL = 0xFFFF;

  MMULSHIFT = 2;

  BITOFF = 24;

  MAX_DATATYPE_BITS_16 = 16;

  lead = function(m) {
    var c, i;
    c = 1 << 31;
    for (i = 0; i < 32; i += 1) {
      if ((c & m) !== 0) return i;
      c >>>= 1;
    }
    return 32;
  };

  dyn_get_16 = function(data, m, k) {
    var bitsInPrefix, offs, result, stream, v;
    offs = data.bitPosition;
    stream = data.peekBig(32 - offs) << offs;
    bitsInPrefix = lead(~stream);
    if (bitsInPrefix >= MAX_PREFIX_16) {
      data.advance(MAX_PREFIX_16 + MAX_DATATYPE_BITS_16);
      stream <<= MAX_PREFIX_16;
      result = stream >>> (32 - MAX_DATATYPE_BITS_16);
    } else {
      data.advance(bitsInPrefix + k);
      stream <<= bitsInPrefix + 1;
      v = stream >>> (32 - k);
      result = bitsInPrefix * m + v - 1;
      if (v < 2) {
        result -= v - 1;
      } else {
        data.advance(1);
      }
    }
    return result;
  };

  dyn_get_32 = function(data, m, k, maxbits) {
    var offs, result, stream, v;
    offs = data.bitPosition;
    stream = data.peekSafeBig(32 - offs) << offs;
    result = lead(~stream);
    if (result >= MAX_PREFIX_32) {
      data.advance(MAX_PREFIX_32);
      return data.readBig(maxbits);
    } else {
      data.advance(result + 1);
      if (k !== 1) {
        stream <<= result + 1;
        result *= m;
        v = stream >>> (32 - k);
        data.advance(k - 1);
        if (v > 1) {
          result += v - 1;
          data.advance(1);
        }
      }
    }
    return result;
  };

  Aglib.standard_ag_params = function(fullwidth, sectorwidth) {
    return this.ag_params(MB0, PB0, KB0, fullwidth, sectorwidth, MAX_RUN_DEFAULT);
  };

  Aglib.ag_params = function(m, p, k, f, s, maxrun) {
    return {
      mb: m,
      mb0: m,
      pb: p,
      kb: k,
      wb: (1 << k) - 1,
      qb: QB - p,
      fw: f,
      sw: s,
      maxrun: maxrun
    };
  };

  Aglib.dyn_decomp = function(params, data, pc, samples, maxSize) {
    var c, j, k, kb, m, mb, multiplier, mz, n, ndecode, pb, status, wb, zmode;
    pb = params.pb, kb = params.kb, wb = params.wb, mb = params.mb0;
    zmode = 0;
    c = 0;
    status = ALAC.errors.noError;
    while (c < samples) {
      m = mb >>> QBSHIFT;
      k = Math.min(31 - lead(m + 3), kb);
      m = (1 << k) - 1;
      n = dyn_get_32(data, m, k, maxSize);
      ndecode = n + zmode;
      multiplier = -(ndecode & 1) | 1;
      pc[c++] = ((ndecode + 1) >>> 1) * multiplier;
      mb = pb * (n + zmode) + mb - ((pb * mb) >> QBSHIFT);
      if (n > N_MAX_MEAN_CLAMP) mb = N_MEAN_CLAMP_VAL;
      zmode = 0;
      if (((mb << MMULSHIFT) < QB) && (c < samples)) {
        zmode = 1;
        k = lead(mb) - BITOFF + ((mb + MOFF) >> MDENSHIFT);
        mz = ((1 << k) - 1) & wb;
        n = dyn_get_16(data, mz, k);
        if (!(c + n <= samples)) return ALAC.errors.paramError;
        for (j = 0; j < n; j += 1) {
          pc[c++] = 0;
        }
        if (n >= 65535) zmode = 0;
        mb = 0;
      }
    }
    return status;
  };

  return Aglib;

})();

var Dplib;

Dplib = (function() {
  var copy;

  function Dplib() {}

  copy = function(dst, dstOffset, src, srcOffset, n) {
    var destination, source;
    destination = new Uint8Array(dst, dstOffset, n);
    source = new Uint8Array(src, srcOffset, n);
    destination.set(source);
    return dst;
  };

  Dplib.unpc_block = function(pc1, out, num, coefs, active, chanbits, denshift) {
    var a0, a1, a2, a3, a4, a5, a6, a7, b0, b1, b2, b3, b4, b5, b6, b7, chanshift, dd, del, del0, denhalf, i, j, lim, offset, prev, sg, sgn, sum1, top, _ref, _ref2;
    chanshift = 32 - chanbits;
    denhalf = 1 << (denshift - 1);
    out[0] = pc1[0];
    if (active === 0) return copy(out, 0, pc1, 0, num * 4);
    if (active === 31) {
      prev = out[0];
      for (i = 1; i < num; i += 1) {
        del = pc1[i] + prev;
        prev = (del << chanshift) >> chanshift;
        out[i] = prev;
      }
      return;
    }
    for (i = 1; i <= active; i += 1) {
      del = pc1[i] + out[i - 1];
      out[i] = (del << chanshift) >> chanshift;
    }
    lim = active + 1;
    if (active === 4) {
      a0 = coefs[0], a1 = coefs[1], a2 = coefs[2], a3 = coefs[3];
      for (j = lim; j < num; j += 1) {
        top = out[j - lim];
        offset = j - 1;
        b0 = top - out[offset];
        b1 = top - out[offset - 1];
        b2 = top - out[offset - 2];
        b3 = top - out[offset - 3];
        sum1 = (denhalf - a0 * b0 - a1 * b1 - a2 * b2 - a3 * b3) >> denshift;
        del = del0 = pc1[j];
        sg = (-del >>> 31) | (del >> 31);
        del += top + sum1;
        out[j] = (del << chanshift) >> chanshift;
        if (sg > 0) {
          sgn = (-b3 >>> 31) | (b3 >> 31);
          a3 -= sgn;
          del0 -= 1 * ((sgn * b3) >> denshift);
          if (del0 <= 0) continue;
          sgn = (-b2 >>> 31) | (b2 >> 31);
          a2 -= sgn;
          del0 -= 2 * ((sgn * b2) >> denshift);
          if (del0 <= 0) continue;
          sgn = (-b1 >>> 31) | (b1 >> 31);
          a1 -= sgn;
          del0 -= 3 * ((sgn * b1) >> denshift);
          if (del0 <= 0) continue;
          a0 -= (-b0 >>> 31) | (b0 >> 31);
        } else if (sg < 0) {
          sgn = -((-b3 >>> 31) | (b3 >> 31));
          a3 -= sgn;
          del0 -= 1 * ((sgn * b3) >> denshift);
          if (del0 >= 0) continue;
          sgn = -((-b2 >>> 31) | (b2 >> 31));
          a2 -= sgn;
          del0 -= 2 * ((sgn * b2) >> denshift);
          if (del0 >= 0) continue;
          sgn = -((-b1 >>> 31) | (b1 >> 31));
          a1 -= sgn;
          del0 -= 3 * ((sgn * b1) >> denshift);
          if (del0 >= 0) continue;
          a0 += (-b0 >>> 31) | (b0 >> 31);
        }
      }
      coefs[0] = a0;
      coefs[1] = a1;
      coefs[2] = a2;
      coefs[3] = a3;
    } else if (active === 8) {
      a0 = coefs[0], a1 = coefs[1], a2 = coefs[2], a3 = coefs[3], a4 = coefs[4], a5 = coefs[5], a6 = coefs[6], a7 = coefs[7];
      for (j = lim; j < num; j += 1) {
        top = out[j - lim];
        offset = j - 1;
        b0 = top - out[offset];
        b1 = top - out[offset - 1];
        b2 = top - out[offset - 2];
        b3 = top - out[offset - 3];
        b4 = top - out[offset - 4];
        b5 = top - out[offset - 5];
        b6 = top - out[offset - 6];
        b7 = top - out[offset - 7];
        sum1 = (denhalf - a0 * b0 - a1 * b1 - a2 * b2 - a3 * b3 - a4 * b4 - a5 * b5 - a6 * b6 - a7 * b7) >> denshift;
        del = del0 = pc1[j];
        sg = (-del >>> 31) | (del >> 31);
        del += top + sum1;
        out[j] = (del << chanshift) >> chanshift;
        if (sg > 0) {
          sgn = (-b7 >>> 31) | (b7 >> 31);
          a7 -= sgn;
          del0 -= 1 * ((sgn * b7) >> denshift);
          if (del0 <= 0) continue;
          sgn = (-b6 >>> 31) | (b6 >> 31);
          a6 -= sgn;
          del0 -= 2 * ((sgn * b6) >> denshift);
          if (del0 <= 0) continue;
          sgn = (-b5 >>> 31) | (b5 >> 31);
          a5 -= sgn;
          del0 -= 3 * ((sgn * b5) >> denshift);
          if (del0 <= 0) continue;
          sgn = (-b4 >>> 31) | (b4 >> 31);
          a4 -= sgn;
          del0 -= 4 * ((sgn * b4) >> denshift);
          if (del0 <= 0) continue;
          sgn = (-b3 >>> 31) | (b3 >> 31);
          a3 -= sgn;
          del0 -= 5 * ((sgn * b3) >> denshift);
          if (del0 <= 0) continue;
          sgn = (-b2 >>> 31) | (b2 >> 31);
          a2 -= sgn;
          del0 -= 6 * ((sgn * b2) >> denshift);
          if (del0 <= 0) continue;
          sgn = (-b1 >>> 31) | (b1 >> 31);
          a1 -= sgn;
          del0 -= 7 * ((sgn * b1) >> denshift);
          if (del0 <= 0) continue;
          a0 -= (-b0 >>> 31) | (b0 >> 31);
        } else if (sg < 0) {
          sgn = -((-b7 >>> 31) | (b7 >> 31));
          a7 -= sgn;
          del0 -= 1 * ((sgn * b7) >> denshift);
          if (del0 >= 0) continue;
          sgn = -((-b6 >>> 31) | (b6 >> 31));
          a6 -= sgn;
          del0 -= 2 * ((sgn * b6) >> denshift);
          if (del0 >= 0) continue;
          sgn = -((-b5 >>> 31) | (b5 >> 31));
          a5 -= sgn;
          del0 -= 3 * ((sgn * b5) >> denshift);
          if (del0 >= 0) continue;
          sgn = -((-b4 >>> 31) | (b4 >> 31));
          a4 -= sgn;
          del0 -= 4 * ((sgn * b4) >> denshift);
          if (del0 >= 0) continue;
          sgn = -((-b3 >>> 31) | (b3 >> 31));
          a3 -= sgn;
          del0 -= 5 * ((sgn * b3) >> denshift);
          if (del0 >= 0) continue;
          sgn = -((-b2 >>> 31) | (b2 >> 31));
          a2 -= sgn;
          del0 -= 6 * ((sgn * b2) >> denshift);
          if (del0 >= 0) continue;
          sgn = -((-b1 >>> 31) | (b1 >> 31));
          a1 -= sgn;
          del0 -= 7 * ((sgn * b1) >> denshift);
          if (del0 >= 0) continue;
          a0 += (-b0 >>> 31) | (b0 >> 31);
        }
      }
      coefs[0] = a0;
      coefs[1] = a1;
      coefs[2] = a2;
      coefs[3] = a3;
      coefs[4] = a4;
      coefs[5] = a5;
      coefs[6] = a6;
      coefs[7] = a7;
    } else {
      for (i = lim; i < num; i += 1) {
        sum1 = 0;
        top = out[i - lim];
        offset = i - 1;
        for (j = 0; j < active; j += 1) {
          sum1 += coefs[j] * (out[offset - j] - top);
        }
        del = del0 = pc1[i];
        sg = (-del >>> 31) | (del >> 31);
        del += top + ((sum1 + denhalf) >> denshift);
        out[i] = (del << chanshift) >> chanshift;
        if (sg > 0) {
          for (j = _ref = active - 1; j >= 0; j += -1) {
            dd = top - out[offset - j];
            sgn = (-dd >>> 31) | (dd >> 31);
            coefs[j] -= sgn;
            del0 -= (active - j) * ((sgn * dd) >> denshift);
            if (del0 <= 0) break;
          }
        } else if (sg < 0) {
          for (j = _ref2 = active - 1; j >= 0; j += -1) {
            dd = top - out[offset - j];
            sgn = (-dd >>> 31) | (dd >> 31);
            coefs[j] += sgn;
            del0 -= (active - j) * ((-sgn * dd) >> denshift);
            if (del0 >= 0) break;
          }
        }
      }
    }
  };

  return Dplib;

})();

var Matrixlib;

Matrixlib = (function() {

  function Matrixlib() {}

  Matrixlib.unmix16 = function(u, v, out, stride, samples, mixbits, mixres) {
    var i, l;
    if (mixres === 0) {
      for (i = 0; i < samples; i += 1) {
        out[i * stride + 0] = u[i];
        out[i * stride + 1] = v[i];
      }
    } else {
      for (i = 0; i < samples; i += 1) {
        l = u[i] + v[i] - ((mixres * v[i]) >> mixbits);
        out[i * stride + 0] = l;
        out[i * stride + 1] = l - v[i];
      }
    }
  };

  return Matrixlib;

})();

var ALACDec;
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

ALACDec = (function() {

  __extends(ALACDec, Decoder);

  function ALACDec() {
    this.readChunk = __bind(this.readChunk, this);
    ALACDec.__super__.constructor.apply(this, arguments);
  }

  Decoder.register('alac', ALACDec);

  ALACDec.prototype.setCookie = function(buffer) {
    return this.decoder = new ALACDecoder(buffer);
  };

  ALACDec.prototype.readChunk = function() {
    var out;
    if (!this.bitstream.available(4096 << 6)) {
      return this.once('available', this.readChunk);
    } else {
      out = this.decoder.decode(this.bitstream, this.format.framesPerPacket, this.format.channelsPerFrame);
      if (out[0] !== 0) {
        return this.emit('error', "Error in ALAC decoder: " + out[0]);
      }
      if (out[1]) return this.emit('data', out[1]);
    }
  };

  return ALACDec;

})();



