

using System;
using System.Collections.Generic;
using System.Collections;

namespace proto.tunm {

    public class TunmDecode {

        public static bool check_vaild(ref TunmBuffer buffer, int size) {
            if(buffer.data_len() < size) {
                throw new Exception("no have enough size");
            }
            return true;
        }
        public static byte decode_type(ref TunmBuffer buffer) {
            check_vaild(ref buffer, 1);
            buffer.read(ref buffer.one_temp);
            return buffer.one_temp[0];
        }

        public static bool decode_bool(ref TunmBuffer buffer) {
            check_vaild(ref buffer, 1);
            buffer.read(ref buffer.one_temp);
            return buffer.one_temp[0] != 0;
        }

        public static long decode_varint(ref TunmBuffer buffer) {
            ulong real = 0;
            int shl_num = 0;
            while(true) {
                check_vaild(ref buffer, 1);
                buffer.read(ref buffer.one_temp);
                ulong read = (ulong)(buffer.one_temp[0] & 0x7F);
                real += read << shl_num;
                shl_num += 7;
                if ((buffer.one_temp[0] & 0x80) == 0) {
                    break;
                }
            }

            var is_left = real % 2 == 1;
            return is_left ? - (long)(real / 2) - 1 : (long)(real / 2);
        }

        
        public static Object decode_str_raw(ref TunmBuffer buffer, byte pattern) {
            switch(pattern) {
                case TunmValues.TYPE_STR: {
                    long len = decode_varint(ref buffer);
                    if(len == 0) {
                        return "";
                    }

                    check_vaild(ref buffer, (int)len);
                    if(len > 65536) {
                        throw new Exception("too big str");
                    }

                    byte[] rv = new byte[len];
                    buffer.read(ref rv);
                    return System.Text.Encoding.UTF8.GetString(rv);
                }
                case TunmValues.TYPE_RAW: {
                    long len = decode_varint(ref buffer);
                    if(len == 0) {
                        return "";
                    }

                    check_vaild(ref buffer, (int)len);
                    if(len > 65536) {
                        throw new Exception("too big str");
                    }

                    byte[] rv = new byte[len];
                    buffer.read(ref rv);
                    return rv;
                }
                default: 
                    throw new Exception("unknow str type");
            }
        }
        
        public static Object decode_number(ref TunmBuffer buffer, byte pattern ) {
            switch(pattern) {
                case TunmValues.TYPE_U8:{
                    check_vaild(ref buffer, 1);
                    buffer.read(ref buffer.one_temp);
                    return buffer.one_temp[0];
                }
                case TunmValues.TYPE_I8:{
                    check_vaild(ref buffer, 1);
                    buffer.read(ref buffer.one_temp);
                    return buffer.one_temp[0];
                }
                case TunmValues.TYPE_U16:{
                    check_vaild(ref buffer, 2);
                    buffer.read(ref buffer.two_temp);
                    if(!BitConverter.IsLittleEndian) {
                        Array.Reverse(buffer.two_temp);
                    }
                    return BitConverter.ToUInt16(buffer.two_temp, 0);
                }
                case TunmValues.TYPE_I16:{
                    check_vaild(ref buffer, 2);
                    buffer.read(ref buffer.two_temp);
                    if(!BitConverter.IsLittleEndian) {
                        Array.Reverse(buffer.two_temp);
                    }
                    return BitConverter.ToInt16(buffer.two_temp, 0);
                }
                case TunmValues.TYPE_U32:{
                    check_vaild(ref buffer, 4);
                    buffer.read(ref buffer.four_temp);
                    if(!BitConverter.IsLittleEndian) {
                        Array.Reverse(buffer.four_temp);
                    }
                    return BitConverter.ToUInt32(buffer.four_temp, 0);
                }
                case TunmValues.TYPE_I32:{
                    check_vaild(ref buffer, 4);
                    buffer.read(ref buffer.four_temp);
                    if(!BitConverter.IsLittleEndian) {
                        Array.Reverse(buffer.four_temp);
                    }
                    return BitConverter.ToInt32(buffer.four_temp, 0);
                }
                case TunmValues.TYPE_U64:{
                    check_vaild(ref buffer, 8);
                    byte[] eight_temp = new byte[8];
                    buffer.read(ref eight_temp);
                    if(!BitConverter.IsLittleEndian) {
                        Array.Reverse(eight_temp);
                    }
                    return BitConverter.ToUInt64(eight_temp, 0);
                }
                case TunmValues.TYPE_I64:{
                    check_vaild(ref buffer, 8);
                    byte[] eight_temp = new byte[8];
                    buffer.read(ref eight_temp);
                    buffer.read(ref eight_temp);
                    if(!BitConverter.IsLittleEndian) {
                        Array.Reverse(eight_temp);
                    }
                    return BitConverter.ToInt64(eight_temp, 0);
                }
                case TunmValues.TYPE_VARINT:{
                    return decode_varint(ref buffer);
                }
                case TunmValues.TYPE_FLOAT:{
                    check_vaild(ref buffer, 4);
                    buffer.read(ref buffer.four_temp);
                    var val = BitConverter.ToInt32(buffer.four_temp, 0);
                    return (float)(val / 1000.0);
                }
                case TunmValues.TYPE_DOUBLE:{
                    check_vaild(ref buffer, 8);
                    byte[] eight_temp = new byte[8];
                    buffer.read(ref eight_temp);
                    var val = BitConverter.ToInt64(eight_temp, 0);
                    return (double)(val / 1000000.0);
                }
                default:
                    throw new Exception("unknow number");
            }
        }

        public static Object decode_map(ref TunmBuffer buffer) {
            long len = decode_varint(ref buffer);
            var map = new Dictionary<Object, Object>();
            for(var i = 0; i < len; i++) {
                var key = decode_field(ref buffer);
                var sub_value = decode_field(ref  buffer);
                map.Add(key, sub_value);
            }
            return map;
        }
        
        
        public static Object decode_arr(ref TunmBuffer buffer) {
            long len = decode_varint(ref buffer);
            var list = new ArrayList();
            for(var i = 0; i < len; i++) {
                var val = decode_field(ref buffer);
                list.Add(val);
            }
            return list;
        }

        public static Object decode_by_pattern(ref TunmBuffer buffer, byte pattern) {
            switch(pattern) {
                case TunmValues.TYPE_BOOL:
                    return decode_bool(ref buffer);
                case TunmValues.TYPE_I8:
                case TunmValues.TYPE_U8:
                case TunmValues.TYPE_I16:
                case TunmValues.TYPE_U16:
                case TunmValues.TYPE_I32:
                case TunmValues.TYPE_U32:
                case TunmValues.TYPE_I64:
                case TunmValues.TYPE_U64:
                    return decode_number(ref buffer, pattern);
                case TunmValues.TYPE_FLOAT: {
                    var idx = decode_varint(ref buffer);
                    return (float)(idx / 1000.0);
                }
                case TunmValues.TYPE_DOUBLE: {
                    var idx = decode_varint(ref buffer);
                    return idx / 1000000.0;
                }
                case TunmValues.TYPE_VARINT:
                    return decode_varint(ref buffer);
                case TunmValues.TYPE_STR:
                case TunmValues.TYPE_RAW:
                    return decode_str_raw(ref buffer, pattern);
                case TunmValues.TYPE_STR_IDX: {
                    var idx = decode_varint(ref buffer);
                    return buffer.get_str((int)idx);
                }
                case TunmValues.TYPE_MAP:
                    return decode_map(ref buffer);
                case TunmValues.TYPE_ARR:
                    return decode_arr(ref buffer);
                case TunmValues.TYPE_NIL:
                    return TunmValues.NilObject;
                default:
                    throw new Exception("unknow type");
            }
        }

        public static Object decode_field(ref TunmBuffer buffer) {
            var pattern = decode_type(ref buffer);
            return decode_by_pattern(ref buffer, pattern);
        }
        public static ArrayList decode_proto(ref TunmBuffer buffer, out string name) {
            name = (string)decode_str_raw(ref buffer, TunmValues.TYPE_STR);
    
            var str_len = (int)decode_varint(ref buffer);
            for(var i = 0; i < str_len; i++) {
                var value = (String)decode_str_raw(ref buffer, TunmValues.TYPE_STR);
                buffer.add_str(value);
            }

            var sub_value = decode_field(ref buffer);
            if (TunmValues.get_type_by_value(ref sub_value) != TunmValues.TYPE_ARR) {
                throw new Exception("参数异常");
            }
            return (ArrayList)sub_value;
        }
    }
}


