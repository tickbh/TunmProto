
using System.Text;
using System.Collections;

namespace proto.tunm {
    class  Test {

    static String ObjectToString(object obj)
    {
        var builder = new StringBuilder();
        ObjectToString(ref builder, obj);
        return builder.ToString();

    }
    static void ObjectToString(ref StringBuilder builder, object obj)
    {
        if(obj == null)
        {
            builder.Append("null");
            return;
        }
        var name = obj.GetType().Name;
        if (name == TunmValues.STR_TYPE_STR)
        {
            builder.AppendFormat("\"{0}\"", (String)obj);
        }
        else if (name == TunmValues.STR_TYPE_ARR)
        {
            var list = (ArrayList)(obj);
            var index = 0;
            builder.Append("[");
            foreach (var sub_val in list)
            {
                ObjectToString(ref builder, sub_val);
                if(++index < list.Count)
                {
                    builder.Append(",");
                }
            }
            builder.Append("]");
        }
        else if (name == TunmValues.STR_TYPE_MAP)
        {
            var index = 0;
            var map = (Dictionary<object, object>)(obj);
            builder.Append("{");
            foreach (var key in map)
            {
                ObjectToString(ref builder, key.Key);
                builder.Append(":");
                ObjectToString(ref builder, key.Value);
                if (++index < map.Count)
                {
                    builder.Append(",");
                }
            }
            builder.Append("}");
        }
        else if (name == TunmValues.STR_TYPE_MAP)
        {
            var map = (Dictionary<object, object>)(obj);
            builder.AppendFormat("Dictionary{}{", map.Count);
            foreach (var key in map)
            {
                ObjectToString(ref builder, key);
                builder.Append(":");
                ObjectToString(ref builder, map[key]);
                builder.Append(",");
            }
            builder.Append("}");
        }
        else
        {
            switch (name)
            {
                case TunmValues.STR_TYPE_I8:
                case TunmValues.STR_TYPE_U8:
                    builder.Append((byte)obj);
                    break;
                case TunmValues.STR_TYPE_I16:
                    builder.Append((short)obj);
                    break;
                case TunmValues.STR_TYPE_U16:
                    builder.Append((ushort)obj);
                    break;
                case TunmValues.STR_TYPE_I32:
                    builder.Append((int)obj);
                    break;
                case TunmValues.STR_TYPE_U32:
                    builder.Append((uint)obj);
                    break;
                case TunmValues.STR_TYPE_I64:
                    builder.Append((long)obj);
                    break;
                case TunmValues.STR_TYPE_U64:
                    builder.Append((ulong)obj);
                    break;
                case TunmValues.STR_TYPE_FLOAT:
                    {
                        builder.Append((float)obj);
                        break;
                    }
                case TunmValues.STR_TYPE_DOUBLE:
                    {
                        builder.Append((double)obj);
                        break;
                    }
            }
        }
    }

        static void assert_eq(Object obj1, Object obj2) {
            if(obj1.GetType() != obj2.GetType()) {
                throw new Exception("type no equal");
            }

            if(obj1.GetType().Name == "Byte[]") {
                var list1 = (byte[])(obj1);
                var list2 = (byte[])(obj2);
                assert_eq(list1.Length, list2.Length);
                for(var i = 0; i < list1.Length; i++) {
                    assert_eq(list1[i], list2[i]);
                }
                return;
            }
            if(obj1.GetType().Name == "ArrayList" || obj1.GetType().Name == "Byte[]") {
                var list1 = (ArrayList)(obj1);
                var list2 = (ArrayList)(obj2);
                assert_eq(list1.Count, list2.Count);
                for(var i = 0; i < list1.Count; i++) {
                    assert_eq(list1[i], list2[i]);
                }
                return;
            }

            if(obj1.GetType().Name == "Dictionary`2") {
                var map1 = (Dictionary<Object, Object>)(obj1);
                var map2 = (Dictionary<Object, Object>)(obj2);
                assert_eq(map1.Count, map2.Count);
                foreach(var k in map1) {
                    assert_eq(k.Value, map2[k.Key]);
                }
                return;
            }
            
            if (!obj1.Equals(obj2)) {
                throw new Exception("no equal info");
            }
        }

        public static void test_encode_u8() {
            var buffer = new TunmBuffer();
            TunmEncode.encode_field(ref buffer, (byte)12);
            assert_eq(buffer.get_write_data(), new byte[]{2, 12});
            var read = TunmDecode.decode_field(ref buffer);
            assert_eq(read, (byte) 12);
            Console.WriteLine("test_encode_u8 success");
        }

        public static void test_encode_u16() {
            var buffer = new TunmBuffer();
            TunmEncode.encode_field(ref buffer, (short)-1);
            TunmEncode.encode_field(ref buffer, (ushort)0x1234);
            assert_eq(buffer.get_write_data(), new byte[]{10, 1, 10, 232, 72});
            var read = TunmDecode.decode_field(ref buffer);
            assert_eq(read, (long) -1);
            read = TunmDecode.decode_field(ref buffer);
            assert_eq(read, (long) 0x1234);
            Console.WriteLine("test_encode_u16 success");
        }


        public static void test_encode_u32() {
            var buffer = new TunmBuffer();
            TunmEncode.encode_field(ref buffer, (int)-90);
            TunmEncode.encode_field(ref buffer, (uint)0x12345678);
            assert_eq(buffer.get_write_data(), new byte[]{10, 179, 1, 10, 240, 217, 162, 163, 2});
            var read = TunmDecode.decode_field(ref buffer);
            assert_eq(read, (long) -90);
            read = TunmDecode.decode_field(ref buffer);
            assert_eq(read, (long) 0x12345678);
            Console.WriteLine("test_encode_u32 success");
        }
        
        public static void test_encode_float() {
            var buffer = new TunmBuffer();
            TunmEncode.encode_field(ref buffer, (float)12345.123);
            assert_eq(buffer.get_write_data(), new byte[]{11, 198, 252, 226, 11});
            var read = TunmDecode.decode_field(ref buffer);
            assert_eq(read, (float) 12345.123);
            Console.WriteLine("test_encode_float success");
        }


        public static void test_encode_str() {
            var buffer = new TunmBuffer();
            var test_str = "this is tunm proto, 中文测试";
            TunmEncode.encode_str_raw(ref buffer, test_str);
            assert_eq(buffer.get_write_data(), new byte[]{64, 116, 104, 105, 115, 32, 105, 115, 32, 116, 117, 110, 109, 32, 112, 114, 111, 116, 111, 44, 32, 228, 184, 173, 230, 150, 135, 230, 181, 139, 232, 175, 149});
            var read = TunmDecode.decode_str_raw(ref buffer, TunmValues.TYPE_STR);
            assert_eq(read, test_str);
            Console.WriteLine("test_encode_str success");
        }

        
        public static void test_encode_map() {
            var buffer = new TunmBuffer();
            var hash_value = new Dictionary<Object, Object>();
            hash_value.Add("name", "tickbh");
            hash_value.Add("proto", "tunm");
            hash_value.Add("index", (long)1);
            TunmEncode.encode_field(ref buffer, hash_value);
            var read = TunmDecode.decode_field(ref buffer);
            assert_eq(read, hash_value);
            Console.WriteLine("test_encode_map success");
        }


        public static void test_base_proto() {
            var buffer = new TunmBuffer();
            var hash_value = new Dictionary<Object, Object>();
            hash_value.Add("name", "tickbh");
            hash_value.Add("proto", "tunm");
            hash_value.Add("index", (long)1);
            var array = new ArrayList();
            array.Add(hash_value);
            TunmEncode.encode_proto(ref buffer, "cmd_test_op", array);


            var proto_name = "";
            var read = TunmDecode.decode_proto(ref buffer, out proto_name);

            StringBuilder sb = new StringBuilder();
            ObjectToString(ref sb, read);
            Console.WriteLine(sb.ToString());

            assert_eq(proto_name, "cmd_test_op");
            assert_eq(read, array);
            Console.WriteLine("test_base_proto success");
        }
    }
}