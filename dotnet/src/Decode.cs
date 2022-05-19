

namespace io.tunm {

    class Decode {

        public static bool check_vaild(ref Buffer buffer, int size) {
            if(buffer.data_len() < size) {
                throw new Exception("no have enough size");
            }
            return true;
        }
        public static byte decode_type(ref Buffer buffer) {
            check_vaild(ref buffer, 1);
            buffer.read(ref buffer.one_temp);
            return buffer.one_temp[0];
        }

        public static bool decode_bool(ref Buffer buffer) {
            check_vaild(ref buffer, 1);
            buffer.read(ref buffer.one_temp);
            return buffer.one_temp[0] != 0;
        }

        public static long decode_varint(ref Buffer buffer) {
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

        
        public static Object decode_str_raw(ref Buffer buffer, byte pattern) {
            switch(pattern) {
                case Values.TYPE_STR: {
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
                    string str = System.Text.Encoding.UTF8.GetString(rv);
                    return str;
                }
                case Values.TYPE_RAW: {
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
        
        public static Object decode_number(ref Buffer buffer, byte pattern ) {
            switch(pattern) {
                case Values.TYPE_U8:{
                    check_vaild(ref buffer, 1);
                    buffer.read(ref buffer.one_temp);
                    return buffer.one_temp[0];
                }
                case Values.TYPE_I8:{
                    check_vaild(ref buffer, 1);
                    buffer.read(ref buffer.one_temp);
                    return buffer.one_temp[0];
                }
                case Values.TYPE_U16:{
                    check_vaild(ref buffer, 2);
                    buffer.read(ref buffer.two_temp);
                    return buffer.two_temp[0] + buffer.two_temp[1] << 8;
                }
                case Values.TYPE_I16:{
                    check_vaild(ref buffer, 2);
                    buffer.read(ref buffer.two_temp);
                    var is_neg = (buffer.two_temp[1] & 0x80) != 0;
                    var real = buffer.two_temp[0] + (buffer.two_temp[1] & 0x7F) << 8;
                    return is_neg ? (short)-real : (short)real;
                }
                case Values.TYPE_U32:{
                    check_vaild(ref buffer, 4);
                    buffer.read(ref buffer.four_temp);
                    return buffer.four_temp[0] + buffer.four_temp[1] << 8 + buffer.four_temp[2] << 16 + buffer.four_temp[3] << 24;
                }
                case Values.TYPE_I32:{
                    check_vaild(ref buffer, 4);
                    buffer.read(ref buffer.four_temp);
                    var is_neg = (buffer.four_temp[3] & 0x80) != 0;
                    var real = buffer.four_temp[0] + buffer.four_temp[1] << 8 + buffer.four_temp[2] << 16 + (buffer.four_temp[3] & 0x7F) << 24;
                    return is_neg ? (int)-real : (int)real;
                }
                case Values.TYPE_U64:{
                    check_vaild(ref buffer, 8);
                    byte[] eight_temp = new byte[8];
                    buffer.read(ref eight_temp);
                    return (ulong)(eight_temp[0] + eight_temp[1] << 8 + eight_temp[2] << 16 + eight_temp[3] << 24
                     + eight_temp[4] << 32 + eight_temp[5] << 40 + eight_temp[6] << 48 + eight_temp[7] << 56);
                }
                case Values.TYPE_I64:{
                    check_vaild(ref buffer, 8);
                    byte[] eight_temp = new byte[8];
                    buffer.read(ref eight_temp);
                    var is_neg = (eight_temp[7] & 0x80) != 0;
                    var real = (long)((long)eight_temp[0] + eight_temp[1] << 8 + eight_temp[2] << 16 + eight_temp[3] << 24
                     + eight_temp[4] << 32 + eight_temp[5] << 40 + eight_temp[6] << 48 + (eight_temp[7] & 0x7F) << 56);
                    return is_neg ? -real : real;
                }
                case Values.TYPE_VARINT:{
                    return decode_varint(ref buffer);
                }
                case Values.TYPE_FLOAT:{
                    check_vaild(ref buffer, 4);
                    buffer.read(ref buffer.four_temp);
                    var is_neg = (buffer.four_temp[3] & 0x80) != 0;
                    var real = buffer.four_temp[0] + buffer.four_temp[1] << 8 + buffer.four_temp[2] << 16 + (buffer.four_temp[3] & 0x7F) << 24;
                    return (is_neg ? (int)-real : (int)real) / 1000.0;
                }
                case Values.TYPE_DOUBLE:{
                    check_vaild(ref buffer, 8);
                    byte[] eight_temp = new byte[8];
                    buffer.read(ref eight_temp);
                    var is_neg = (eight_temp[7] & 0x80) != 0;
                    var real = (long)((long)eight_temp[0] + eight_temp[1] << 8 + eight_temp[2] << 16 + eight_temp[3] << 24
                     + eight_temp[4] << 32 + eight_temp[5] << 40 + eight_temp[6] << 48 + (eight_temp[7] & 0x7F) << 56);
                    return (is_neg ? -real : real) / 1000000;
                }
                default:
                    throw new Exception("unknow number");
            }
        }

        public static Object decode_map(ref Buffer buffer) {
            long len = decode_varint(ref buffer);
            var map = new Dictionary<Object, Object>();
            for(var i = 0; i < len; i++) {
                var key = decode_field(ref buffer);
                var sub_value = decode_field(ref  buffer);
                map.Add(key, sub_value);
            }
            return map;
        }
        
        
        public static Object decode_arr(ref Buffer buffer) {
            long len = decode_varint(ref buffer);
            var list = new List<Object>();
            for(var i = 0; i < len; i++) {
                var val = decode_field(ref buffer);
                list.Add(val);
            }
            return list;
        }

        public static Object decode_by_pattern(ref Buffer buffer, byte pattern) {
            switch(pattern) {
                case Values.TYPE_BOOL:
                    return decode_bool(ref buffer);
                case Values.TYPE_I8:
                case Values.TYPE_U8:
                case Values.TYPE_I16:
                case Values.TYPE_U16:
                case Values.TYPE_I32:
                case Values.TYPE_U32:
                case Values.TYPE_I64:
                case Values.TYPE_U64:
                case Values.TYPE_FLOAT:
                case Values.TYPE_DOUBLE:
                    return decode_number(ref buffer, pattern);
                case Values.TYPE_VARINT:
                    return decode_varint(ref buffer);
                case Values.TYPE_STR:
                case Values.TYPE_RAW:
                    return decode_str_raw(ref buffer, pattern);
                case Values.TYPE_STR_IDX: {
                    var idx = decode_varint(ref buffer);
                    return buffer.get_str((int)idx)??"";
                }
                case Values.TYPE_MAP:
                    return decode_map(ref buffer);
                case Values.TYPE_ARR:
                    return decode_arr(ref buffer);
                case Values.TYPE_NIL:
                    return Values.NilObject;
                default:
                    throw new Exception("unknow type");
            }
        }

        public static Object decode_field(ref Buffer buffer) {
            var pattern = decode_type(ref buffer);
            return decode_by_pattern(ref buffer, pattern);
        }
        public static List<Object> decode_proto(ref Buffer buffer, out string name) {
            name = (string)decode_str_raw(ref buffer, Values.TYPE_STR);
    
            var str_len = (int)decode_varint(ref buffer);
            for(var i = 0; i < str_len; i++) {
                var value = (string)decode_str_raw(ref buffer, Values.TYPE_STR);
                buffer.add_str(value);
            }

            var sub_value = decode_field(ref buffer);
            if (Values.get_type_by_value(ref sub_value) != Values.TYPE_ARR) {
                throw new Exception("参数异常");
            }
            return (List<Object>)sub_value;
        }
    }
}


