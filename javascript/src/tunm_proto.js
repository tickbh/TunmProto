var RtProto = function() {
    this.is_tunm_proto = true
};

var RtProtoPrototype = RtProto.prototype;

RtProtoPrototype.decode_varint = function(buffer) {
    var real = 0
    var shl_num = 0
    while (true) {
        var data = buffer.readUint8()
        real += (data & 0x7F) << shl_num
        shl_num += 7
        if((data & 0x80) == 0) {
            break
        }
    }
    var is_left = real % 2 == 1
    if (is_left) {
        return -parseInt(real / 2) - 1
    } else {
        return parseInt(real / 2)
    }
}

RtProtoPrototype.decode_type = function (buffer) {
    return buffer.readUint8()
}


RtProtoPrototype.decode_number = function (buffer, pattern) {
    switch(pattern) {
    case this.TYPE_U8: {
        this.td_check_unvaild(buffer, 1);
        return buffer.readUint8()
    }
    case this.TYPE_I8: {
        this.td_check_unvaild(buffer, 1);
        return buffer.readInt8()
    }
    case this.TYPE_U16: {
        this.td_check_unvaild(buffer, 2);
        return buffer.readUint16()
    }
    case this.TYPE_I16: {
        this.td_check_unvaild(buffer, 2);
        return buffer.readInt16()
    }
    case this.TYPE_U32: {
        this.td_check_unvaild(buffer, 4);
        return buffer.readUint32()
    }
    case this.TYPE_I32: {
        this.td_check_unvaild(buffer, 4);
        return buffer.readInt32()
    }
    case this.TYPE_FLOAT: {
        this.td_check_unvaild(buffer, 4);
        return buffer.readInt32() / 1000.0
    }
    default:
        throw new Error("Unknow decode number type", pattern)
    }
}

RtProtoPrototype.decode_str_raw = function (buffer, pattern) {
    switch(pattern) {
    case this.TYPE_STR: {
        // if(this.td_check_unvaild(buffer, 2)) throw new Error("not vaild size");
        var length = this.decode_varint(buffer, this.TYPE_U16)
        if(length == 0) {
            return ""
        }
        if(this.td_check_unvaild(buffer, length)) throw new Error("not vaild size");
        return buffer.readUTF8String(length, "b")
    }
    case this.TYPE_RAW: {
        var length = this.decode_varint(buffer, this.TYPE_U16)
        if(length == 0) {
            return ""
        }
        if(this.td_check_unvaild(buffer, length)) throw new Error("not vaild size");
        return buffer.readUTF8String(length)
    }
    default:
        throw new Error("Unknow decode str type")
    }
}

RtProtoPrototype.read_field = function (buffer) {
    this.td_check_unvaild(buffer, 4);
    var index = this.decode_number(buffer, this.TYPE_U16)
    var pattern = this.decode_number(buffer, this.TYPE_U16)
    return {
        index: index.number,
        pattern: pattern.number,
    }
}

RtProtoPrototype.decode_field = function (buffer) {
    var pattern = this.decode_type(buffer)
    if(pattern == this.TYPE_NIL) {
        return undefined;
    }
    switch(pattern) {
        case this.TYPE_BOOL:
            if (buffer.readInt8() != 0) {
                return true
            } else {
                return false
            }
        case this.TYPE_U8:
        case this.TYPE_I8:
        case this.TYPE_U16:
        case this.TYPE_I16:
        case this.TYPE_U32:
        case this.TYPE_I32:
        case this.TYPE_U64:
        case this.TYPE_I64:
            return this.decode_varint(buffer, pattern)
        case this.TYPE_FLOAT: {
            var val = this.decode_varint(buffer)
            return val / 1000
        }
        case this.TYPE_DOUBLE: {
            var val = this.decode_varint(buffer)
            return val / 1000000
        }
        case this.TYPE_VARINT:
            return this.decode_varint(buffer)
        case this.TYPE_STR_IDX:
            var idx = this.decode_varint(buffer)
            return buffer.get_str(idx)
        case this.TYPE_STR:
            return this.decode_str_raw(buffer, this.TYPE_STR)
        case this.TYPE_ARR:
            return this.decode_arr(buffer)
        case this.TYPE_MAP:
            return this.decode_map(buffer)
        default:
            throw new Error("unknow type")
    }
}

RtProtoPrototype.decode_arr = function (buffer) {
    var size = this.decode_varint(buffer)
    var arr = []
    for(var idx = 0; idx < size; idx++) {
        var sub = this.decode_field(buffer)
        arr.push(sub)
    }
    return arr
}

RtProtoPrototype.decode_map = function (buffer, config) {
    var size = this.decode_varint(buffer)
    var map = {}
    for(var idx = 0; idx < size; idx++) {
        var key = this.decode_field(buffer)
        var val = this.decode_field(buffer)
        map[key] = val
    }
    return map
}

RtProtoPrototype.decode_proto = function (buffer, config) {
    var name = this.decode_str_raw(buffer, this.TYPE_STR)
    var str_len = this.decode_varint(buffer)
    for(var i = 0; i < str_len; i++) {
        var value = this.decode_str_raw(buffer, this.TYPE_STR);
        buffer.add_str(value);
    }
    
    var sub_value = this.decode_field(buffer);
    return {proto: name, list: sub_value};
}



RtProtoPrototype.td_check_vaild = function (buffer, size) {
    return buffer.remaining() >= size
}

RtProtoPrototype.td_check_unvaild = function (buffer, size) {
    if(!this.td_check_vaild(buffer, size)) {
        throw new Error("now vaild buffer size")
    }
    return false
}

RtProtoPrototype.IsNull = function(value) {
    return value == null || value == undefined
}

RtProtoPrototype.get_type_by_ref = function (value) {
    var type = typeof(value)
    if (type == "boolean") {
        return this.TYPE_BOOL
    } else if(type == 'string') {
        return this.TYPE_STR
    } else if(type == "number") {
        var step = value - Math.floor(value)
        if(step < 0.001) {
            return this.TYPE_I64
        } else {
            return this.TYPE_FLOAT
        }
    } else if(type == "object") {
        if(value instanceof String) {
            return this.TYPE_STR
        } else if(value instanceof Array) {
            return this.TYPE_ARR
        } else {
            return this.TYPE_MAP
        }
    }
    return this.TYPE_NIL
}


RtProtoPrototype.encode_varint = function (buffer, value) {
    var number = parseInt(value) 
    if(this.IsNull(number)) {
        throw new Error("unkown encode number")
    }
    var real = number * 2
    if(real < 0) {
        real = -(number + 1) * 2 + 1
    }

    while(true) {
        var data = (real & 0x7F)
        real = real >>> 7
        if( real == 0) {
            buffer.writeUint8(data)
            break
        } else {
            buffer.writeUint8(data | 0x80)
        }
    }
}

RtProtoPrototype.encode_type = function (buffer, value) {
    buffer.writeUint8(value)
}

RtProtoPrototype.encode_bool = function (buffer, value) {
    if(value) {
        buffer.writeUint8(1)
    } else {
        buffer.writeInt8(0)
    }
}

RtProtoPrototype.encode_number = function (buffer, value, pattern) {
    var number = parseInt(value)
    if(IsNull(number)) {
        throw new Error("unkown encode number")
    }
    switch(pattern) {
    case this.TYPE_U8: {
        buffer.writeUint8(number)
        break;
    }
    case this.TYPE_I8: {
        buffer.writeInt8(number)
        break;
    }
    case this.TYPE_U16: {
        buffer.writeUint16(number)
        break;
    }
    case this.TYPE_I16: {
        buffer.writeInt16(number)
        break;
    }
    case this.TYPE_U32: {
        buffer.writeUint32(number)
        break;
    }
    case this.TYPE_I32: {
        buffer.writeInt32(number)
        break;
    }
    case this.TYPE_U64: {
        throw new Error("no support u64")
    }
    case this.TYPE_I64: {
        throw new Error("no support u64")
    }
    case this.TYPE_FLOAT: {
        buffer.writeInt32(parseInt(parseFloat(number) * 1000))
        break;
    }
    case this.TYPE_DOUBLE: {
        buffer.writeInt32(parseInt(parseFloat(number) * 1000000))
        break;
    }
    default: {
        throw new Error("unkown encode number")
    }
    }
}

RtProtoPrototype.encode_str_idx = function (buffer, value) {
    var idx = buffer.add_str(value)
    this.encode_type(buffer, this.TYPE_STR_IDX)
    this.encode_varint(buffer, idx);
}


RtProtoPrototype.encode_str_raw = function (buffer, value, pattern) {
    switch(pattern) {
        case this.TYPE_STR: {
            this.encode_varint(buffer, value.length)
            buffer.writeString(value)
            break;
        }
        case this.TYPE_RAW: {
            this.encode_varint(buffer, value.length)
            buffer.writeString(value)
            break;
        }
        default: {
            throw new Error("unkown str")
        }
    }
}

RtProtoPrototype.encode_arr = function (buffer, value) {
    this.encode_varint(buffer, value.length)
    for(var v in value) {
        this.encode_field(buffer, value[v])
    }
}

RtProtoPrototype.encode_map = function (buffer, value) {
    this.encode_varint(buffer, Object.keys(value).length)
    for(var k in value) {
        this.encode_field(buffer, k)
        this.encode_field(buffer, value[k])
    }
}

RtProtoPrototype.encode_field = function (buffer, value) {
    var pattern = this.get_type_by_ref(value)
    switch(pattern) {
    case this.TYPE_BOOL:
        this.encode_type(buffer, pattern);
        this.encode_bool(buffer, value)
        break
    case this.TYPE_U8:
    case this.TYPE_I8:
    case this.TYPE_U16:
    case this.TYPE_I16:
    case this.TYPE_U32:
    case this.TYPE_I32:
    case this.TYPE_I64:
    case this.TYPE_U64:
    case this.TYPE_VARINT: {
        this.encode_type(buffer, this.TYPE_VARINT);
        this.encode_varint(buffer, value)
    }
    break;
    case this.TYPE_FLOAT: {
        this.encode_type(buffer, pattern);
        value = parseInt(value * 1000)
        this.encode_varint(buffer, value)
    }
    break;
    case this.TYPE_DOUBLE: {
        this.encode_type(buffer, pattern);
        value = parseInt(value * 1000000)
        this.encode_varint(buffer, value)
    }
    break;
    case this.TYPE_STR:{
        this.encode_str_idx(buffer, value)
    }
    break;
    case this.TYPE_RAW: {
        this.encode_type(buffer, pattern);
        this.encode_str_raw(buffer, value)
    }
    break;
    case this.TYPE_ARR: {
        this.encode_type(buffer, pattern);
        this.encode_arr(buffer, value)
    }
    break;
    case this.TYPE_MAP: {
        this.encode_type(buffer, pattern);
        this.encode_map(buffer, value)
    }
    break;
    default:
        throw new Error("not found type:", type, " value:", value)
    }
    return true
}

RtProtoPrototype.encode_proto = function (buffer, name, infos) {
    var sub_buffer = new ByteBuffer();
    this.encode_field(sub_buffer, infos)

    this.encode_str_raw(buffer, name, this.TYPE_STR)
    this.encode_varint(buffer, sub_buffer.str_arr.length)
    for(var val in sub_buffer.str_arr) {
        this.encode_str_raw(buffer, sub_buffer.str_arr[val], this.TYPE_STR)
    }

    sub_buffer.mark(0)
    sub_buffer.reset()
    buffer.append(sub_buffer)
    return true
}

RtProtoPrototype.TYPE_NIL = 0;
RtProtoPrototype.TYPE_BOOL = 1;
RtProtoPrototype.TYPE_U8 = 2;
RtProtoPrototype.TYPE_I8 = 3;
RtProtoPrototype.TYPE_U16 = 4;
RtProtoPrototype.TYPE_I16 = 5;
RtProtoPrototype.TYPE_U32 = 6;
RtProtoPrototype.TYPE_I32 = 7;
RtProtoPrototype.TYPE_U64 = 8;
RtProtoPrototype.TYPE_I64 = 9;
RtProtoPrototype.TYPE_VARINT = 10;
RtProtoPrototype.TYPE_FLOAT = 11;
RtProtoPrototype.TYPE_DOUBLE = 12;
RtProtoPrototype.TYPE_STR = 13;
RtProtoPrototype.TYPE_STR_IDX = 14;
RtProtoPrototype.TYPE_RAW = 15;
RtProtoPrototype.TYPE_ARR = 16;
RtProtoPrototype.TYPE_MAP = 17;

RtProtoPrototype.STR_TYPE_NIL = "nil";
RtProtoPrototype.STR_TYPE_BOOL = "bool";
RtProtoPrototype.STR_TYPE_U8 = "u8";
RtProtoPrototype.STR_TYPE_I8 = "i8";
RtProtoPrototype.STR_TYPE_U16 = "u16";
RtProtoPrototype.STR_TYPE_I16 = "i16";
RtProtoPrototype.STR_TYPE_U32 = "u32";
RtProtoPrototype.STR_TYPE_I32 = "i32";
RtProtoPrototype.STR_TYPE_U64 = "u64";
RtProtoPrototype.STR_TYPE_I64 = "i64";
RtProtoPrototype.STR_TYPE_VARINT = "varint";
RtProtoPrototype.STR_TYPE_FLOAT = "float";
RtProtoPrototype.STR_TYPE_DOUBLE = "double";
RtProtoPrototype.STR_TYPE_STR = "str";
RtProtoPrototype.STR_TYPE_STR_IDX = "str_idx";
RtProtoPrototype.STR_TYPE_RAW = "raw";
RtProtoPrototype.STR_TYPE_ARR = "arr";
RtProtoPrototype.STR_TYPE_MAP = "map";

RtProtoPrototype.get_type_by_name = function (name) {
    switch(name) {
        case STR_TYPE_NIL: return this.TYPE_NIL;
        case STR_TYPE_BOOL: return this.TYPE_BOOL;
        case STR_TYPE_U8: return this.TYPE_U8;
        case STR_TYPE_I8: return this.TYPE_I8;
        case STR_TYPE_U16: return this.TYPE_U16;
        case STR_TYPE_I16: return this.TYPE_I16;
        case STR_TYPE_U32: return this.TYPE_U32;
        case STR_TYPE_I32: return this.TYPE_I32;
        case STR_TYPE_U64: return this.TYPE_U64;
        case STR_TYPE_I64: return this.TYPE_I64;
        case STR_TYPE_VARINT: return this.TYPE_VARINT;
        case STR_TYPE_FLOAT: return this.TYPE_FLOAT;
        case STR_TYPE_DOUBLE: return this.TYPE_DOUBLE;
        case STR_TYPE_STR: return this.TYPE_STR;
        case STR_TYPE_STR_IDX: return this.TYPE_STR_IDX;
        case STR_TYPE_RAW: return this.TYPE_RAW;
        case STR_TYPE_ARR: return this.TYPE_ARR;
        case STR_TYPE_MAP: return this.TYPE_MAP;
        default: return this.TYPE_NIL;
    }
}

RtProtoPrototype.get_name_by_type = function (index) {
    switch(index) {
        case this.TYPE_NIL: return STR_TYPE_NIL;
        case this.TYPE_BOOL: return STR_TYPE_BOOL;
        case this.TYPE_U8: return STR_TYPE_U8;
        case this.TYPE_I8: return STR_TYPE_I8;
        case this.TYPE_U16: return STR_TYPE_U16;
        case this.TYPE_I16: return STR_TYPE_I16;
        case this.TYPE_U32: return STR_TYPE_U32;
        case this.TYPE_I32: return STR_TYPE_I32;
        case this.TYPE_U64: return STR_TYPE_U64;
        case this.TYPE_I64: return STR_TYPE_I64;
        case this.TYPE_VARINT: return STR_TYPE_VARINT;
        case this.TYPE_FLOAT: return STR_TYPE_FLOAT;
        case this.TYPE_DOUBLE: return STR_TYPE_DOUBLE;
        case this.TYPE_STR: return STR_TYPE_STR;
        case this.TYPE_STR_IDX: return STR_TYPE_STR_IDX;
        case this.TYPE_RAW: return STR_TYPE_RAW;
        case this.TYPE_ARR: return STR_TYPE_ARR;
        case this.TYPE_MAP: return STR_TYPE_MAP;
        default: return STR_TYPE_NIL;
    }
}

window.RtProto = RtProto