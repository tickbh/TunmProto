


function decode_varint(buffer) {
    var real = 0
    var shl_num = 0
    while (true) {
        var data = buffer.readUint8()
        print("data = ", data)
        print("shl_num = ", shl_num)
        real += (data & 0x7F) << shl_num
        shl_num += 7
        if((data & 0x80) == 0) {
            break
        }
        var is_left = real % 2 == 1
        if (is_left) {
            return -parseInt(real / 2) - 1
        } else {
            return parseInt(real / 2)
        }
    }
}

function decode_type(buffer) {
    return buffer.readUint8()
}


function decode_number(buffer, pattern) {
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

function decode_str_raw(buffer, pattern) {
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

function read_field(buffer) {
    td_check_unvaild(buffer, 4);
    var index = decode_number(buffer, TYPE_U16)
    var pattern = decode_number(buffer, TYPE_U16)
    return {
        index: index.number,
        pattern: pattern.number,
    }
}

function decode_by_field(buffer, config, field) {
    // var name = get_type_by_name(field.pattern)
    var t = field.pattern
    switch(t) {
    case TYPE_U8:
    case TYPE_I8:
    case TYPE_U16:
    case TYPE_I16:
    case TYPE_U32:
    case TYPE_I32:
    case TYPE_FLOAT: {
        return decode_number(buffer, t)
    }
    case TYPE_STR:
    case TYPE_RAW: {
        return decode_str_raw(buffer, t)
    }
    case TYPE_MAP: {
        return decode_map(buffer, config)
    }
    case TYPE_AU8:
    case TYPE_AI8:
    case TYPE_AU16:
    case TYPE_AI16:
    case TYPE_AU32:
    case TYPE_AI32:
    case TYPE_AFLOAT: 
    case TYPE_ASTR:
    case TYPE_ARAW:
    case TYPE_AMAP: {
        var list = []
        while(true) {
            var sub_value = decode_field(buffer, config)
            if(sub_value.pattern == TYPE_NIL) {
                break;
            }
            list.push(rt_into_value(sub_value))
        }
        return {pattern: t, list: list}
    } 
    default: 
        return new_type_nil();
    }
}

function decode_field(buffer) {
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
            return decode_number(buffer, pattern)
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

function decode_arr(buffer) {
    var size = decode_varint(buffer)
    var arr = []
    for(var idx = 0; idx < size; idx++) {
        var sub = decode_field(buffer)
        arr.append(sub)
    }
    return arr
}

function decode_map(buffer, config) {
    var size = decode_varint(buffer)
    var map = {}
    for(var idx = 0; idx < size; idx++) {
        var key = decode_field(buffer)
        var val = decode_field(buffer)
        map[key] = val
    }
    return map
}

function decode_proto(buffer, config) {
    var name = decode_str_raw(buffer, TYPE_STR)
    var str_len = decode_varint(buffer)
    for(var i = 0; i < str_len; i++) {
        var value = decode_str_raw(buffer, TYPE_STR);
        buffer.add_str(value);
    }
    
    var sub_value = decode_field(buffer);
    return [name, sub_value];
}

