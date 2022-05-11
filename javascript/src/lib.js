var RtProto = function() {
    this.is_rt_proto = true
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
    case TYPE_U8: {
        td_check_unvaild(buffer, 1);
        return buffer.readUint8()
    }
    case TYPE_I8: {
        td_check_unvaild(buffer, 1);
        return buffer.readInt8()
    }
    case TYPE_U16: {
        td_check_unvaild(buffer, 2);
        return buffer.readUint16()
    }
    case TYPE_I16: {
        td_check_unvaild(buffer, 2);
        return buffer.readInt16()
    }
    case TYPE_U32: {
        td_check_unvaild(buffer, 4);
        return buffer.readUint32()
    }
    case TYPE_I32: {
        td_check_unvaild(buffer, 4);
        return buffer.readInt32()
    }
    case TYPE_FLOAT: {
        td_check_unvaild(buffer, 4);
        return buffer.readInt32() / 1000.0
    }
    default:
        throw new Error("Unknow decode number type", pattern)
    }
}

RtProtoPrototype.decode_str_raw = function (buffer, pattern) {
    switch(pattern) {
    case TYPE_STR: {
        // if(td_check_unvaild(buffer, 2)) throw new Error("not vaild size");
        var length = decode_varint(buffer, TYPE_U16)
        if(length == 0) {
            return ""
        }
        if(td_check_unvaild(buffer, length)) throw new Error("not vaild size");
        return buffer.readUTF8String(length)
    }
    case TYPE_RAW: {
        var length = decode_varint(buffer, TYPE_U16)
        if(length == 0) {
            return ""
        }
        if(td_check_unvaild(buffer, length)) throw new Error("not vaild size");
        return buffer.readUTF8String(length)
    }
    default:
        throw new Error("Unknow decode str type")
    }
}

RtProtoPrototype.read_field = function (buffer) {
    td_check_unvaild(buffer, 4);
    var index = decode_number(buffer, TYPE_U16)
    var pattern = decode_number(buffer, TYPE_U16)
    return {
        index: index.number,
        pattern: pattern.number,
    }
}

RtProtoPrototype.decode_field = function (buffer) {
    var pattern = decode_type(buffer)
    if(pattern == TYPE_NIL) {
        return undefined;
    }
    switch(pattern) {
        case TYPE_BOOL:
            if (buffer.readInt8() != 0) {
                return true
            } else {
                return false
            }
        case TYPE_U8:
        case TYPE_I8:
        case TYPE_U16:
        case TYPE_I16:
        case TYPE_U32:
        case TYPE_I32:
        case TYPE_U64:
        case TYPE_I64:
            return decode_varint(buffer, pattern)
        case TYPE_FLOAT: {
            var val = decode_varint(buffer)
            return val / 1000
        }
        case TYPE_DOUBLE: {
            var val = decode_varint(buffer)
            return val / 1000000
        }
        case TYPE_VARINT:
            return decode_varint(buffer)
        case TYPE_STR_IDX:
            var idx = decode_varint(buffer)
            return buffer.get_str(idx)
        case TYPE_STR:
            return decode_str_raw(buffer, TYPE_STR)
        case TYPE_ARR:
            return decode_arr(buffer)
        case TYPE_MAP:
            return decode_map(buffer)
        default:
            throw new Error("unknow type")
    }
}

RtProtoPrototype.decode_arr = function (buffer) {
    var size = decode_varint(buffer)
    var arr = []
    for(var idx = 0; idx < size; idx++) {
        var sub = decode_field(buffer)
        arr.push(sub)
    }
    return arr
}

RtProtoPrototype.decode_map = function (buffer, config) {
    var size = decode_varint(buffer)
    var map = {}
    for(var idx = 0; idx < size; idx++) {
        var key = decode_field(buffer)
        var val = decode_field(buffer)
        map[key] = val
    }
    return map
}

RtProtoPrototype.decode_proto = function (buffer, config) {
    var name = decode_str_raw(buffer, TYPE_STR)
    var str_len = decode_varint(buffer)
    for(var i = 0; i < str_len; i++) {
        var value = decode_str_raw(buffer, TYPE_STR);
        buffer.add_str(value);
    }
    
    var sub_value = decode_field(buffer);
    return {proto: name, list: sub_value};
}



RtProtoPrototype.td_check_vaild = function (buffer, size) {
    return buffer.remaining() >= size
}

RtProtoPrototype.td_check_unvaild = function (buffer, size) {
    if(!td_check_vaild(buffer, size)) {
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
        return TYPE_BOOL
    } else if(type == 'string') {
        return TYPE_STR
    } else if(type == "number") {
        var step = value - Math.floor(value)
        if(step < 0.001) {
            return TYPE_I64
        } else {
            return TYPE_FLOAT
        }
    } else if(type == "object") {
        if(value instanceof String) {
            return TYPE_STR
        } else if(value instanceof Array) {
            return TYPE_ARR
        } else {
            return TYPE_MAP
        }
    }
    return TYPE_NIL
}


RtProtoPrototype.encode_varint = function (buffer, value) {
    var number = parseInt(value) 
    if(IsNull(number)) {
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
    case TYPE_U8: {
        buffer.writeUint8(number)
        break;
    }
    case TYPE_I8: {
        buffer.writeInt8(number)
        break;
    }
    case TYPE_U16: {
        buffer.writeUint16(number)
        break;
    }
    case TYPE_I16: {
        buffer.writeInt16(number)
        break;
    }
    case TYPE_U32: {
        buffer.writeUint32(number)
        break;
    }
    case TYPE_I32: {
        buffer.writeInt32(number)
        break;
    }
    case TYPE_U64: {
        throw new Error("no support u64")
    }
    case TYPE_I64: {
        throw new Error("no support u64")
    }
    case TYPE_FLOAT: {
        buffer.writeInt32(parseInt(parseFloat(number) * 1000))
        break;
    }
    case TYPE_DOUBLE: {
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
    encode_type(buffer, TYPE_STR_IDX)
    encode_varint(buffer, idx);
}


RtProtoPrototype.encode_str_raw = function (buffer, value, pattern) {
    switch(pattern) {
        case TYPE_STR: {
            encode_varint(buffer, value.length)
            buffer.writeString(value)
            break;
        }
        case TYPE_RAW: {
            encode_varint(buffer, value.length)
            buffer.writeString(value)
            break;
        }
        default: {
            throw new Error("unkown str")
        }
    }
}

RtProtoPrototype.encode_arr = function (buffer, value) {
    encode_varint(buffer, value.length)
    for(var v in value) {
        encode_field(buffer, value[v])
    }
}

RtProtoPrototype.encode_map = function (buffer, value) {
    encode_varint(buffer, Object.keys(value).length)
    for(var k in value) {
        encode_field(buffer, k)
        encode_field(buffer, value[k])
    }
}

RtProtoPrototype.encode_field = function (buffer, value) {
    var pattern = get_type_by_ref(value)
    switch(pattern) {
    case TYPE_BOOL:
        encode_type(buffer, pattern);
        encode_bool(buffer, value)
        break
    case TYPE_U8:
    case TYPE_I8:
    case TYPE_U16:
    case TYPE_I16:
    case TYPE_U32:
    case TYPE_I32:
    case TYPE_I64:
    case TYPE_U64:
    case TYPE_VARINT: {
        encode_type(buffer, TYPE_VARINT);
        encode_varint(buffer, value)
    }
    break;
    case TYPE_FLOAT: {
        encode_type(buffer, pattern);
        value = parseInt(value * 1000)
        encode_varint(buffer, value)
    }
    break;
    case TYPE_DOUBLE: {
        encode_type(buffer, pattern);
        value = parseInt(value * 1000000)
        encode_varint(buffer, value)
    }
    break;
    case TYPE_STR:{
        encode_str_idx(buffer, value)
    }
    break;
    case TYPE_RAW: {
        encode_type(buffer, pattern);
        encode_str_raw(buffer, value)
    }
    break;
    case TYPE_ARR: {
        encode_type(buffer, pattern);
        encode_arr(buffer, value)
    }
    break;
    case TYPE_MAP: {
        encode_type(buffer, pattern);
        encode_map(buffer, value)
    }
    break;
    default:
        throw new Error("not found type:", type, " value:", value)
    }
    return true
}

RtProtoPrototype.encode_proto = function (buffer, name, infos) {
    var sub_buffer = new ByteBuffer();
    encode_field(sub_buffer, infos)

    encode_str_raw(buffer, name, TYPE_STR)
    encode_varint(buffer, sub_buffer.str_arr.length)
    for(var val in sub_buffer.str_arr) {
        encode_str_raw(buffer, sub_buffer.str_arr[val], TYPE_STR)
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
        case STR_TYPE_NIL: return TYPE_NIL;
        case STR_TYPE_BOOL: return TYPE_BOOL;
        case STR_TYPE_U8: return TYPE_U8;
        case STR_TYPE_I8: return TYPE_I8;
        case STR_TYPE_U16: return TYPE_U16;
        case STR_TYPE_I16: return TYPE_I16;
        case STR_TYPE_U32: return TYPE_U32;
        case STR_TYPE_I32: return TYPE_I32;
        case STR_TYPE_U64: return TYPE_U64;
        case STR_TYPE_I64: return TYPE_I64;
        case STR_TYPE_VARINT: return TYPE_VARINT;
        case STR_TYPE_FLOAT: return TYPE_FLOAT;
        case STR_TYPE_DOUBLE: return TYPE_DOUBLE;
        case STR_TYPE_STR: return TYPE_STR;
        case STR_TYPE_STR_IDX: return TYPE_STR_IDX;
        case STR_TYPE_RAW: return TYPE_RAW;
        case STR_TYPE_ARR: return TYPE_ARR;
        case STR_TYPE_MAP: return TYPE_MAP;
        default: return TYPE_NIL;
    }
}

RtProtoPrototype.get_name_by_type = function (index) {
    switch(index) {
        case TYPE_NIL: return STR_TYPE_NIL;
        case TYPE_BOOL: return STR_TYPE_BOOL;
        case TYPE_U8: return STR_TYPE_U8;
        case TYPE_I8: return STR_TYPE_I8;
        case TYPE_U16: return STR_TYPE_U16;
        case TYPE_I16: return STR_TYPE_I16;
        case TYPE_U32: return STR_TYPE_U32;
        case TYPE_I32: return STR_TYPE_I32;
        case TYPE_U64: return STR_TYPE_U64;
        case TYPE_I64: return STR_TYPE_I64;
        case TYPE_VARINT: return STR_TYPE_VARINT;
        case TYPE_FLOAT: return STR_TYPE_FLOAT;
        case TYPE_DOUBLE: return STR_TYPE_DOUBLE;
        case TYPE_STR: return STR_TYPE_STR;
        case TYPE_STR_IDX: return STR_TYPE_STR_IDX;
        case TYPE_RAW: return STR_TYPE_RAW;
        case TYPE_ARR: return STR_TYPE_ARR;
        case TYPE_MAP: return STR_TYPE_MAP;
        default: return STR_TYPE_NIL;
    }
}

window.RtProto = RtProto