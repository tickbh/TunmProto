import enum
from enum import IntEnum
from math import floor

from tunm_proto import ByteBuffer
 
@enum.unique
class TP_DATA_TYPE(IntEnum):
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
    TYPE_VARINT = 10,
    TYPE_FLOAT = 11,
    TYPE_DOUBLE = 12,
    TYPE_STR = 13,
    TYPE_STR_IDX = 14,
    TYPE_RAW = 15,
    TYPE_ARR = 16,
    TYPE_MAP = 17,
    
class TPPacker:
    @staticmethod
    def get_type_by_ref(ref_type):
        t = type(ref_type)
        if t == str:
            return TP_DATA_TYPE.TYPE_STR
        elif t == bytes:
            return TP_DATA_TYPE.TYPE_RAW
        elif t == dict:
            return TP_DATA_TYPE.TYPE_MAP
        elif t == list:
            return TP_DATA_TYPE.TYPE_ARR
        elif t == int:
            if ref_type < 256 and ref_type >= 0:
                return TP_DATA_TYPE.TYPE_U8
            elif ref_type < 128 and ref_type >= -128:
                return TP_DATA_TYPE.TYPE_I8
            return TP_DATA_TYPE.TYPE_I64
        elif t == float:
            return TP_DATA_TYPE.TYPE_DOUBLE
        return TP_DATA_TYPE.TYPE_NIL
    
    @staticmethod        
    def decode_varint(buffer: ByteBuffer):
        real = 0
        shl_num = 0
        while True:
            data = buffer.read_u8()
            real += (data & 0x7F) << shl_num
            shl_num += 7
            if (data & 0x80) == 0:
                break
        is_left = real % 2 == 1
        if is_left:
            return -floor(real / 2) - 1
        else:
            return floor(real / 2)
        
    @staticmethod        
    def decode_type(buffer: ByteBuffer):
        return buffer.read_u8()
    
    
    @staticmethod        
    def decode_number(buffer: ByteBuffer, pattern):
        if pattern == TP_DATA_TYPE.TYPE_U8:
            return buffer.read_u8()
        elif pattern == TP_DATA_TYPE.TYPE_I8:
            return buffer.read_i8()
        elif pattern == TP_DATA_TYPE.TYPE_U16:
            return buffer.read_u16()
        elif pattern == TP_DATA_TYPE.TYPE_I16:
            return buffer.read_i16()
        elif pattern == TP_DATA_TYPE.TYPE_U32:
            return buffer.read_u32()
        elif pattern == TP_DATA_TYPE.TYPE_I32:
            return buffer.read_i32()
        elif pattern == TP_DATA_TYPE.TYPE_U64:
            return buffer.read_u64()
        elif pattern == TP_DATA_TYPE.TYPE_I64:
            return buffer.read_i64()
        elif pattern == TP_DATA_TYPE.TYPE_FLOAT:
            return buffer.read_i32() / 1000.0
        elif pattern == TP_DATA_TYPE.TYPE_DOUBLE:
            return buffer.read_i64() / 1000000.0
        else:
            raise Exception(f"Unknow decode number type {pattern}")
        
    @staticmethod        
    def decode_str_raw(buffer: ByteBuffer, pattern):
        if pattern == TP_DATA_TYPE.TYPE_STR:
            length = TPPacker.decode_varint(buffer)
            if length == 0:
                return ""
            return buffer.read_str(length)
        elif pattern == TP_DATA_TYPE.TYPE_RAW:
            length = TPPacker.decode_varint(buffer)
            if length == 0:
                return ""
            return buffer.read_bytes(length)
        else:
            raise Exception(f"Unknow decode str type {pattern}")
    
    
    @staticmethod        
    def decode_field(buffer: ByteBuffer):
        pattern = TPPacker.decode_type(buffer)
        if pattern == TP_DATA_TYPE.TYPE_NIL:
            return None
        elif pattern == TP_DATA_TYPE.TYPE_BOOL:
            return True if buffer.read_u8() != 0 else False
        elif pattern >= TP_DATA_TYPE.TYPE_U8 and pattern <= TP_DATA_TYPE.TYPE_I8:
            return TPPacker.decode_number(buffer, pattern)
        elif pattern >= TP_DATA_TYPE.TYPE_U16 and pattern <= TP_DATA_TYPE.TYPE_I64:
            return TPPacker.decode_varint(buffer)
        elif pattern == TP_DATA_TYPE.TYPE_FLOAT:
            return TPPacker.decode_number(buffer, TP_DATA_TYPE.TYPE_I32) / 1000.0
        elif pattern == TP_DATA_TYPE.TYPE_DOUBLE:
            return TPPacker.decode_number(buffer, TP_DATA_TYPE.TYPE_I64) / 1000000.0
        elif pattern == TP_DATA_TYPE.TYPE_VARINT:
            return TPPacker.decode_varint(buffer) 
        elif pattern == TP_DATA_TYPE.TYPE_STR_IDX:
            idx = TPPacker.decode_varint(buffer)
            return buffer.get_str(idx)
        elif pattern == TP_DATA_TYPE.TYPE_STR or pattern == TP_DATA_TYPE.TYPE_RAW:
            return TPPacker.decode_str_raw(buffer, pattern)
        elif pattern == TP_DATA_TYPE.TYPE_ARR:
            return TPPacker.decode_arr(buffer)
        elif pattern == TP_DATA_TYPE.TYPE_MAP:
            return TPPacker.decode_map(buffer)
        else:
            raise Exception("unknow type")
        
    
    
    @staticmethod        
    def decode_arr(buffer: ByteBuffer):
        size = TPPacker.decode_varint(buffer)
        arr = []
        for _idx in range(size):
            sub = TPPacker.decode_field(buffer)
            arr.append(sub)
        return arr
    
    
    @staticmethod        
    def decode_map(buffer: ByteBuffer):
        size = TPPacker.decode_varint(buffer)
        map = {}
        for _idx in range(size):
            key = TPPacker.decode_field(buffer)
            val = TPPacker.decode_field(buffer)
            map[key] = val
        return map
    
    @staticmethod        
    def decode_proto(buffer: ByteBuffer):
        name = TPPacker.decode_str_raw(buffer, TP_DATA_TYPE.TYPE_STR)
        str_len = TPPacker.decode_varint(buffer)
        for _ in range(str_len):
            value = TPPacker.decode_str_raw(buffer, TP_DATA_TYPE.TYPE_STR)
            buffer.add_str(value)
        sub_value = TPPacker.decode_field(buffer)
        return name, sub_value
    
    
    @staticmethod
    def encode_varint(buffer: ByteBuffer, value):
        '''
        如果原数值是正数则将原数值变成value*2
        如果原数值是负数则将原数值变成-(value + 1) * 2 + 1
        相当于0->0, -1->1, 1->2,-2->3,2->4来做处理
        因为小数值是常用的, 所以保证小数值及负数的小数值尽可能的占少位
        '''
        if type(value) == bool:
            value = 1 if value else 0
        real = value * 2
        if value < 0:
            real = -(value + 1) * 2 + 1
        
        for _i in range(12):
            # 每个字节的最高位来表示有没有下一位, 若最高位为0, 则已完毕
            b = real & 0x7F
            real >>= 7
            if real > 0:
                buffer.write_u8(b | 0x80)
            else:
                buffer.write_u8(b)
                break
        
    @staticmethod
    def encode_type(buffer: ByteBuffer, value):
        buffer.write_u8(value)
        
    @staticmethod
    def encode_bool(buffer: ByteBuffer, value):
        buffer.write_u8(1 if value else 0)
        
    @staticmethod
    def encode_number(buffer: ByteBuffer, value, pattern):
        if pattern == TP_DATA_TYPE.TYPE_U8:
            return buffer.write_u8(value)
        elif pattern == TP_DATA_TYPE.TYPE_I8:
            return buffer.write_i8(value)
        elif pattern == TP_DATA_TYPE.TYPE_U16:
            return buffer.write_u16(value)
        elif pattern == TP_DATA_TYPE.TYPE_I16:
            return buffer.write_i16(value)
        elif pattern == TP_DATA_TYPE.TYPE_U32:
            return buffer.write_u32(value)
        elif pattern == TP_DATA_TYPE.TYPE_I32:
            return buffer.write_i32(value)
        elif pattern == TP_DATA_TYPE.TYPE_U64:
            return buffer.write_u64(value)
        elif pattern == TP_DATA_TYPE.TYPE_I64:
            return buffer.write_i64(value)
        elif pattern == TP_DATA_TYPE.TYPE_FLOAT:
            return buffer.write_i32(floor(value * 1000.0))
        elif pattern == TP_DATA_TYPE.TYPE_DOUBLE:
            return buffer.write_i64(floor(value * 1000000.0))
        else:
            raise Exception(f"Unknow decode number type {pattern}")
            
    @staticmethod
    def encode_str_idx(buffer: ByteBuffer, value):
        '''
        写入字符串索引值, 在数值区里的所有字符串默认会被写成索引值
        如果重复的字符串则会返回相同的索引值(varint)
        '''
        idx = buffer.add_str(value)
        TPPacker.encode_type(buffer, TP_DATA_TYPE.TYPE_STR_IDX)
        TPPacker.encode_varint(buffer, idx)
        
    @staticmethod
    def encode_str_raw(buffer: ByteBuffer, value, pattern):
        if pattern == TP_DATA_TYPE.TYPE_STR:
            b = value.encode("utf-8")
            TPPacker.encode_varint(buffer, len(b))
            buffer.write_bytes(b)
        elif pattern == TP_DATA_TYPE.TYPE_RAW:
            TPPacker.encode_varint(buffer, len(value))
            buffer.write_bytes(value)
        else:
            raise Exception(f"Unknow decode str type {pattern}")
        
    @staticmethod        
    def encode_field(buffer: ByteBuffer, value, pattern=None):
        '''
        先写入类型的值(u8), 则根据类型写入类型对应的的数据
        '''
        if not pattern:
            pattern = TPPacker.get_type_by_ref(value)
        if pattern == TP_DATA_TYPE.TYPE_NIL:
            return None
        elif pattern == TP_DATA_TYPE.TYPE_BOOL:
            TPPacker.encode_type(buffer, pattern)
            TPPacker.encode_bool(buffer, value)
        elif pattern >= TP_DATA_TYPE.TYPE_U8 and pattern <= TP_DATA_TYPE.TYPE_I8:
            TPPacker.encode_type(buffer, pattern)
            TPPacker.encode_number(buffer, value, pattern)
        elif pattern >= TP_DATA_TYPE.TYPE_U16 and pattern <= TP_DATA_TYPE.TYPE_I64:
            TPPacker.encode_type(buffer, TP_DATA_TYPE.TYPE_VARINT)
            TPPacker.encode_varint(buffer, value)
        elif pattern == TP_DATA_TYPE.TYPE_FLOAT:
            TPPacker.encode_type(buffer, pattern)
            TPPacker.encode_number(buffer, value, pattern)
        elif pattern == TP_DATA_TYPE.TYPE_DOUBLE:
            TPPacker.encode_type(buffer, pattern)
            TPPacker.encode_number(buffer, value, pattern)
        elif pattern == TP_DATA_TYPE.TYPE_STR:
            TPPacker.encode_str_idx(buffer, value)
        elif pattern == TP_DATA_TYPE.TYPE_RAW:
            TPPacker.encode_type(buffer, pattern)
            TPPacker.encode_str_raw(buffer, value)
        elif pattern == TP_DATA_TYPE.TYPE_ARR:
            TPPacker.encode_type(buffer, pattern)
            TPPacker.encode_arr(buffer, value)
        elif pattern == TP_DATA_TYPE.TYPE_MAP:
            TPPacker.encode_type(buffer, pattern)
            TPPacker.encode_map(buffer, value)
        else:
            raise Exception("unknow type")
        
    @staticmethod
    def encode_arr(buffer: ByteBuffer, value):
        '''
        写入数组的长度, 再写入各各元素的值
        '''
        TPPacker.encode_varint(buffer, len(value))
        for v in value:
            TPPacker.encode_field(buffer, v)
            
    @staticmethod
    def encode_map(buffer: ByteBuffer, value):
        '''
        写入map的长度, 再分别写入map各元素的key, value值
        '''
        TPPacker.encode_varint(buffer, len(value))
        for k in value:
            TPPacker.encode_field(buffer, k)
            TPPacker.encode_field(buffer, value[k])

    @staticmethod
    def encode_proto(buffer: ByteBuffer, name, infos):
        '''
        写入协议名称, 然后写入字符串索引区(即字符串数组), 然后再写入协议的详细数据
        '''
        sub_buffer = ByteBuffer()
        TPPacker.encode_field(sub_buffer, infos)

        TPPacker.encode_str_raw(buffer, name, TP_DATA_TYPE.TYPE_STR)
        TPPacker.encode_varint(buffer, len(sub_buffer.str_arr))
        for val in sub_buffer.str_arr:
            TPPacker.encode_str_raw(buffer, val, TP_DATA_TYPE.TYPE_STR)

        buffer.write_bytes(sub_buffer.all_bytes())