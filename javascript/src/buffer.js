// code from https://codeload.github.com/dcodeIO/bytebuffer.js

/**
 * Constructs a new ByteBuffer.
 * @class The swiss army knife for binary data in JavaScript.
 * @exports ByteBuffer
 * @constructor
 * @param {number=} capacity Initial capacity. Defaults to {@link ByteBuffer.DEFAULT_CAPACITY}.
 * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
 *  {@link ByteBuffer.DEFAULT_ENDIAN}.
 * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
 *  {@link ByteBuffer.DEFAULT_NOASSERT}.
 * @expose
 */
var ByteBuffer = function(capacity, littleEndian, noAssert) {
    if (typeof capacity === 'undefined')
        capacity = ByteBuffer.DEFAULT_CAPACITY;
    if (typeof littleEndian === 'undefined')
        littleEndian = ByteBuffer.DEFAULT_ENDIAN;
    if (typeof noAssert === 'undefined')
        noAssert = ByteBuffer.DEFAULT_NOASSERT;
    if (!noAssert) {
        capacity = capacity | 0;
        if (capacity < 0)
            throw RangeError("Illegal capacity");
        littleEndian = !!littleEndian;
        noAssert = !!noAssert;
    }

    /**
     * Backing ArrayBuffer.
     * @type {!ArrayBuffer}
     * @expose
     */
    this.buffer = capacity === 0 ? EMPTY_BUFFER : new ArrayBuffer(capacity);

    /**
     * Uint8Array utilized to manipulate the backing buffer. Becomes `null` if the backing buffer has a capacity of `0`.
     * @type {?Uint8Array}
     * @expose
     */
    this.view = capacity === 0 ? null : new Uint8Array(this.buffer);

    /**
     * Absolute read/write offset.
     * @type {number}
     * @expose
     * @see ByteBuffer#flip
     * @see ByteBuffer#clear
     */
    this.offset = 0;

    /**
     * Marked offset.
     * @type {number}
     * @expose
     * @see ByteBuffer#mark
     * @see ByteBuffer#reset
     */
    this.markedOffset = -1;

    /**
     * Absolute limit of the contained data. Set to the backing buffer's capacity upon allocation.
     * @type {number}
     * @expose
     * @see ByteBuffer#flip
     * @see ByteBuffer#clear
     */
    this.limit = capacity;

    /**
     * Whether to use little endian byte order, defaults to `false` for big endian.
     * @type {boolean}
     * @expose
     */
    this.littleEndian = littleEndian;

    /**
     * Whether to skip assertions of offsets and values, defaults to `false`.
     * @type {boolean}
     * @expose
     */
    this.noAssert = noAssert;

    /**
     * .
     * @type {array}
     * @expose
     */
    this.str_arr = [];
};

/**
 * ByteBuffer version.
 * @type {string}
 * @const
 * @expose
 */
ByteBuffer.VERSION = "5.0.1";

/**
 * Little endian constant that can be used instead of its boolean value. Evaluates to `true`.
 * @type {boolean}
 * @const
 * @expose
 */
ByteBuffer.LITTLE_ENDIAN = true;

/**
 * Big endian constant that can be used instead of its boolean value. Evaluates to `false`.
 * @type {boolean}
 * @const
 * @expose
 */
ByteBuffer.BIG_ENDIAN = false;

/**
 * Default initial capacity of `16`.
 * @type {number}
 * @expose
 */
ByteBuffer.DEFAULT_CAPACITY = 16;

/**
 * Default endianess of `false` for big endian.
 * @type {boolean}
 * @expose
 */
ByteBuffer.DEFAULT_ENDIAN = ByteBuffer.LITTLE_ENDIAN;

/**
 * Default no assertions flag of `false`.
 * @type {boolean}
 * @expose
 */
ByteBuffer.DEFAULT_NOASSERT = false;

/**
 * @alias ByteBuffer.prototype
 * @inner
 */
var ByteBufferPrototype = ByteBuffer.prototype;

/**
 * An indicator used to reliably determine if an object is a ByteBuffer or not.
 * @type {boolean}
 * @const
 * @expose
 * @private
 */
ByteBufferPrototype.__isByteBuffer__;

Object.defineProperty(ByteBufferPrototype, "__isByteBuffer__", {
    value: true,
    enumerable: false,
    configurable: false
});

// helpers

/**
 * @type {!ArrayBuffer}
 * @inner
 */
var EMPTY_BUFFER = new ArrayBuffer(0);

/**
 * String.fromCharCode reference for compile-time renaming.
 * @type {function(...number):string}
 * @inner
 */
var stringFromCharCode = String.fromCharCode;

/**
 * Creates a source function for a string.
 * @param {string} s String to read from
 * @returns {function():number|null} Source function returning the next char code respectively `null` if there are
 *  no more characters left.
 * @throws {TypeError} If the argument is invalid
 * @inner
 */
function stringSource(s) {
    var i=0; return function() {
        return i < s.length ? s.charCodeAt(i++) : null;
    };
}

/**
 * Creates a destination function for a string.
 * @returns {function(number=):undefined|string} Destination function successively called with the next char code.
 *  Returns the final string when called without arguments.
 * @inner
 */
function stringDestination() {
    var cs = [], ps = []; return function() {
        if (arguments.length === 0)
            return ps.join('')+stringFromCharCode.apply(String, cs);
        if (cs.length + arguments.length > 1024)
            ps.push(stringFromCharCode.apply(String, cs)),
                cs.length = 0;
        Array.prototype.push.apply(cs, arguments);
    };
}

/**
 * Gets the accessor type.
 * @returns {Function} `Buffer` under node.js, `Uint8Array` respectively `DataView` in the browser (classes)
 * @expose
 */
ByteBuffer.accessor = function() {
    return Uint8Array;
};
/**
 * Allocates a new ByteBuffer backed by a buffer of the specified capacity.
 * @param {number=} capacity Initial capacity. Defaults to {@link ByteBuffer.DEFAULT_CAPACITY}.
 * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
 *  {@link ByteBuffer.DEFAULT_ENDIAN}.
 * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
 *  {@link ByteBuffer.DEFAULT_NOASSERT}.
 * @returns {!ByteBuffer}
 * @expose
 */
ByteBuffer.allocate = function(capacity, littleEndian, noAssert) {
    return new ByteBuffer(capacity, littleEndian, noAssert);
};

/**
 * Concatenates multiple ByteBuffers into one.
 * @param {!Array.<!ByteBuffer|!ArrayBuffer|!Uint8Array|string>} buffers Buffers to concatenate
 * @param {(string|boolean)=} encoding String encoding if `buffers` contains a string ("base64", "hex", "binary",
 *  defaults to "utf8")
 * @param {boolean=} littleEndian Whether to use little or big endian byte order for the resulting ByteBuffer. Defaults
 *  to {@link ByteBuffer.DEFAULT_ENDIAN}.
 * @param {boolean=} noAssert Whether to skip assertions of offsets and values for the resulting ByteBuffer. Defaults to
 *  {@link ByteBuffer.DEFAULT_NOASSERT}.
 * @returns {!ByteBuffer} Concatenated ByteBuffer
 * @expose
 */
ByteBuffer.concat = function(buffers, encoding, littleEndian, noAssert) {
    if (typeof encoding === 'boolean' || typeof encoding !== 'string') {
        noAssert = littleEndian;
        littleEndian = encoding;
        encoding = undefined;
    }
    var capacity = 0;
    for (var i=0, k=buffers.length, length; i<k; ++i) {
        if (!ByteBuffer.isByteBuffer(buffers[i]))
            buffers[i] = ByteBuffer.wrap(buffers[i], encoding);
        length = buffers[i].limit - buffers[i].offset;
        if (length > 0) capacity += length;
    }
    if (capacity === 0)
        return new ByteBuffer(0, littleEndian, noAssert);
    var bb = new ByteBuffer(capacity, littleEndian, noAssert),
        bi;
    i=0; while (i<k) {
        bi = buffers[i++];
        length = bi.limit - bi.offset;
        if (length <= 0) continue;
        bb.view.set(bi.view.subarray(bi.offset, bi.limit), bb.offset);
        bb.offset += length;
    }
    bb.limit = bb.offset;
    bb.offset = 0;
    return bb;
};

/**
 * Tests if the specified type is a ByteBuffer.
 * @param {*} bb ByteBuffer to test
 * @returns {boolean} `true` if it is a ByteBuffer, otherwise `false`
 * @expose
 */
ByteBuffer.isByteBuffer = function(bb) {
    return (bb && bb["__isByteBuffer__"]) === true;
};
/**
 * Gets the backing buffer type.
 * @returns {Function} `Buffer` under node.js, `ArrayBuffer` in the browser (classes)
 * @expose
 */
ByteBuffer.type = function() {
    return ArrayBuffer;
};
/**
 * Wraps a buffer or a string. Sets the allocated ByteBuffer's {@link ByteBuffer#offset} to `0` and its
 *  {@link ByteBuffer#limit} to the length of the wrapped data.
 * @param {!ByteBuffer|!ArrayBuffer|!Uint8Array|string|!Array.<number>} buffer Anything that can be wrapped
 * @param {(string|boolean)=} encoding String encoding if `buffer` is a string ("base64", "hex", "binary", defaults to
 *  "utf8")
 * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
 *  {@link ByteBuffer.DEFAULT_ENDIAN}.
 * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
 *  {@link ByteBuffer.DEFAULT_NOASSERT}.
 * @returns {!ByteBuffer} A ByteBuffer wrapping `buffer`
 * @expose
 */
ByteBuffer.wrap = function(buffer, encoding, littleEndian, noAssert) {
    if (typeof encoding !== 'string') {
        noAssert = littleEndian;
        littleEndian = encoding;
        encoding = undefined;
    }
    if (typeof buffer === 'string') {
        if (typeof encoding === 'undefined')
            encoding = "utf8";
        switch (encoding) {
            case "hex":
                return ByteBuffer.fromHex(buffer, littleEndian);
            case "binary":
                return ByteBuffer.fromBinary(buffer, littleEndian);
            case "utf8":
                return ByteBuffer.fromUTF8(buffer, littleEndian);
            default:
                throw Error("Unsupported encoding: "+encoding);
        }
    }
    if (buffer === null || typeof buffer !== 'object')
        throw TypeError("Illegal buffer");
    var bb;
    if (ByteBuffer.isByteBuffer(buffer)) {
        bb = ByteBufferPrototype.clone.call(buffer);
        bb.markedOffset = -1;
        return bb;
    }
    if (buffer instanceof Uint8Array) { // Extract ArrayBuffer from Uint8Array
        bb = new ByteBuffer(0, littleEndian, noAssert);
        if (buffer.length > 0) { // Avoid references to more than one EMPTY_BUFFER
            bb.buffer = buffer.buffer;
            bb.offset = buffer.byteOffset;
            bb.limit = buffer.byteOffset + buffer.byteLength;
            bb.view = new Uint8Array(buffer.buffer);
        }
    } else if (buffer instanceof ArrayBuffer) { // Reuse ArrayBuffer
        bb = new ByteBuffer(0, littleEndian, noAssert);
        if (buffer.byteLength > 0) {
            bb.buffer = buffer;
            bb.offset = 0;
            bb.limit = buffer.byteLength;
            bb.view = buffer.byteLength > 0 ? new Uint8Array(buffer) : null;
        }
    } else if (Object.prototype.toString.call(buffer) === "[object Array]") { // Create from octets
        bb = new ByteBuffer(buffer.length, littleEndian, noAssert);
        bb.limit = buffer.length;
        for (var i=0; i<buffer.length; ++i)
            bb.view[i] = buffer[i];
    } else
        throw TypeError("Illegal buffer"); // Otherwise fail
    return bb;
};

/**
 * Writes the array as a bitset.
 * @param {Array<boolean>} value Array of booleans to write
 * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `length` if omitted.
 * @returns {!ByteBuffer}
 * @expose
 */
ByteBufferPrototype.writeBitSet = function(value, offset) {
  var relative = typeof offset === 'undefined';
  if (relative) offset = this.offset;
  if (!this.noAssert) {
    if (!(value instanceof Array))
      throw TypeError("Illegal BitSet: Not an array");
    if (typeof offset !== 'number' || offset % 1 !== 0)
        throw TypeError("Illegal offset: "+offset+" (not an integer)");
    offset >>>= 0;
    if (offset < 0 || offset + 0 > this.buffer.byteLength)
        throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
  }

  var start = offset,
      bits = value.length,
      bytes = (bits >> 3),
      bit = 0,
      k;

  offset += this.writeVarint32(bits,offset);

  while(bytes--) {
    k = (!!value[bit++] & 1) |
        ((!!value[bit++] & 1) << 1) |
        ((!!value[bit++] & 1) << 2) |
        ((!!value[bit++] & 1) << 3) |
        ((!!value[bit++] & 1) << 4) |
        ((!!value[bit++] & 1) << 5) |
        ((!!value[bit++] & 1) << 6) |
        ((!!value[bit++] & 1) << 7);
    this.writeByte(k,offset++);
  }

  if(bit < bits) {
    var m = 0; k = 0;
    while(bit < bits) k = k | ((!!value[bit++] & 1) << (m++));
    this.writeByte(k,offset++);
  }

  if (relative) {
    this.offset = offset;
    return this;
  }
  return offset - start;
}

/**
 * Reads a BitSet as an array of booleans.
 * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `length` if omitted.
 * @returns {Array<boolean>
 * @expose
 */
ByteBufferPrototype.readBitSet = function(offset) {
  var relative = typeof offset === 'undefined';
  if (relative) offset = this.offset;

  var ret = this.readVarint32(offset),
      bits = ret.value,
      bytes = (bits >> 3),
      bit = 0,
      value = [],
      k;

  offset += ret.length;

  while(bytes--) {
    k = this.readByte(offset++);
    value[bit++] = !!(k & 0x01);
    value[bit++] = !!(k & 0x02);
    value[bit++] = !!(k & 0x04);
    value[bit++] = !!(k & 0x08);
    value[bit++] = !!(k & 0x10);
    value[bit++] = !!(k & 0x20);
    value[bit++] = !!(k & 0x40);
    value[bit++] = !!(k & 0x80);
  }

  if(bit < bits) {
    var m = 0;
    k = this.readByte(offset++);
    while(bit < bits) value[bit++] = !!((k >> (m++)) & 1);
  }

  if (relative) {
    this.offset = offset;
  }
  return value;
}
/**
 * Reads the specified number of bytes.
 * @param {number} length Number of bytes to read
 * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `length` if omitted.
 * @returns {!ByteBuffer}
 * @expose
 */
ByteBufferPrototype.readBytes = function(length, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    if (!this.noAssert) {
        if (typeof offset !== 'number' || offset % 1 !== 0)
            throw TypeError("Illegal offset: "+offset+" (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + length > this.buffer.byteLength)
            throw RangeError("Illegal offset: 0 <= "+offset+" (+"+length+") <= "+this.buffer.byteLength);
    }
    var slice = this.slice(offset, offset + length);
    if (relative) this.offset += length;
    return slice;
};

/**
 * Writes a payload of bytes. This is an alias of {@link ByteBuffer#append}.
 * @function
 * @param {!ByteBuffer|!ArrayBuffer|!Uint8Array|string} source Data to write. If `source` is a ByteBuffer, its offsets
 *  will be modified according to the performed read operation.
 * @param {(string|number)=} encoding Encoding if `data` is a string ("base64", "hex", "binary", defaults to "utf8")
 * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
 *  written if omitted.
 * @returns {!ByteBuffer} this
 * @expose
 */
ByteBufferPrototype.writeBytes = ByteBufferPrototype.append;

// types/ints/int8

/**
 * Writes an 8bit signed integer.
 * @param {number} value Value to write
 * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
 * @returns {!ByteBuffer} this
 * @expose
 */
ByteBufferPrototype.writeInt8 = function(value, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    if (!this.noAssert) {
        if (typeof value !== 'number' || value % 1 !== 0)
            throw TypeError("Illegal value: "+value+" (not an integer)");
        value |= 0;
        if (typeof offset !== 'number' || offset % 1 !== 0)
            throw TypeError("Illegal offset: "+offset+" (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 0 > this.buffer.byteLength)
            throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
    }
    offset += 1;
    var capacity0 = this.buffer.byteLength;
    if (offset > capacity0)
        this.resize((capacity0 *= 2) > offset ? capacity0 : offset);
    offset -= 1;
    this.view[offset] = value;
    if (relative) this.offset += 1;
    return this;
};

/**
 * Writes an 8bit signed integer. This is an alias of {@link ByteBuffer#writeInt8}.
 * @function
 * @param {number} value Value to write
 * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
 * @returns {!ByteBuffer} this
 * @expose
 */
ByteBufferPrototype.writeByte = ByteBufferPrototype.writeInt8;

/**
 * Reads an 8bit signed integer.
 * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
 * @returns {number} Value read
 * @expose
 */
ByteBufferPrototype.readInt8 = function(offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    if (!this.noAssert) {
        if (typeof offset !== 'number' || offset % 1 !== 0)
            throw TypeError("Illegal offset: "+offset+" (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 1 > this.buffer.byteLength)
            throw RangeError("Illegal offset: 0 <= "+offset+" (+"+1+") <= "+this.buffer.byteLength);
    }
    var value = this.view[offset];
    if ((value & 0x80) === 0x80) value = -(0xFF - value + 1); // Cast to signed
    if (relative) this.offset += 1;
    return value;
};

/**
 * Reads an 8bit signed integer. This is an alias of {@link ByteBuffer#readInt8}.
 * @function
 * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
 * @returns {number} Value read
 * @expose
 */
ByteBufferPrototype.readByte = ByteBufferPrototype.readInt8;

/**
 * Writes an 8bit unsigned integer.
 * @param {number} value Value to write
 * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
 * @returns {!ByteBuffer} this
 * @expose
 */
ByteBufferPrototype.writeUint8 = function(value, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    if (!this.noAssert) {
        if (typeof value !== 'number' || value % 1 !== 0)
            throw TypeError("Illegal value: "+value+" (not an integer)");
        value >>>= 0;
        if (typeof offset !== 'number' || offset % 1 !== 0)
            throw TypeError("Illegal offset: "+offset+" (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 0 > this.buffer.byteLength)
            throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
    }
    offset += 1;
    var capacity1 = this.buffer.byteLength;
    if (offset > capacity1)
        this.resize((capacity1 *= 2) > offset ? capacity1 : offset);
    offset -= 1;
    this.view[offset] = value;
    if (relative) this.offset += 1;
    return this;
};

/**
 * Writes an 8bit unsigned integer. This is an alias of {@link ByteBuffer#writeUint8}.
 * @function
 * @param {number} value Value to write
 * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
 * @returns {!ByteBuffer} this
 * @expose
 */
ByteBufferPrototype.writeUInt8 = ByteBufferPrototype.writeUint8;

/**
 * Reads an 8bit unsigned integer.
 * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
 * @returns {number} Value read
 * @expose
 */
ByteBufferPrototype.readUint8 = function(offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    if (!this.noAssert) {
        if (typeof offset !== 'number' || offset % 1 !== 0)
            throw TypeError("Illegal offset: "+offset+" (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 1 > this.buffer.byteLength)
            throw RangeError("Illegal offset: 0 <= "+offset+" (+"+1+") <= "+this.buffer.byteLength);
    }
    var value = this.view[offset];
    if (relative) this.offset += 1;
    return value;
};

/**
 * Reads an 8bit unsigned integer. This is an alias of {@link ByteBuffer#readUint8}.
 * @function
 * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
 * @returns {number} Value read
 * @expose
 */
ByteBufferPrototype.readUInt8 = ByteBufferPrototype.readUint8;

// types/ints/int16

/**
 * Writes a 16bit signed integer.
 * @param {number} value Value to write
 * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
 * @throws {TypeError} If `offset` or `value` is not a valid number
 * @throws {RangeError} If `offset` is out of bounds
 * @expose
 */
ByteBufferPrototype.writeInt16 = function(value, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    if (!this.noAssert) {
        if (typeof value !== 'number' || value % 1 !== 0)
            throw TypeError("Illegal value: "+value+" (not an integer)");
        value |= 0;
        if (typeof offset !== 'number' || offset % 1 !== 0)
            throw TypeError("Illegal offset: "+offset+" (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 0 > this.buffer.byteLength)
            throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
    }
    offset += 2;
    var capacity2 = this.buffer.byteLength;
    if (offset > capacity2)
        this.resize((capacity2 *= 2) > offset ? capacity2 : offset);
    offset -= 2;
    if (this.littleEndian) {
        this.view[offset+1] = (value & 0xFF00) >>> 8;
        this.view[offset  ] =  value & 0x00FF;
    } else {
        this.view[offset]   = (value & 0xFF00) >>> 8;
        this.view[offset+1] =  value & 0x00FF;
    }
    if (relative) this.offset += 2;
    return this;
};

/**
 * Writes a 16bit signed integer. This is an alias of {@link ByteBuffer#writeInt16}.
 * @function
 * @param {number} value Value to write
 * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
 * @throws {TypeError} If `offset` or `value` is not a valid number
 * @throws {RangeError} If `offset` is out of bounds
 * @expose
 */
ByteBufferPrototype.writeShort = ByteBufferPrototype.writeInt16;

/**
 * Reads a 16bit signed integer.
 * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
 * @returns {number} Value read
 * @throws {TypeError} If `offset` is not a valid number
 * @throws {RangeError} If `offset` is out of bounds
 * @expose
 */
ByteBufferPrototype.readInt16 = function(offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    if (!this.noAssert) {
        if (typeof offset !== 'number' || offset % 1 !== 0)
            throw TypeError("Illegal offset: "+offset+" (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 2 > this.buffer.byteLength)
            throw RangeError("Illegal offset: 0 <= "+offset+" (+"+2+") <= "+this.buffer.byteLength);
    }
    var value = 0;
    if (this.littleEndian) {
        value  = this.view[offset  ];
        value |= this.view[offset+1] << 8;
    } else {
        value  = this.view[offset  ] << 8;
        value |= this.view[offset+1];
    }
    if ((value & 0x8000) === 0x8000) value = -(0xFFFF - value + 1); // Cast to signed
    if (relative) this.offset += 2;
    return value;
};

/**
 * Reads a 16bit signed integer. This is an alias of {@link ByteBuffer#readInt16}.
 * @function
 * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
 * @returns {number} Value read
 * @throws {TypeError} If `offset` is not a valid number
 * @throws {RangeError} If `offset` is out of bounds
 * @expose
 */
ByteBufferPrototype.readShort = ByteBufferPrototype.readInt16;

/**
 * Writes a 16bit unsigned integer.
 * @param {number} value Value to write
 * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
 * @throws {TypeError} If `offset` or `value` is not a valid number
 * @throws {RangeError} If `offset` is out of bounds
 * @expose
 */
ByteBufferPrototype.writeUint16 = function(value, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    if (!this.noAssert) {
        if (typeof value !== 'number' || value % 1 !== 0)
            throw TypeError("Illegal value: "+value+" (not an integer)");
        value >>>= 0;
        if (typeof offset !== 'number' || offset % 1 !== 0)
            throw TypeError("Illegal offset: "+offset+" (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 0 > this.buffer.byteLength)
            throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
    }
    offset += 2;
    var capacity3 = this.buffer.byteLength;
    if (offset > capacity3)
        this.resize((capacity3 *= 2) > offset ? capacity3 : offset);
    offset -= 2;
    if (this.littleEndian) {
        this.view[offset+1] = (value & 0xFF00) >>> 8;
        this.view[offset  ] =  value & 0x00FF;
    } else {
        this.view[offset]   = (value & 0xFF00) >>> 8;
        this.view[offset+1] =  value & 0x00FF;
    }
    if (relative) this.offset += 2;
    return this;
};

/**
 * Writes a 16bit unsigned integer. This is an alias of {@link ByteBuffer#writeUint16}.
 * @function
 * @param {number} value Value to write
 * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
 * @throws {TypeError} If `offset` or `value` is not a valid number
 * @throws {RangeError} If `offset` is out of bounds
 * @expose
 */
ByteBufferPrototype.writeUInt16 = ByteBufferPrototype.writeUint16;

/**
 * Reads a 16bit unsigned integer.
 * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
 * @returns {number} Value read
 * @throws {TypeError} If `offset` is not a valid number
 * @throws {RangeError} If `offset` is out of bounds
 * @expose
 */
ByteBufferPrototype.readUint16 = function(offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    if (!this.noAssert) {
        if (typeof offset !== 'number' || offset % 1 !== 0)
            throw TypeError("Illegal offset: "+offset+" (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 2 > this.buffer.byteLength)
            throw RangeError("Illegal offset: 0 <= "+offset+" (+"+2+") <= "+this.buffer.byteLength);
    }
    var value = 0;
    if (this.littleEndian) {
        value  = this.view[offset  ];
        value |= this.view[offset+1] << 8;
    } else {
        value  = this.view[offset  ] << 8;
        value |= this.view[offset+1];
    }
    if (relative) this.offset += 2;
    return value;
};

/**
 * Reads a 16bit unsigned integer. This is an alias of {@link ByteBuffer#readUint16}.
 * @function
 * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
 * @returns {number} Value read
 * @throws {TypeError} If `offset` is not a valid number
 * @throws {RangeError} If `offset` is out of bounds
 * @expose
 */
ByteBufferPrototype.readUInt16 = ByteBufferPrototype.readUint16;

// types/ints/int32

/**
 * Writes a 32bit signed integer.
 * @param {number} value Value to write
 * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
 * @expose
 */
ByteBufferPrototype.writeInt32 = function(value, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    if (!this.noAssert) {
        if (typeof value !== 'number' || value % 1 !== 0)
            throw TypeError("Illegal value: "+value+" (not an integer)");
        value |= 0;
        if (typeof offset !== 'number' || offset % 1 !== 0)
            throw TypeError("Illegal offset: "+offset+" (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 0 > this.buffer.byteLength)
            throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
    }
    offset += 4;
    var capacity4 = this.buffer.byteLength;
    if (offset > capacity4)
        this.resize((capacity4 *= 2) > offset ? capacity4 : offset);
    offset -= 4;
    if (this.littleEndian) {
        this.view[offset+3] = (value >>> 24) & 0xFF;
        this.view[offset+2] = (value >>> 16) & 0xFF;
        this.view[offset+1] = (value >>>  8) & 0xFF;
        this.view[offset  ] =  value         & 0xFF;
    } else {
        this.view[offset  ] = (value >>> 24) & 0xFF;
        this.view[offset+1] = (value >>> 16) & 0xFF;
        this.view[offset+2] = (value >>>  8) & 0xFF;
        this.view[offset+3] =  value         & 0xFF;
    }
    if (relative) this.offset += 4;
    return this;
};

/**
 * Writes a 32bit signed integer. This is an alias of {@link ByteBuffer#writeInt32}.
 * @param {number} value Value to write
 * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
 * @expose
 */
ByteBufferPrototype.writeInt = ByteBufferPrototype.writeInt32;

/**
 * Reads a 32bit signed integer.
 * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
 * @returns {number} Value read
 * @expose
 */
ByteBufferPrototype.readInt32 = function(offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    if (!this.noAssert) {
        if (typeof offset !== 'number' || offset % 1 !== 0)
            throw TypeError("Illegal offset: "+offset+" (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 4 > this.buffer.byteLength)
            throw RangeError("Illegal offset: 0 <= "+offset+" (+"+4+") <= "+this.buffer.byteLength);
    }
    var value = 0;
    if (this.littleEndian) {
        value  = this.view[offset+2] << 16;
        value |= this.view[offset+1] <<  8;
        value |= this.view[offset  ];
        value += this.view[offset+3] << 24 >>> 0;
    } else {
        value  = this.view[offset+1] << 16;
        value |= this.view[offset+2] <<  8;
        value |= this.view[offset+3];
        value += this.view[offset  ] << 24 >>> 0;
    }
    value |= 0; // Cast to signed
    if (relative) this.offset += 4;
    return value;
};

/**
 * Reads a 32bit signed integer. This is an alias of {@link ByteBuffer#readInt32}.
 * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `4` if omitted.
 * @returns {number} Value read
 * @expose
 */
ByteBufferPrototype.readInt = ByteBufferPrototype.readInt32;

/**
 * Writes a 32bit unsigned integer.
 * @param {number} value Value to write
 * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
 * @expose
 */
ByteBufferPrototype.writeUint32 = function(value, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    if (!this.noAssert) {
        if (typeof value !== 'number' || value % 1 !== 0)
            throw TypeError("Illegal value: "+value+" (not an integer)");
        value >>>= 0;
        if (typeof offset !== 'number' || offset % 1 !== 0)
            throw TypeError("Illegal offset: "+offset+" (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 0 > this.buffer.byteLength)
            throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
    }
    offset += 4;
    var capacity5 = this.buffer.byteLength;
    if (offset > capacity5)
        this.resize((capacity5 *= 2) > offset ? capacity5 : offset);
    offset -= 4;
    if (this.littleEndian) {
        this.view[offset+3] = (value >>> 24) & 0xFF;
        this.view[offset+2] = (value >>> 16) & 0xFF;
        this.view[offset+1] = (value >>>  8) & 0xFF;
        this.view[offset  ] =  value         & 0xFF;
    } else {
        this.view[offset  ] = (value >>> 24) & 0xFF;
        this.view[offset+1] = (value >>> 16) & 0xFF;
        this.view[offset+2] = (value >>>  8) & 0xFF;
        this.view[offset+3] =  value         & 0xFF;
    }
    if (relative) this.offset += 4;
    return this;
};

/**
 * Writes a 32bit unsigned integer. This is an alias of {@link ByteBuffer#writeUint32}.
 * @function
 * @param {number} value Value to write
 * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
 * @expose
 */
ByteBufferPrototype.writeUInt32 = ByteBufferPrototype.writeUint32;

/**
 * Reads a 32bit unsigned integer.
 * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
 * @returns {number} Value read
 * @expose
 */
ByteBufferPrototype.readUint32 = function(offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    if (!this.noAssert) {
        if (typeof offset !== 'number' || offset % 1 !== 0)
            throw TypeError("Illegal offset: "+offset+" (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 4 > this.buffer.byteLength)
            throw RangeError("Illegal offset: 0 <= "+offset+" (+"+4+") <= "+this.buffer.byteLength);
    }
    var value = 0;
    if (this.littleEndian) {
        value  = this.view[offset+2] << 16;
        value |= this.view[offset+1] <<  8;
        value |= this.view[offset  ];
        value += this.view[offset+3] << 24 >>> 0;
    } else {
        value  = this.view[offset+1] << 16;
        value |= this.view[offset+2] <<  8;
        value |= this.view[offset+3];
        value += this.view[offset  ] << 24 >>> 0;
    }
    if (relative) this.offset += 4;
    return value;
};

/**
 * Reads a 32bit unsigned integer. This is an alias of {@link ByteBuffer#readUint32}.
 * @function
 * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
 * @returns {number} Value read
 * @expose
 */
ByteBufferPrototype.readUInt32 = ByteBufferPrototype.readUint32;


/**
 * Reads an IEEE754 float from a byte array.
 * @param {!Array} buffer
 * @param {number} offset
 * @param {boolean} isLE
 * @param {number} mLen
 * @param {number} nBytes
 * @returns {number}
 * @inner
 */
function ieee754_read(buffer, offset, isLE, mLen, nBytes) {
    var e, m,
        eLen = nBytes * 8 - mLen - 1,
        eMax = (1 << eLen) - 1,
        eBias = eMax >> 1,
        nBits = -7,
        i = isLE ? (nBytes - 1) : 0,
        d = isLE ? -1 : 1,
        s = buffer[offset + i];

    i += d;

    e = s & ((1 << (-nBits)) - 1);
    s >>= (-nBits);
    nBits += eLen;
    for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    m = e & ((1 << (-nBits)) - 1);
    e >>= (-nBits);
    nBits += mLen;
    for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    if (e === 0) {
        e = 1 - eBias;
    } else if (e === eMax) {
        return m ? NaN : ((s ? -1 : 1) * Infinity);
    } else {
        m = m + Math.pow(2, mLen);
        e = e - eBias;
    }
    return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
}

/**
 * Writes an IEEE754 float to a byte array.
 * @param {!Array} buffer
 * @param {number} value
 * @param {number} offset
 * @param {boolean} isLE
 * @param {number} mLen
 * @param {number} nBytes
 * @inner
 */
function ieee754_write(buffer, value, offset, isLE, mLen, nBytes) {
    var e, m, c,
        eLen = nBytes * 8 - mLen - 1,
        eMax = (1 << eLen) - 1,
        eBias = eMax >> 1,
        rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
        i = isLE ? 0 : (nBytes - 1),
        d = isLE ? 1 : -1,
        s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

    value = Math.abs(value);

    if (isNaN(value) || value === Infinity) {
        m = isNaN(value) ? 1 : 0;
        e = eMax;
    } else {
        e = Math.floor(Math.log(value) / Math.LN2);
        if (value * (c = Math.pow(2, -e)) < 1) {
            e--;
            c *= 2;
        }
        if (e + eBias >= 1) {
            value += rt / c;
        } else {
            value += rt * Math.pow(2, 1 - eBias);
        }
        if (value * c >= 2) {
            e++;
            c /= 2;
        }

        if (e + eBias >= eMax) {
            m = 0;
            e = eMax;
        } else if (e + eBias >= 1) {
            m = (value * c - 1) * Math.pow(2, mLen);
            e = e + eBias;
        } else {
            m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
            e = 0;
        }
    }

    for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

    e = (e << mLen) | m;
    eLen += mLen;
    for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

    buffer[offset + i - d] |= s * 128;
}

/**
 * Writes a 32bit float.
 * @param {number} value Value to write
 * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
 * @returns {!ByteBuffer} this
 * @expose
 */
ByteBufferPrototype.writeFloat32 = function(value, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    if (!this.noAssert) {
        if (typeof value !== 'number')
            throw TypeError("Illegal value: "+value+" (not a number)");
        if (typeof offset !== 'number' || offset % 1 !== 0)
            throw TypeError("Illegal offset: "+offset+" (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 0 > this.buffer.byteLength)
            throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
    }
    offset += 4;
    var capacity8 = this.buffer.byteLength;
    if (offset > capacity8)
        this.resize((capacity8 *= 2) > offset ? capacity8 : offset);
    offset -= 4;
    ieee754_write(this.view, value, offset, this.littleEndian, 23, 4);
    if (relative) this.offset += 4;
    return this;
};

/**
 * Writes a 32bit float. This is an alias of {@link ByteBuffer#writeFloat32}.
 * @function
 * @param {number} value Value to write
 * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
 * @returns {!ByteBuffer} this
 * @expose
 */
ByteBufferPrototype.writeFloat = ByteBufferPrototype.writeFloat32;

/**
 * Reads a 32bit float.
 * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
 * @returns {number}
 * @expose
 */
ByteBufferPrototype.readFloat32 = function(offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    if (!this.noAssert) {
        if (typeof offset !== 'number' || offset % 1 !== 0)
            throw TypeError("Illegal offset: "+offset+" (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 4 > this.buffer.byteLength)
            throw RangeError("Illegal offset: 0 <= "+offset+" (+"+4+") <= "+this.buffer.byteLength);
    }
    var value = ieee754_read(this.view, offset, this.littleEndian, 23, 4);
    if (relative) this.offset += 4;
    return value;
};

/**
 * Reads a 32bit float. This is an alias of {@link ByteBuffer#readFloat32}.
 * @function
 * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
 * @returns {number}
 * @expose
 */
ByteBufferPrototype.readFloat = ByteBufferPrototype.readFloat32;

// types/floats/float64

/**
 * Writes a 64bit float.
 * @param {number} value Value to write
 * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
 * @returns {!ByteBuffer} this
 * @expose
 */
ByteBufferPrototype.writeFloat64 = function(value, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    if (!this.noAssert) {
        if (typeof value !== 'number')
            throw TypeError("Illegal value: "+value+" (not a number)");
        if (typeof offset !== 'number' || offset % 1 !== 0)
            throw TypeError("Illegal offset: "+offset+" (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 0 > this.buffer.byteLength)
            throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
    }
    offset += 8;
    var capacity9 = this.buffer.byteLength;
    if (offset > capacity9)
        this.resize((capacity9 *= 2) > offset ? capacity9 : offset);
    offset -= 8;
    ieee754_write(this.view, value, offset, this.littleEndian, 52, 8);
    if (relative) this.offset += 8;
    return this;
};

/**
 * Writes a 64bit float. This is an alias of {@link ByteBuffer#writeFloat64}.
 * @function
 * @param {number} value Value to write
 * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
 * @returns {!ByteBuffer} this
 * @expose
 */
ByteBufferPrototype.writeDouble = ByteBufferPrototype.writeFloat64;

/**
 * Reads a 64bit float.
 * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
 * @returns {number}
 * @expose
 */
ByteBufferPrototype.readFloat64 = function(offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    if (!this.noAssert) {
        if (typeof offset !== 'number' || offset % 1 !== 0)
            throw TypeError("Illegal offset: "+offset+" (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 8 > this.buffer.byteLength)
            throw RangeError("Illegal offset: 0 <= "+offset+" (+"+8+") <= "+this.buffer.byteLength);
    }
    var value = ieee754_read(this.view, offset, this.littleEndian, 52, 8);
    if (relative) this.offset += 8;
    return value;
};

/**
 * Reads a 64bit float. This is an alias of {@link ByteBuffer#readFloat64}.
 * @function
 * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
 * @returns {number}
 * @expose
 */
ByteBufferPrototype.readDouble = ByteBufferPrototype.readFloat64;

// types/strings/utf8string

/**
 * Metrics representing number of UTF8 characters. Evaluates to `c`.
 * @type {string}
 * @const
 * @expose
 */
ByteBuffer.METRICS_CHARS = 'c';

/**
 * Metrics representing number of bytes. Evaluates to `b`.
 * @type {string}
 * @const
 * @expose
 */
ByteBuffer.METRICS_BYTES = 'b';

/**
 * Writes an UTF8 encoded string.
 * @param {string} str String to write
 * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} if omitted.
 * @returns {!ByteBuffer|number} this if offset is omitted, else the actual number of bytes written.
 * @expose
 */
ByteBufferPrototype.writeUTF8String = function(str, offset) {
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    if (!this.noAssert) {
        if (typeof offset !== 'number' || offset % 1 !== 0)
            throw TypeError("Illegal offset: "+offset+" (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 0 > this.buffer.byteLength)
            throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
    }
    var k;
    var start = offset;
    k = utfx.calculateUTF16asUTF8(stringSource(str))[1];
    offset += k;
    var capacity14 = this.buffer.byteLength;
    if (offset > capacity14)
        this.resize((capacity14 *= 2) > offset ? capacity14 : offset);
    offset -= k;
    utfx.encodeUTF16toUTF8(stringSource(str), function(b) {
        this.view[offset++] = b;
    }.bind(this));
    if (relative) {
        this.offset = offset;
        return this;
    }
    return offset - start;
};

/**
 * Writes an UTF8 encoded string. This is an alias of {@link ByteBuffer#writeUTF8String}.
 * @function
 * @param {string} str String to write
 * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} if omitted.
 * @returns {!ByteBuffer|number} this if offset is omitted, else the actual number of bytes written.
 * @expose
 */
ByteBufferPrototype.writeString = ByteBufferPrototype.writeUTF8String;

/**
 * Calculates the number of UTF8 characters of a string. JavaScript itself uses UTF-16, so that a string's
 *  `length` property does not reflect its actual UTF8 size if it contains code points larger than 0xFFFF.
 * @param {string} str String to calculate
 * @returns {number} Number of UTF8 characters
 * @expose
 */
ByteBuffer.calculateUTF8Chars = function(str) {
    return utfx.calculateUTF16asUTF8(stringSource(str))[0];
};

/**
 * Calculates the number of UTF8 bytes of a string.
 * @param {string} str String to calculate
 * @returns {number} Number of UTF8 bytes
 * @expose
 */
ByteBuffer.calculateUTF8Bytes = function(str) {
    return utfx.calculateUTF16asUTF8(stringSource(str))[1];
};

/**
 * Calculates the number of UTF8 bytes of a string. This is an alias of {@link ByteBuffer.calculateUTF8Bytes}.
 * @function
 * @param {string} str String to calculate
 * @returns {number} Number of UTF8 bytes
 * @expose
 */
ByteBuffer.calculateString = ByteBuffer.calculateUTF8Bytes;

/**
 * Reads an UTF8 encoded string.
 * @param {number} length Number of characters or bytes to read.
 * @param {string=} metrics Metrics specifying what `length` is meant to count. Defaults to
 *  {@link ByteBuffer.METRICS_CHARS}.
 * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
 *  read if omitted.
 * @returns {string|!{string: string, length: number}} The string read if offset is omitted, else the string
 *  read and the actual number of bytes read.
 * @expose
 */
ByteBufferPrototype.readUTF8String = function(length, metrics, offset) {
    if (typeof metrics === 'number') {
        offset = metrics;
        metrics = undefined;
    }
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    if (typeof metrics === 'undefined') metrics = ByteBuffer.METRICS_CHARS;
    if (!this.noAssert) {
        if (typeof length !== 'number' || length % 1 !== 0)
            throw TypeError("Illegal length: "+length+" (not an integer)");
        length |= 0;
        if (typeof offset !== 'number' || offset % 1 !== 0)
            throw TypeError("Illegal offset: "+offset+" (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 0 > this.buffer.byteLength)
            throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
    }
    var i = 0,
        start = offset,
        sd;
    if (metrics === ByteBuffer.METRICS_CHARS) { // The same for node and the browser
        sd = stringDestination();
        utfx.decodeUTF8(function() {
            return i < length && offset < this.limit ? this.view[offset++] : null;
        }.bind(this), function(cp) {
            ++i; utfx.UTF8toUTF16(cp, sd);
        });
        if (i !== length)
            throw RangeError("Illegal range: Truncated data, "+i+" == "+length);
        if (relative) {
            this.offset = offset;
            return sd();
        } else {
            return {
                "string": sd(),
                "length": offset - start
            };
        }
    } else if (metrics === ByteBuffer.METRICS_BYTES) {
        if (!this.noAssert) {
            if (typeof offset !== 'number' || offset % 1 !== 0)
                throw TypeError("Illegal offset: "+offset+" (not an integer)");
            offset >>>= 0;
            if (offset < 0 || offset + length > this.buffer.byteLength)
                throw RangeError("Illegal offset: 0 <= "+offset+" (+"+length+") <= "+this.buffer.byteLength);
        }
        var k = offset + length;
        utfx.decodeUTF8toUTF16(function() {
            return offset < k ? this.view[offset++] : null;
        }.bind(this), sd = stringDestination(), this.noAssert);
        if (offset !== k)
            throw RangeError("Illegal range: Truncated data, "+offset+" == "+k);
        if (relative) {
            this.offset = offset;
            return sd();
        } else {
            return {
                'string': sd(),
                'length': offset - start
            };
        }
    } else
        throw TypeError("Unsupported metrics: "+metrics);
};

/**
 * Reads an UTF8 encoded string. This is an alias of {@link ByteBuffer#readUTF8String}.
 * @function
 * @param {number} length Number of characters or bytes to read
 * @param {number=} metrics Metrics specifying what `n` is meant to count. Defaults to
 *  {@link ByteBuffer.METRICS_CHARS}.
 * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
 *  read if omitted.
 * @returns {string|!{string: string, length: number}} The string read if offset is omitted, else the string
 *  read and the actual number of bytes read.
 * @expose
 */
ByteBufferPrototype.readString = ByteBufferPrototype.readUTF8String;

/**
 * Appends some data to this ByteBuffer. This will overwrite any contents behind the specified offset up to the appended
 *  data's length.
 * @param {!ByteBuffer|!ArrayBuffer|!Uint8Array|string} source Data to append. If `source` is a ByteBuffer, its offsets
 *  will be modified according to the performed read operation.
 * @param {(string|number)=} encoding Encoding if `data` is a string ("base64", "hex", "binary", defaults to "utf8")
 * @param {number=} offset Offset to append at. Will use and increase {@link ByteBuffer#offset} by the number of bytes
 *  written if omitted.
 * @returns {!ByteBuffer} this
 * @expose
 * @example A relative `<01 02>03.append(<04 05>)` will result in `<01 02 04 05>, 04 05|`
 * @example An absolute `<01 02>03.append(04 05>, 1)` will result in `<01 04>05, 04 05|`
 */
ByteBufferPrototype.append = function(source, encoding, offset) {
    if (typeof encoding === 'number' || typeof encoding !== 'string') {
        offset = encoding;
        encoding = undefined;
    }
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    if (!this.noAssert) {
        if (typeof offset !== 'number' || offset % 1 !== 0)
            throw TypeError("Illegal offset: "+offset+" (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 0 > this.buffer.byteLength)
            throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
    }
    if (!(source instanceof ByteBuffer))
        source = ByteBuffer.wrap(source, encoding);
    var length = source.limit - source.offset;
    if (length <= 0) return this; // Nothing to append
    offset += length;
    var capacity16 = this.buffer.byteLength;
    if (offset > capacity16)
        this.resize((capacity16 *= 2) > offset ? capacity16 : offset);
    offset -= length;
    this.view.set(source.view.subarray(source.offset, source.limit), offset);
    source.offset += length;
    if (relative) this.offset += length;
    return this;
};

/**
 * Appends this ByteBuffer's contents to another ByteBuffer. This will overwrite any contents at and after the
    specified offset up to the length of this ByteBuffer's data.
 * @param {!ByteBuffer} target Target ByteBuffer
 * @param {number=} offset Offset to append to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
 *  read if omitted.
 * @returns {!ByteBuffer} this
 * @expose
 * @see ByteBuffer#append
 */
ByteBufferPrototype.appendTo = function(target, offset) {
    target.append(this, offset);
    return this;
};

/**
 * Enables or disables assertions of argument types and offsets. Assertions are enabled by default but you can opt to
 *  disable them if your code already makes sure that everything is valid.
 * @param {boolean} assert `true` to enable assertions, otherwise `false`
 * @returns {!ByteBuffer} this
 * @expose
 */
ByteBufferPrototype.assert = function(assert) {
    this.noAssert = !assert;
    return this;
};

/**
 * Gets the capacity of this ByteBuffer's backing buffer.
 * @returns {number} Capacity of the backing buffer
 * @expose
 */
ByteBufferPrototype.capacity = function() {
    return this.buffer.byteLength;
};
/**
 * Clears this ByteBuffer's offsets by setting {@link ByteBuffer#offset} to `0` and {@link ByteBuffer#limit} to the
 *  backing buffer's capacity. Discards {@link ByteBuffer#markedOffset}.
 * @returns {!ByteBuffer} this
 * @expose
 */
ByteBufferPrototype.clear = function() {
    this.offset = 0;
    this.limit = this.buffer.byteLength;
    this.markedOffset = -1;
    return this;
};

/**
 * Creates a cloned instance of this ByteBuffer, preset with this ByteBuffer's values for {@link ByteBuffer#offset},
 *  {@link ByteBuffer#markedOffset} and {@link ByteBuffer#limit}.
 * @param {boolean=} copy Whether to copy the backing buffer or to return another view on the same, defaults to `false`
 * @returns {!ByteBuffer} Cloned instance
 * @expose
 */
ByteBufferPrototype.clone = function(copy) {
    var bb = new ByteBuffer(0, this.littleEndian, this.noAssert);
    if (copy) {
        bb.buffer = new ArrayBuffer(this.buffer.byteLength);
        bb.view = new Uint8Array(bb.buffer);
    } else {
        bb.buffer = this.buffer;
        bb.view = this.view;
    }
    bb.offset = this.offset;
    bb.markedOffset = this.markedOffset;
    bb.limit = this.limit;
    return bb;
};

/**
 * Compacts this ByteBuffer to be backed by a {@link ByteBuffer#buffer} of its contents' length. Contents are the bytes
 *  between {@link ByteBuffer#offset} and {@link ByteBuffer#limit}. Will set `offset = 0` and `limit = capacity` and
 *  adapt {@link ByteBuffer#markedOffset} to the same relative position if set.
 * @param {number=} begin Offset to start at, defaults to {@link ByteBuffer#offset}
 * @param {number=} end Offset to end at, defaults to {@link ByteBuffer#limit}
 * @returns {!ByteBuffer} this
 * @expose
 */
ByteBufferPrototype.compact = function(begin, end) {
    if (typeof begin === 'undefined') begin = this.offset;
    if (typeof end === 'undefined') end = this.limit;
    if (!this.noAssert) {
        if (typeof begin !== 'number' || begin % 1 !== 0)
            throw TypeError("Illegal begin: Not an integer");
        begin >>>= 0;
        if (typeof end !== 'number' || end % 1 !== 0)
            throw TypeError("Illegal end: Not an integer");
        end >>>= 0;
        if (begin < 0 || begin > end || end > this.buffer.byteLength)
            throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
    }
    if (begin === 0 && end === this.buffer.byteLength)
        return this; // Already compacted
    var len = end - begin;
    if (len === 0) {
        this.buffer = EMPTY_BUFFER;
        this.view = null;
        if (this.markedOffset >= 0) this.markedOffset -= begin;
        this.offset = 0;
        this.limit = 0;
        return this;
    }
    var buffer = new ArrayBuffer(len);
    var view = new Uint8Array(buffer);
    view.set(this.view.subarray(begin, end));
    this.buffer = buffer;
    this.view = view;
    if (this.markedOffset >= 0) this.markedOffset -= begin;
    this.offset = 0;
    this.limit = len;
    return this;
};

/**
 * Creates a copy of this ByteBuffer's contents. Contents are the bytes between {@link ByteBuffer#offset} and
 *  {@link ByteBuffer#limit}.
 * @param {number=} begin Begin offset, defaults to {@link ByteBuffer#offset}.
 * @param {number=} end End offset, defaults to {@link ByteBuffer#limit}.
 * @returns {!ByteBuffer} Copy
 * @expose
 */
ByteBufferPrototype.copy = function(begin, end) {
    if (typeof begin === 'undefined') begin = this.offset;
    if (typeof end === 'undefined') end = this.limit;
    if (!this.noAssert) {
        if (typeof begin !== 'number' || begin % 1 !== 0)
            throw TypeError("Illegal begin: Not an integer");
        begin >>>= 0;
        if (typeof end !== 'number' || end % 1 !== 0)
            throw TypeError("Illegal end: Not an integer");
        end >>>= 0;
        if (begin < 0 || begin > end || end > this.buffer.byteLength)
            throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
    }
    if (begin === end)
        return new ByteBuffer(0, this.littleEndian, this.noAssert);
    var capacity = end - begin,
        bb = new ByteBuffer(capacity, this.littleEndian, this.noAssert);
    bb.offset = 0;
    bb.limit = capacity;
    if (bb.markedOffset >= 0) bb.markedOffset -= begin;
    this.copyTo(bb, 0, begin, end);
    return bb;
};

/**
 * Copies this ByteBuffer's contents to another ByteBuffer. Contents are the bytes between {@link ByteBuffer#offset} and
 *  {@link ByteBuffer#limit}.
 * @param {!ByteBuffer} target Target ByteBuffer
 * @param {number=} targetOffset Offset to copy to. Will use and increase the target's {@link ByteBuffer#offset}
 *  by the number of bytes copied if omitted.
 * @param {number=} sourceOffset Offset to start copying from. Will use and increase {@link ByteBuffer#offset} by the
 *  number of bytes copied if omitted.
 * @param {number=} sourceLimit Offset to end copying from, defaults to {@link ByteBuffer#limit}
 * @returns {!ByteBuffer} this
 * @expose
 */
ByteBufferPrototype.copyTo = function(target, targetOffset, sourceOffset, sourceLimit) {
    var relative,
        targetRelative;
    if (!this.noAssert) {
        if (!ByteBuffer.isByteBuffer(target))
            throw TypeError("Illegal target: Not a ByteBuffer");
    }
    targetOffset = (targetRelative = typeof targetOffset === 'undefined') ? target.offset : targetOffset | 0;
    sourceOffset = (relative = typeof sourceOffset === 'undefined') ? this.offset : sourceOffset | 0;
    sourceLimit = typeof sourceLimit === 'undefined' ? this.limit : sourceLimit | 0;

    if (targetOffset < 0 || targetOffset > target.buffer.byteLength)
        throw RangeError("Illegal target range: 0 <= "+targetOffset+" <= "+target.buffer.byteLength);
    if (sourceOffset < 0 || sourceLimit > this.buffer.byteLength)
        throw RangeError("Illegal source range: 0 <= "+sourceOffset+" <= "+this.buffer.byteLength);

    var len = sourceLimit - sourceOffset;
    if (len === 0)
        return target; // Nothing to copy

    target.ensureCapacity(targetOffset + len);

    target.view.set(this.view.subarray(sourceOffset, sourceLimit), targetOffset);

    if (relative) this.offset += len;
    if (targetRelative) target.offset += len;

    return this;
};

/**
 * Makes sure that this ByteBuffer is backed by a {@link ByteBuffer#buffer} of at least the specified capacity. If the
 *  current capacity is exceeded, it will be doubled. If double the current capacity is less than the required capacity,
 *  the required capacity will be used instead.
 * @param {number} capacity Required capacity
 * @returns {!ByteBuffer} this
 * @expose
 */
ByteBufferPrototype.ensureCapacity = function(capacity) {
    var current = this.buffer.byteLength;
    if (current < capacity)
        return this.resize((current *= 2) > capacity ? current : capacity);
    return this;
};

/**
 * Overwrites this ByteBuffer's contents with the specified value. Contents are the bytes between
 *  {@link ByteBuffer#offset} and {@link ByteBuffer#limit}.
 * @param {number|string} value Byte value to fill with. If given as a string, the first character is used.
 * @param {number=} begin Begin offset. Will use and increase {@link ByteBuffer#offset} by the number of bytes
 *  written if omitted. defaults to {@link ByteBuffer#offset}.
 * @param {number=} end End offset, defaults to {@link ByteBuffer#limit}.
 * @returns {!ByteBuffer} this
 * @expose
 * @example `someByteBuffer.clear().fill(0)` fills the entire backing buffer with zeroes
 */
ByteBufferPrototype.fill = function(value, begin, end) {
    var relative = typeof begin === 'undefined';
    if (relative) begin = this.offset;
    if (typeof value === 'string' && value.length > 0)
        value = value.charCodeAt(0);
    if (typeof begin === 'undefined') begin = this.offset;
    if (typeof end === 'undefined') end = this.limit;
    if (!this.noAssert) {
        if (typeof value !== 'number' || value % 1 !== 0)
            throw TypeError("Illegal value: "+value+" (not an integer)");
        value |= 0;
        if (typeof begin !== 'number' || begin % 1 !== 0)
            throw TypeError("Illegal begin: Not an integer");
        begin >>>= 0;
        if (typeof end !== 'number' || end % 1 !== 0)
            throw TypeError("Illegal end: Not an integer");
        end >>>= 0;
        if (begin < 0 || begin > end || end > this.buffer.byteLength)
            throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
    }
    if (begin >= end)
        return this; // Nothing to fill
    while (begin < end) this.view[begin++] = value;
    if (relative) this.offset = begin;
    return this;
};

/**
 * Makes this ByteBuffer ready for a new sequence of write or relative read operations. Sets `limit = offset` and
 *  `offset = 0`. Make sure always to flip a ByteBuffer when all relative read or write operations are complete.
 * @returns {!ByteBuffer} this
 * @expose
 */
ByteBufferPrototype.flip = function() {
    this.limit = this.offset;
    this.offset = 0;
    return this;
};
/**
 * Marks an offset on this ByteBuffer to be used later.
 * @param {number=} offset Offset to mark. Defaults to {@link ByteBuffer#offset}.
 * @returns {!ByteBuffer} this
 * @throws {TypeError} If `offset` is not a valid number
 * @throws {RangeError} If `offset` is out of bounds
 * @see ByteBuffer#reset
 * @expose
 */
ByteBufferPrototype.mark = function(offset) {
    offset = typeof offset === 'undefined' ? this.offset : offset;
    if (!this.noAssert) {
        if (typeof offset !== 'number' || offset % 1 !== 0)
            throw TypeError("Illegal offset: "+offset+" (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 0 > this.buffer.byteLength)
            throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
    }
    this.markedOffset = offset;
    return this;
};
/**
 * Sets the byte order.
 * @param {boolean} littleEndian `true` for little endian byte order, `false` for big endian
 * @returns {!ByteBuffer} this
 * @expose
 */
ByteBufferPrototype.order = function(littleEndian) {
    if (!this.noAssert) {
        if (typeof littleEndian !== 'boolean')
            throw TypeError("Illegal littleEndian: Not a boolean");
    }
    this.littleEndian = !!littleEndian;
    return this;
};

/**
 * Switches (to) little endian byte order.
 * @param {boolean=} littleEndian Defaults to `true`, otherwise uses big endian
 * @returns {!ByteBuffer} this
 * @expose
 */
ByteBufferPrototype.LE = function(littleEndian) {
    this.littleEndian = typeof littleEndian !== 'undefined' ? !!littleEndian : true;
    return this;
};

/**
 * Switches (to) big endian byte order.
 * @param {boolean=} bigEndian Defaults to `true`, otherwise uses little endian
 * @returns {!ByteBuffer} this
 * @expose
 */
ByteBufferPrototype.BE = function(bigEndian) {
    this.littleEndian = typeof bigEndian !== 'undefined' ? !bigEndian : false;
    return this;
};
/**
 * Prepends some data to this ByteBuffer. This will overwrite any contents before the specified offset up to the
 *  prepended data's length. If there is not enough space available before the specified `offset`, the backing buffer
 *  will be resized and its contents moved accordingly.
 * @param {!ByteBuffer|string|!ArrayBuffer} source Data to prepend. If `source` is a ByteBuffer, its offset will be
 *  modified according to the performed read operation.
 * @param {(string|number)=} encoding Encoding if `data` is a string ("base64", "hex", "binary", defaults to "utf8")
 * @param {number=} offset Offset to prepend at. Will use and decrease {@link ByteBuffer#offset} by the number of bytes
 *  prepended if omitted.
 * @returns {!ByteBuffer} this
 * @expose
 * @example A relative `00<01 02 03>.prepend(<04 05>)` results in `<04 05 01 02 03>, 04 05|`
 * @example An absolute `00<01 02 03>.prepend(<04 05>, 2)` results in `04<05 02 03>, 04 05|`
 */
ByteBufferPrototype.prepend = function(source, encoding, offset) {
    if (typeof encoding === 'number' || typeof encoding !== 'string') {
        offset = encoding;
        encoding = undefined;
    }
    var relative = typeof offset === 'undefined';
    if (relative) offset = this.offset;
    if (!this.noAssert) {
        if (typeof offset !== 'number' || offset % 1 !== 0)
            throw TypeError("Illegal offset: "+offset+" (not an integer)");
        offset >>>= 0;
        if (offset < 0 || offset + 0 > this.buffer.byteLength)
            throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
    }
    if (!(source instanceof ByteBuffer))
        source = ByteBuffer.wrap(source, encoding);
    var len = source.limit - source.offset;
    if (len <= 0) return this; // Nothing to prepend
    var diff = len - offset;
    if (diff > 0) { // Not enough space before offset, so resize + move
        var buffer = new ArrayBuffer(this.buffer.byteLength + diff);
        var view = new Uint8Array(buffer);
        view.set(this.view.subarray(offset, this.buffer.byteLength), len);
        this.buffer = buffer;
        this.view = view;
        this.offset += diff;
        if (this.markedOffset >= 0) this.markedOffset += diff;
        this.limit += diff;
        offset += diff;
    } else {
        var arrayView = new Uint8Array(this.buffer);
    }
    this.view.set(source.view.subarray(source.offset, source.limit), offset - len);

    source.offset = source.limit;
    if (relative)
        this.offset -= len;
    return this;
};

/**
 * Prepends this ByteBuffer to another ByteBuffer. This will overwrite any contents before the specified offset up to the
 *  prepended data's length. If there is not enough space available before the specified `offset`, the backing buffer
 *  will be resized and its contents moved accordingly.
 * @param {!ByteBuffer} target Target ByteBuffer
 * @param {number=} offset Offset to prepend at. Will use and decrease {@link ByteBuffer#offset} by the number of bytes
 *  prepended if omitted.
 * @returns {!ByteBuffer} this
 * @expose
 * @see ByteBuffer#prepend
 */
ByteBufferPrototype.prependTo = function(target, offset) {
    target.prepend(this, offset);
    return this;
};
/**
 * Gets the number of remaining readable bytes. Contents are the bytes between {@link ByteBuffer#offset} and
 *  {@link ByteBuffer#limit}, so this returns `limit - offset`.
 * @returns {number} Remaining readable bytes. May be negative if `offset > limit`.
 * @expose
 */
ByteBufferPrototype.remaining = function() {
    return this.limit - this.offset;
};
/**
 * Resets this ByteBuffer's {@link ByteBuffer#offset}. If an offset has been marked through {@link ByteBuffer#mark}
 *  before, `offset` will be set to {@link ByteBuffer#markedOffset}, which will then be discarded. If no offset has been
 *  marked, sets `offset = 0`.
 * @returns {!ByteBuffer} this
 * @see ByteBuffer#mark
 * @expose
 */
ByteBufferPrototype.reset = function() {
    if (this.markedOffset >= 0) {
        this.offset = this.markedOffset;
        this.markedOffset = -1;
    } else {
        this.offset = 0;
    }
    return this;
};
/**
 * Resizes this ByteBuffer to be backed by a buffer of at least the given capacity. Will do nothing if already that
 *  large or larger.
 * @param {number} capacity Capacity required
 * @returns {!ByteBuffer} this
 * @throws {TypeError} If `capacity` is not a number
 * @throws {RangeError} If `capacity < 0`
 * @expose
 */
ByteBufferPrototype.resize = function(capacity) {
    if (!this.noAssert) {
        if (typeof capacity !== 'number' || capacity % 1 !== 0)
            throw TypeError("Illegal capacity: "+capacity+" (not an integer)");
        capacity |= 0;
        if (capacity < 0)
            throw RangeError("Illegal capacity: 0 <= "+capacity);
    }
    if (this.buffer.byteLength < capacity) {
        var buffer = new ArrayBuffer(capacity);
        var view = new Uint8Array(buffer);
        view.set(this.view);
        this.buffer = buffer;
        this.view = view;
        this.limit = this.buffer.byteLength
    }
    return this;
};
/**
 * Reverses this ByteBuffer's contents.
 * @param {number=} begin Offset to start at, defaults to {@link ByteBuffer#offset}
 * @param {number=} end Offset to end at, defaults to {@link ByteBuffer#limit}
 * @returns {!ByteBuffer} this
 * @expose
 */
ByteBufferPrototype.reverse = function(begin, end) {
    if (typeof begin === 'undefined') begin = this.offset;
    if (typeof end === 'undefined') end = this.limit;
    if (!this.noAssert) {
        if (typeof begin !== 'number' || begin % 1 !== 0)
            throw TypeError("Illegal begin: Not an integer");
        begin >>>= 0;
        if (typeof end !== 'number' || end % 1 !== 0)
            throw TypeError("Illegal end: Not an integer");
        end >>>= 0;
        if (begin < 0 || begin > end || end > this.buffer.byteLength)
            throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
    }
    if (begin === end)
        return this; // Nothing to reverse
    Array.prototype.reverse.call(this.view.subarray(begin, end));
    return this;
};
/**
 * Skips the next `length` bytes. This will just advance
 * @param {number} length Number of bytes to skip. May also be negative to move the offset back.
 * @returns {!ByteBuffer} this
 * @expose
 */
ByteBufferPrototype.skip = function(length) {
    if (!this.noAssert) {
        if (typeof length !== 'number' || length % 1 !== 0)
            throw TypeError("Illegal length: "+length+" (not an integer)");
        length |= 0;
    }
    var offset = this.offset + length;
    if (!this.noAssert) {
        if (offset < 0 || offset > this.buffer.byteLength)
            throw RangeError("Illegal length: 0 <= "+this.offset+" + "+length+" <= "+this.buffer.byteLength);
    }
    this.offset = offset;
    return this;
};

/**
 * Slices this ByteBuffer by creating a cloned instance with `offset = begin` and `limit = end`.
 * @param {number=} begin Begin offset, defaults to {@link ByteBuffer#offset}.
 * @param {number=} end End offset, defaults to {@link ByteBuffer#limit}.
 * @returns {!ByteBuffer} Clone of this ByteBuffer with slicing applied, backed by the same {@link ByteBuffer#buffer}
 * @expose
 */
ByteBufferPrototype.slice = function(begin, end) {
    if (typeof begin === 'undefined') begin = this.offset;
    if (typeof end === 'undefined') end = this.limit;
    if (!this.noAssert) {
        if (typeof begin !== 'number' || begin % 1 !== 0)
            throw TypeError("Illegal begin: Not an integer");
        begin >>>= 0;
        if (typeof end !== 'number' || end % 1 !== 0)
            throw TypeError("Illegal end: Not an integer");
        end >>>= 0;
        if (begin < 0 || begin > end || end > this.buffer.byteLength)
            throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
    }
    var bb = this.clone();
    bb.offset = begin;
    bb.limit = end;
    return bb;
};
/**
 * Returns a copy of the backing buffer that contains this ByteBuffer's contents. Contents are the bytes between
 *  {@link ByteBuffer#offset} and {@link ByteBuffer#limit}.
 * @param {boolean=} forceCopy If `true` returns a copy, otherwise returns a view referencing the same memory if
 *  possible. Defaults to `false`
 * @returns {!ArrayBuffer} Contents as an ArrayBuffer
 * @expose
 */
ByteBufferPrototype.toBuffer = function(forceCopy) {
    var offset = this.offset,
        limit = this.limit;
    if (!this.noAssert) {
        if (typeof offset !== 'number' || offset % 1 !== 0)
            throw TypeError("Illegal offset: Not an integer");
        offset >>>= 0;
        if (typeof limit !== 'number' || limit % 1 !== 0)
            throw TypeError("Illegal limit: Not an integer");
        limit >>>= 0;
        if (offset < 0 || offset > limit || limit > this.buffer.byteLength)
            throw RangeError("Illegal range: 0 <= "+offset+" <= "+limit+" <= "+this.buffer.byteLength);
    }
    // NOTE: It's not possible to have another ArrayBuffer reference the same memory as the backing buffer. This is
    // possible with Uint8Array#subarray only, but we have to return an ArrayBuffer by contract. So:
    if (!forceCopy && offset === 0 && limit === this.buffer.byteLength)
        return this.buffer;
    if (offset === limit)
        return EMPTY_BUFFER;
    var buffer = new ArrayBuffer(limit - offset);
    new Uint8Array(buffer).set(new Uint8Array(this.buffer).subarray(offset, limit), 0);
    return buffer;
};

/**
 * Returns a raw buffer compacted to contain this ByteBuffer's contents. Contents are the bytes between
 *  {@link ByteBuffer#offset} and {@link ByteBuffer#limit}. This is an alias of {@link ByteBuffer#toBuffer}.
 * @function
 * @param {boolean=} forceCopy If `true` returns a copy, otherwise returns a view referencing the same memory.
 *  Defaults to `false`
 * @returns {!ArrayBuffer} Contents as an ArrayBuffer
 * @expose
 */
ByteBufferPrototype.toArrayBuffer = ByteBufferPrototype.toBuffer;

/**
 * Converts the ByteBuffer's contents to a string.
 * @param {string=} encoding Output encoding. Returns an informative string representation if omitted but also allows
 *  direct conversion to "utf8", "hex", "base64" and "binary" encoding. "debug" returns a hex representation with
 *  highlighted offsets.
 * @param {number=} begin Offset to begin at, defaults to {@link ByteBuffer#offset}
 * @param {number=} end Offset to end at, defaults to {@link ByteBuffer#limit}
 * @returns {string} String representation
 * @throws {Error} If `encoding` is invalid
 * @expose
 */
ByteBufferPrototype.toString = function(encoding, begin, end) {
    if (typeof encoding === 'undefined')
        return "ByteBufferAB(offset="+this.offset+",markedOffset="+this.markedOffset+",limit="+this.limit+",capacity="+this.capacity()+")";
    if (typeof encoding === 'number')
        encoding = "utf8",
        begin = encoding,
        end = begin;
    switch (encoding) {
        case "utf8":
            return this.toUTF8(begin, end);
        case "hex":
            return this.toHex(begin, end);
        case "binary":
            return this.toBinary(begin, end);
        case "columns":
            return this.toColumns();
        default:
            throw Error("Unsupported encoding: "+encoding);
    }
};

// encodings/binary

/**
 * Encodes this ByteBuffer to a binary encoded string, that is using only characters 0x00-0xFF as bytes.
 * @param {number=} begin Offset to begin at. Defaults to {@link ByteBuffer#offset}.
 * @param {number=} end Offset to end at. Defaults to {@link ByteBuffer#limit}.
 * @returns {string} Binary encoded string
 * @throws {RangeError} If `offset > limit`
 * @expose
 */
ByteBufferPrototype.toBinary = function(begin, end) {
    if (typeof begin === 'undefined')
        begin = this.offset;
    if (typeof end === 'undefined')
        end = this.limit;
    begin |= 0; end |= 0;
    if (begin < 0 || end > this.capacity() || begin > end)
        throw RangeError("begin, end");
    if (begin === end)
        return "";
    var chars = [],
        parts = [];
    while (begin < end) {
        chars.push(this.view[begin++]);
        if (chars.length >= 1024)
            parts.push(String.fromCharCode.apply(String, chars)),
            chars = [];
    }
    return parts.join('') + String.fromCharCode.apply(String, chars);
};

/**
 * Decodes a binary encoded string, that is using only characters 0x00-0xFF as bytes, to a ByteBuffer.
 * @param {string} str String to decode
 * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
 *  {@link ByteBuffer.DEFAULT_ENDIAN}.
 * @returns {!ByteBuffer} ByteBuffer
 * @expose
 */
ByteBuffer.fromBinary = function(str, littleEndian) {
    if (typeof str !== 'string')
        throw TypeError("str");
    var i = 0,
        k = str.length,
        charCode,
        bb = new ByteBuffer(k, littleEndian);
    while (i<k) {
        charCode = str.charCodeAt(i);
        if (charCode > 0xff)
            throw RangeError("illegal char code: "+charCode);
        bb.view[i++] = charCode;
    }
    bb.limit = k;
    return bb;
};

// encodings/hex

/**
 * Encodes this ByteBuffer's contents to a hex encoded string.
 * @param {number=} begin Offset to begin at. Defaults to {@link ByteBuffer#offset}.
 * @param {number=} end Offset to end at. Defaults to {@link ByteBuffer#limit}.
 * @returns {string} Hex encoded string
 * @expose
 */
ByteBufferPrototype.toHex = function(begin, end) {
    begin = typeof begin === 'undefined' ? this.offset : begin;
    end = typeof end === 'undefined' ? this.limit : end;
    if (!this.noAssert) {
        if (typeof begin !== 'number' || begin % 1 !== 0)
            throw TypeError("Illegal begin: Not an integer");
        begin >>>= 0;
        if (typeof end !== 'number' || end % 1 !== 0)
            throw TypeError("Illegal end: Not an integer");
        end >>>= 0;
        if (begin < 0 || begin > end || end > this.buffer.byteLength)
            throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
    }
    var out = new Array(end - begin),
        b;
    while (begin < end) {
        b = this.view[begin++];
        if (b < 0x10)
            out.push("0", b.toString(16));
        else out.push(b.toString(16));
    }
    return out.join('');
};

ByteBufferPrototype.add_str = function(str) {
    var idx = this.str_arr.findIndex((element) => element == str)
    if(idx >= 0) {
        return idx
    } else {
        this.str_arr.push(str)
        return this.str_arr.length - 1
    }
};


ByteBufferPrototype.get_str = function(idx) {
    if(idx >= this.str_arr.length) {
        throw new Error("out of index") 
    }
    return this.str_arr[idx]
};

/**
 * Decodes a hex encoded string to a ByteBuffer.
 * @param {string} str String to decode
 * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
 *  {@link ByteBuffer.DEFAULT_ENDIAN}.
 * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
 *  {@link ByteBuffer.DEFAULT_NOASSERT}.
 * @returns {!ByteBuffer} ByteBuffer
 * @expose
 */
ByteBuffer.fromHex = function(str, littleEndian, noAssert) {
    if (!noAssert) {
        if (typeof str !== 'string')
            throw TypeError("Illegal str: Not a string");
        if (str.length % 2 !== 0)
            throw TypeError("Illegal str: Length not a multiple of 2");
    }
    var k = str.length,
        bb = new ByteBuffer((k / 2) | 0, littleEndian),
        b;
    for (var i=0, j=0; i<k; i+=2) {
        b = parseInt(str.substring(i, i+2), 16);
        if (!noAssert)
            if (!isFinite(b) || b < 0 || b > 255)
                throw TypeError("Illegal str: Contains non-hex characters");
        bb.view[j++] = b;
    }
    bb.limit = j;
    return bb;
};



// utfx-embeddable

/**
 * utfx-embeddable (c) 2014 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * see: https://github.com/dcodeIO/utfx for details
 */
var utfx = function() {
    "use strict";

    /**
     * utfx namespace.
     * @inner
     * @type {!Object.<string,*>}
     */
    var utfx = {};

    /**
     * Maximum valid code point.
     * @type {number}
     * @const
     */
    utfx.MAX_CODEPOINT = 0x10FFFF;

    /**
     * Encodes UTF8 code points to UTF8 bytes.
     * @param {(!function():number|null) | number} src Code points source, either as a function returning the next code point
     *  respectively `null` if there are no more code points left or a single numeric code point.
     * @param {!function(number)} dst Bytes destination as a function successively called with the next byte
     */
    utfx.encodeUTF8 = function(src, dst) {
        var cp = null;
        if (typeof src === 'number')
            cp = src,
            src = function() { return null; };
        while (cp !== null || (cp = src()) !== null) {
            if (cp < 0x80)
                dst(cp&0x7F);
            else if (cp < 0x800)
                dst(((cp>>6)&0x1F)|0xC0),
                dst((cp&0x3F)|0x80);
            else if (cp < 0x10000)
                dst(((cp>>12)&0x0F)|0xE0),
                dst(((cp>>6)&0x3F)|0x80),
                dst((cp&0x3F)|0x80);
            else
                dst(((cp>>18)&0x07)|0xF0),
                dst(((cp>>12)&0x3F)|0x80),
                dst(((cp>>6)&0x3F)|0x80),
                dst((cp&0x3F)|0x80);
            cp = null;
        }
    };

    /**
     * Decodes UTF8 bytes to UTF8 code points.
     * @param {!function():number|null} src Bytes source as a function returning the next byte respectively `null` if there
     *  are no more bytes left.
     * @param {!function(number)} dst Code points destination as a function successively called with each decoded code point.
     * @throws {RangeError} If a starting byte is invalid in UTF8
     * @throws {Error} If the last sequence is truncated. Has an array property `bytes` holding the
     *  remaining bytes.
     */
    utfx.decodeUTF8 = function(src, dst) {
        var a, b, c, d, fail = function(b) {
            b = b.slice(0, b.indexOf(null));
            var err = Error(b.toString());
            err.name = "TruncatedError";
            err['bytes'] = b;
            throw err;
        };
        while ((a = src()) !== null) {
            if ((a&0x80) === 0)
                dst(a);
            else if ((a&0xE0) === 0xC0)
                ((b = src()) === null) && fail([a, b]),
                dst(((a&0x1F)<<6) | (b&0x3F));
            else if ((a&0xF0) === 0xE0)
                ((b=src()) === null || (c=src()) === null) && fail([a, b, c]),
                dst(((a&0x0F)<<12) | ((b&0x3F)<<6) | (c&0x3F));
            else if ((a&0xF8) === 0xF0)
                ((b=src()) === null || (c=src()) === null || (d=src()) === null) && fail([a, b, c ,d]),
                dst(((a&0x07)<<18) | ((b&0x3F)<<12) | ((c&0x3F)<<6) | (d&0x3F));
            else throw RangeError("Illegal starting byte: "+a);
        }
    };

    /**
     * Converts UTF16 characters to UTF8 code points.
     * @param {!function():number|null} src Characters source as a function returning the next char code respectively
     *  `null` if there are no more characters left.
     * @param {!function(number)} dst Code points destination as a function successively called with each converted code
     *  point.
     */
    utfx.UTF16toUTF8 = function(src, dst) {
        var c1, c2 = null;
        while (true) {
            if ((c1 = c2 !== null ? c2 : src()) === null)
                break;
            if (c1 >= 0xD800 && c1 <= 0xDFFF) {
                if ((c2 = src()) !== null) {
                    if (c2 >= 0xDC00 && c2 <= 0xDFFF) {
                        dst((c1-0xD800)*0x400+c2-0xDC00+0x10000);
                        c2 = null; continue;
                    }
                }
            }
            dst(c1);
        }
        if (c2 !== null) dst(c2);
    };

    /**
     * Converts UTF8 code points to UTF16 characters.
     * @param {(!function():number|null) | number} src Code points source, either as a function returning the next code point
     *  respectively `null` if there are no more code points left or a single numeric code point.
     * @param {!function(number)} dst Characters destination as a function successively called with each converted char code.
     * @throws {RangeError} If a code point is out of range
     */
    utfx.UTF8toUTF16 = function(src, dst) {
        var cp = null;
        if (typeof src === 'number')
            cp = src, src = function() { return null; };
        while (cp !== null || (cp = src()) !== null) {
            if (cp <= 0xFFFF)
                dst(cp);
            else
                cp -= 0x10000,
                dst((cp>>10)+0xD800),
                dst((cp%0x400)+0xDC00);
            cp = null;
        }
    };

    /**
     * Converts and encodes UTF16 characters to UTF8 bytes.
     * @param {!function():number|null} src Characters source as a function returning the next char code respectively `null`
     *  if there are no more characters left.
     * @param {!function(number)} dst Bytes destination as a function successively called with the next byte.
     */
    utfx.encodeUTF16toUTF8 = function(src, dst) {
        utfx.UTF16toUTF8(src, function(cp) {
            utfx.encodeUTF8(cp, dst);
        });
    };

    /**
     * Decodes and converts UTF8 bytes to UTF16 characters.
     * @param {!function():number|null} src Bytes source as a function returning the next byte respectively `null` if there
     *  are no more bytes left.
     * @param {!function(number)} dst Characters destination as a function successively called with each converted char code.
     * @throws {RangeError} If a starting byte is invalid in UTF8
     * @throws {Error} If the last sequence is truncated. Has an array property `bytes` holding the remaining bytes.
     */
    utfx.decodeUTF8toUTF16 = function(src, dst) {
        utfx.decodeUTF8(src, function(cp) {
            utfx.UTF8toUTF16(cp, dst);
        });
    };

    /**
     * Calculates the byte length of an UTF8 code point.
     * @param {number} cp UTF8 code point
     * @returns {number} Byte length
     */
    utfx.calculateCodePoint = function(cp) {
        return (cp < 0x80) ? 1 : (cp < 0x800) ? 2 : (cp < 0x10000) ? 3 : 4;
    };

    /**
     * Calculates the number of UTF8 bytes required to store UTF8 code points.
     * @param {(!function():number|null)} src Code points source as a function returning the next code point respectively
     *  `null` if there are no more code points left.
     * @returns {number} The number of UTF8 bytes required
     */
    utfx.calculateUTF8 = function(src) {
        var cp, l=0;
        while ((cp = src()) !== null)
            l += (cp < 0x80) ? 1 : (cp < 0x800) ? 2 : (cp < 0x10000) ? 3 : 4;
        return l;
    };

    /**
     * Calculates the number of UTF8 code points respectively UTF8 bytes required to store UTF16 char codes.
     * @param {(!function():number|null)} src Characters source as a function returning the next char code respectively
     *  `null` if there are no more characters left.
     * @returns {!Array.<number>} The number of UTF8 code points at index 0 and the number of UTF8 bytes required at index 1.
     */
    utfx.calculateUTF16asUTF8 = function(src) {
        var n=0, l=0;
        utfx.UTF16toUTF8(src, function(cp) {
            ++n; l += (cp < 0x80) ? 1 : (cp < 0x800) ? 2 : (cp < 0x10000) ? 3 : 4;
        });
        return [n,l];
    };

    return utfx;
}();

// encodings/utf8

/**
 * Encodes this ByteBuffer's contents between {@link ByteBuffer#offset} and {@link ByteBuffer#limit} to an UTF8 encoded
 *  string.
 * @returns {string} Hex encoded string
 * @throws {RangeError} If `offset > limit`
 * @expose
 */
ByteBufferPrototype.toUTF8 = function(begin, end) {
    if (typeof begin === 'undefined') begin = this.offset;
    if (typeof end === 'undefined') end = this.limit;
    if (!this.noAssert) {
        if (typeof begin !== 'number' || begin % 1 !== 0)
            throw TypeError("Illegal begin: Not an integer");
        begin >>>= 0;
        if (typeof end !== 'number' || end % 1 !== 0)
            throw TypeError("Illegal end: Not an integer");
        end >>>= 0;
        if (begin < 0 || begin > end || end > this.buffer.byteLength)
            throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
    }
    var sd; try {
        utfx.decodeUTF8toUTF16(function() {
            return begin < end ? this.view[begin++] : null;
        }.bind(this), sd = stringDestination());
    } catch (e) {
        if (begin !== end)
            throw RangeError("Illegal range: Truncated data, "+begin+" != "+end);
    }
    return sd();
};

/**
 * Decodes an UTF8 encoded string to a ByteBuffer.
 * @param {string} str String to decode
 * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
 *  {@link ByteBuffer.DEFAULT_ENDIAN}.
 * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
 *  {@link ByteBuffer.DEFAULT_NOASSERT}.
 * @returns {!ByteBuffer} ByteBuffer
 * @expose
 */
ByteBuffer.fromUTF8 = function(str, littleEndian, noAssert) {
    if (!noAssert)
        if (typeof str !== 'string')
            throw TypeError("Illegal str: Not a string");
    var bb = new ByteBuffer(utfx.calculateUTF16asUTF8(stringSource(str), true)[1], littleEndian, noAssert),
        i = 0;
    utfx.encodeUTF16toUTF8(stringSource(str), function(b) {
        bb.view[i++] = b;
    });
    bb.limit = i;
    return bb;
};


window.ByteBuffer = ByteBuffer