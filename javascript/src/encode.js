function encode_varint(buffer, value) {
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
        real = real >> 7
        if( real == 0) {
            buffer.writeUint8(data)
            break
        } else {
            buffer.writeUint8(data | 0x80)
        }
    }
}

function encode_type(buffer, value) {
    buffer.writeUint8(value)
}

function encode_bool(buffer, value) {
    if(value) {
        buffer.writeUint8(1)
    } else {
        buffer.writeInt8(0)
    }
}

function encode_number(buffer, value) {
    var number = parseInt(value.number)
    if(!value.pattern || IsNull(number)) {
        throw new Error("unkown encode number")
    }
    switch(value.pattern) {
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
        buffer.writeInt32(parseInt(parseFloat(value.number) * 1000))
        break;
    }
    case TYPE_DOUBLE: {
        buffer.writeInt32(parseInt(parseFloat(value.number) * 1000000))
        break;
    }
    default: {
        throw new Error("unkown encode number")
    }
    }
}

function encode_str_idx(buffer, value) {
    var idx = buffer.add_str(value)
    encode_type(buffer, TYPE_STR_IDX)
    encode_varint(buffer, idx);
}

function encode_str_raw(buffer, value, pattern) {
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

function encode_arr(buffer, value) {
    encode_varint(buffer, value.length)
    for(var v in value) {
        encode_field(buffer, value[v])
    }
}

function encode_map(buffer, value) {
    encode_varint(buffer, value.length)
    for(var k in value) {
        encode_field(buffer, k)
        encode_field(buffer, value[k])
    }
}

function encode_field(buffer, value) {
    var pattern = get_type_by_ref(value)
    encode_type(buffer, pattern);
    switch(pattern) {
    case TYPE_BOOL:
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
        encode_varint(buffer, value)
    }
    break;
    case TYPE_FLOAT: {
        value = parseInt(value * 1000)
        encode_varint(buffer, value)
    }
    break;
    case TYPE_DOUBLE: {
        value = parseInt(value * 1000000)
        encode_varint(buffer, value)
    }
    break;
    case TYPE_STR:{
        encode_str_idx(buffer, value)
    }
    break;
    case TYPE_RAW: {
        encode_str_raw(buffer, value)
    }
    break;
    case TYPE_ARR: {
        encode_arr(buffer, value)
    }
    break;
    case TYPE_MAP: {
        encode_map(buffer, value)
    }
    break;
    default:
        throw new Error("not found type:", type, " value:", value)
    }
    return true
}

function encode_proto(buffer, name, infos) {
    var sub_buffer = new ByteBuffer();
    encode_field(sub_buffer, infos)

    encode_str_raw(buffer, name, TYPE_STR)
    encode_varint(buffer, sub_buffer.str_arr.length)
    for(var val in sub_buffer.str_arr) {
        encode_str_raw(buffer, sub_buffer.str_arr[val], TYPE_STR)
    }

    buffer.append(sub_buffer)
    return true
}
