
namespace proto.tunm {

    class Encode {

        public static void encode_sure_type(ref Buffer buffer, byte value) {
            buffer.write(new byte[1]{value});
        }

        public static void encode_type(ref Buffer buffer, Object value) {
            buffer.write(new byte[1]{Values.get_type_by_value(ref value)});
        }

        public static void encode_bool(ref Buffer buffer, bool value) {
            buffer.write(new byte[1]{value ? (byte)1 : (byte)0});
        }

        public static void encode_number(ref Buffer buffer, Object value) {
            switch(Values.get_type_by_value(ref value)) {
                case Values.TYPE_I8: 
                case Values.TYPE_U8: 
                    buffer.write(new byte[1]{(byte)value});
                    break;
                case Values.TYPE_I16: {
                    var val = (short)value;
                    var bytes = BitConverter.GetBytes( val );
                    if(!BitConverter.IsLittleEndian) {
                        Array.Reverse(bytes);
                    }
                    buffer.write(bytes);
                    break;
                }
                case Values.TYPE_U16: {
                    var val = (ushort)value;
                    var bytes = BitConverter.GetBytes( val );
                    if(!BitConverter.IsLittleEndian) {
                        Array.Reverse(bytes);
                    }
                    buffer.write(bytes);
                    break;
                }
                case Values.TYPE_I32: {
                    var val = (int)value;
                    var bytes = BitConverter.GetBytes( val );
                    if(!BitConverter.IsLittleEndian) {
                        Array.Reverse(bytes);
                    }
                    buffer.write(bytes);
                    break;
                }
                case Values.TYPE_U32: {
                    var val = (uint)value;
                    var bytes = BitConverter.GetBytes( val );
                    if(!BitConverter.IsLittleEndian) {
                        Array.Reverse(bytes);
                    }
                    buffer.write(bytes);
                    break;
                }
                case Values.TYPE_I64: {
                    var val = (long)value;
                    var bytes = BitConverter.GetBytes( val );
                    if(!BitConverter.IsLittleEndian) {
                        Array.Reverse(bytes);
                    }
                    buffer.write(bytes);
                    break;
                }
                case Values.TYPE_U64: {
                    var val = (ulong)value;
                    var bytes = BitConverter.GetBytes( val );
                    if(!BitConverter.IsLittleEndian) {
                        Array.Reverse(bytes);
                    }
                    buffer.write(bytes);                
                    break;
                }
                case Values.TYPE_FLOAT: {
                    var val = (int)((float)value * 1000);
                    var bytes = BitConverter.GetBytes( val );
                    if(!BitConverter.IsLittleEndian) {
                        Array.Reverse(bytes);
                    }
                    buffer.write(bytes);        
                    break;
                }
                case Values.TYPE_DOUBLE: {
                    var val = (long)((double)value * 1000000);
                    var bytes = BitConverter.GetBytes( val );
                    if(!BitConverter.IsLittleEndian) {
                        Array.Reverse(bytes);
                    }
                    buffer.write(bytes);   
                    break;
                }
                default:
                    throw new Exception("unsupport error type");
            }
        }

        
        public static void encode_varint(ref Buffer buffer, Object value) {
            long val = 0;
            switch(Values.get_type_by_value(ref value)) {
                case Values.TYPE_I8: 
                case Values.TYPE_U8: 
                    val = (byte)value;
                    break;
                case Values.TYPE_I16:
                    val = (short)value;
                    break;
                case Values.TYPE_U16:
                    val = (ushort)value;
                    break;
                case Values.TYPE_I32:
                    val = (int)value;
                    break;
                case Values.TYPE_U32:
                    val = (uint)value;
                    break;
                case Values.TYPE_I64:
                    val = (long)value;
                    break;
                case Values.TYPE_U64:
                    val = (long)(ulong)value;
                    break;
                case Values.TYPE_FLOAT: {
                    val = (long)((float)value * 1000);
                    break;
                }
                case Values.TYPE_DOUBLE: {
                    val = (long)((double)value * 1000000);
                    break;
                }
                default:
                    throw new Exception("unsupport error type");
            }
            var real = val < 0 ? (-(val + 1)) * 2 + 1 : val * 2;
            while(true) {
                var data = (byte)(real & 0x7F);
                real = real >> 7;
                if(real == 0) {
                    buffer.write(new byte[1]{data});
                    break;
                } else {
                    buffer.write(new byte[1]{(byte)(data | 0x80)});
                }
            }
        }
        
        public static void encode_str_idx(ref Buffer buffer, String pattern) {
            var idx = buffer.add_str(pattern);
            Encode.encode_sure_type(ref buffer, Values.TYPE_STR_IDX);
            Encode.encode_varint(ref buffer, idx);
        }
        
        public static void encode_str_raw(ref Buffer buffer, Object value) {
            switch(Values.get_type_by_value(ref value)) {
                case Values.TYPE_STR:{
                    var val = (string)value;
                    var bytes = System.Text.Encoding.UTF8.GetBytes(val);
                    encode_varint(ref buffer, bytes.Length);
                    buffer.write(bytes);
                    break;
                }
                case Values.TYPE_RAW:{
                    var val = (byte[])value;
                    encode_varint(ref buffer, val.Length);
                    buffer.write(val);
                    break;
                }
                default:
                    throw new Exception("unknow type str");
            }
        }
        
        public static void encode_map(ref Buffer buffer, Object value) {
            switch(Values.get_type_by_value(ref value)) {
                case Values.TYPE_MAP:
                    var val = (Dictionary<Object, Object>)value;
                    encode_varint(ref buffer, val.Count);
                    foreach(var sub_value in val) {
                        encode_field(ref buffer, sub_value.Key);
                        encode_field(ref buffer, sub_value.Value);
                    }
                    break;
                default:
                    throw new Exception("unknow type str");
            }
        }
        
        public static void encode_arr(ref Buffer buffer, Object value) {
            switch(Values.get_type_by_value(ref value)) {
                case Values.TYPE_ARR:
                    var val = (List<Object>)value;
                    encode_varint(ref buffer, val.Count);
                    foreach(var sub_val in val) {
                        encode_field(ref buffer, sub_val);
                    }
                    break;
                default:
                    throw new Exception("unknow type str");
            }
        }

        public static void encode_field(ref Buffer buffer, Object value) {
            var val_type = Values.get_type_by_value(ref value);
            switch(val_type) {
                case Values.TYPE_BOOL:
                    encode_sure_type(ref buffer, Values.TYPE_BOOL);
                    encode_bool(ref buffer, (bool)value);
                    break;
                case Values.TYPE_U8:
                case Values.TYPE_I8:
                    encode_type(ref buffer, value);
                    encode_number(ref buffer, value);
                    break;
                case Values.TYPE_U16:
                case Values.TYPE_I16:
                case Values.TYPE_U32:
                case Values.TYPE_I32:
                case Values.TYPE_U64:
                case Values.TYPE_I64:
                    encode_sure_type(ref buffer, Values.TYPE_VARINT);
                    encode_varint(ref buffer, value);
                    break;
                case Values.TYPE_FLOAT:
                    encode_sure_type(ref buffer, Values.TYPE_FLOAT);
                    encode_number(ref buffer, value);
                    break;
                case Values.TYPE_DOUBLE:
                    encode_sure_type(ref buffer, Values.TYPE_DOUBLE);
                    encode_number(ref buffer, value);
                    break;

                case Values.TYPE_STR:
                    encode_str_idx(ref buffer, (string)value);
                    break;
                case Values.TYPE_RAW:
                    break;
                case Values.TYPE_ARR:
                    encode_type(ref buffer, value);
                    encode_arr(ref buffer, value);
                    break;
                case Values.TYPE_MAP:
                    encode_type(ref buffer, value);
                    encode_map(ref buffer, value);
                    break;
                case Values.TYPE_NIL:
                    encode_type(ref buffer, value);
                    break;
                default:
                    throw new Exception("unknow type str");
            }
        }

        
        public static void encode_proto(ref Buffer buffer, String name, List<Object> infos) {
            var sub_buffer = new Buffer();
            encode_field(ref sub_buffer, infos);

            encode_str_raw(ref buffer, name);
            encode_varint(ref buffer, sub_buffer.str_arr.Count);
            foreach (string v in sub_buffer.str_arr) {
                encode_str_raw(ref buffer, v);
            }
            buffer.extend(sub_buffer);
        }

    }
}

