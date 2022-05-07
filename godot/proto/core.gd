
enum RT_DATA_TYPE {
    TYPE_NIL = 0,
    TYPE_BOOL = 1,
    TYPE_U8 = 2,
    TYPE_I8 = 3,
    TYPE_U16 = 4,
    TYPE_I16 = 5,
    TYPE_U32 = 6,
    TYPE_I32 = 7,
    TYPE_U64 = 8,
    TYPE_I64 = 9,
    TYPE_FLOAT = 10,
    TYPE_DOUBLE = 11,
    TYPE_STR = 12,
    TYPE_STR_IDX = 13,
    TYPE_RAW = 14,
    TYPE_ARR = 15,
    TYPE_MAP = 16,
}


class PBPacker:
    static func convert_signed(n : int) -> int:
        if n < -2147483648:
            return (n << 1) ^ (n >> 63)
        else:
            return (n << 1) ^ (n >> 31)
            
    static func deconvert_signed(n : int) -> int:
        if n & 0x01:
            return ~(n >> 1)
        else:
            return (n >> 1)

            
    static func pack_varint(value) -> PoolByteArray:
        var varint : PoolByteArray = PoolByteArray()
        if typeof(value) == TYPE_BOOL:
            if value:
                value = 1
            else:
                value = 0
        for _i in range(9):
            var b = value & 0x7F
            value >>= 7
            if value:
                varint.append(b | 0x80)
            else:
                varint.append(b)
                break
        if varint.size() == 9 && varint[8] == 0xFF:
            varint.append(0x01)
        return varint

    static func pack_bytes(value, count : int, data_type : int) -> PoolByteArray:
        var bytes : PoolByteArray = PoolByteArray()
        if data_type == RT_DATA_TYPE.FLOAT:
            var val: int = value * 1000
            for _i in range(count):
                bytes.append(val & 0xFF)
                val >>= 8
        elif data_type == RT_DATA_TYPE.DOUBLE:
            var val: int = value * 1000000
            for _i in range(count):
                bytes.append(val & 0xFF)
                val >>= 8
        else:
            for _i in range(count):
                bytes.append(value & 0xFF)
                value >>= 8
        return bytes

    static func unpack_bytes(bytes : PoolByteArray, index : int, count : int, data_type : int):
        var value = 0
        for i in range(index + count - 1, index - 1, -1):
            value |= (bytes[i] & 0xFF)
            if i != index:
                value <<= 8

        if data_type == RT_DATA_TYPE.FLOAT:
            value = value / 1000
        elif data_type == RT_DATA_TYPE.DOUBLE:
            value = value / 1000000
        return value

    static func unpack_varint(varint_bytes) -> int:
        var value : int = 0
        for i in range(varint_bytes.size() - 1, -1, -1):
            value |= varint_bytes[i] & 0x7F
            if i != 0:
                value <<= 7
        return value