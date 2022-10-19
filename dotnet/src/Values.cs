using System;
using System.Text;
using System.Collections.Generic;
using System.Collections;

namespace proto.tunm
{

    public class TunmValues
    {
        public const byte TYPE_NIL = 0;
        public const byte TYPE_BOOL = 1;
        public const byte TYPE_U8 = 2;
        public const byte TYPE_I8 = 3;
        public const byte TYPE_U16 = 4;
        public const byte TYPE_I16 = 5;
        public const byte TYPE_U32 = 6;
        public const byte TYPE_I32 = 7;
        public const byte TYPE_U64 = 8;
        public const byte TYPE_I64 = 9;
        public const byte TYPE_VARINT = 10;
        public const byte TYPE_FLOAT = 11;
        public const byte TYPE_DOUBLE = 12;
        public const byte TYPE_STR = 13;
        public const byte TYPE_STR_IDX = 14;
        public const byte TYPE_RAW = 15;
        public const byte TYPE_ARR = 16;
        public const byte TYPE_MAP = 17;

        public const Object NilObject = null;

        public const string STR_TYPE_NIL = "Null";
        public const string STR_TYPE_BOOL = "Boolean";
        public const string STR_TYPE_U8 = "Byte";
        public const string STR_TYPE_I8 = "IByte";
        public const string STR_TYPE_U16 = "UInt16";
        public const string STR_TYPE_I16 = "Int16";
        public const string STR_TYPE_U32 = "UInt32";
        public const string STR_TYPE_I32 = "Int32";
        public const string STR_TYPE_U64 = "UInt64";
        public const string STR_TYPE_I64 = "Int64";
        public const string STR_TYPE_VARINT = "VARINT";
        public const string STR_TYPE_FLOAT = "Single";
        public const string STR_TYPE_DOUBLE = "Double";
        public const string STR_TYPE_STR = "String";
        public const string STR_TYPE_STR_IDX = "StringIdx";
        public const string STR_TYPE_RAW = "Byte[]";
        public const string STR_TYPE_ARR = "ArrayList";
        public const string STR_TYPE_MAP = "Dictionary`2";

        static public byte get_type_by_value(ref Object obj)
        {
            if (obj == null)
            {
                return TYPE_NIL;
            }
            return get_type_by_name(obj.GetType().Name);
        }

        static public byte get_type_by_name(string name)
        {
            switch (name)
            {
                case STR_TYPE_NIL: return TunmValues.TYPE_NIL;
                case STR_TYPE_BOOL: return TunmValues.TYPE_BOOL;
                case STR_TYPE_U8: return TunmValues.TYPE_U8;
                case STR_TYPE_I8: return TunmValues.TYPE_I8;
                case STR_TYPE_U16: return TunmValues.TYPE_U16;
                case STR_TYPE_I16: return TunmValues.TYPE_I16;
                case STR_TYPE_U32: return TunmValues.TYPE_U32;
                case STR_TYPE_I32: return TunmValues.TYPE_I32;
                case STR_TYPE_U64: return TunmValues.TYPE_U64;
                case STR_TYPE_I64: return TunmValues.TYPE_I64;
                case STR_TYPE_VARINT: return TunmValues.TYPE_VARINT;
                case STR_TYPE_FLOAT: return TunmValues.TYPE_FLOAT;
                case STR_TYPE_DOUBLE: return TunmValues.TYPE_DOUBLE;
                case STR_TYPE_STR: return TunmValues.TYPE_STR;
                case STR_TYPE_STR_IDX: return TunmValues.TYPE_STR_IDX;
                case STR_TYPE_RAW: return TunmValues.TYPE_RAW;
                case STR_TYPE_ARR: return TunmValues.TYPE_ARR;
                case STR_TYPE_MAP: return TunmValues.TYPE_MAP;
                default: return TunmValues.TYPE_NIL;
            }
        }

        static public string get_name_by_type(byte index)
        {
            switch (index)
            {
                case TunmValues.TYPE_NIL: return TunmValues.STR_TYPE_NIL;
                case TunmValues.TYPE_BOOL: return TunmValues.STR_TYPE_BOOL;
                case TunmValues.TYPE_U8: return TunmValues.STR_TYPE_U8;
                case TunmValues.TYPE_I8: return TunmValues.STR_TYPE_I8;
                case TunmValues.TYPE_U16: return TunmValues.STR_TYPE_U16;
                case TunmValues.TYPE_I16: return TunmValues.STR_TYPE_I16;
                case TunmValues.TYPE_U32: return TunmValues.STR_TYPE_U32;
                case TunmValues.TYPE_I32: return TunmValues.STR_TYPE_I32;
                case TunmValues.TYPE_U64: return TunmValues.STR_TYPE_U64;
                case TunmValues.TYPE_I64: return TunmValues.STR_TYPE_I64;
                case TunmValues.TYPE_VARINT: return TunmValues.STR_TYPE_VARINT;
                case TunmValues.TYPE_FLOAT: return TunmValues.STR_TYPE_FLOAT;
                case TunmValues.TYPE_DOUBLE: return TunmValues.STR_TYPE_DOUBLE;
                case TunmValues.TYPE_STR: return TunmValues.STR_TYPE_STR;
                case TunmValues.TYPE_STR_IDX: return TunmValues.STR_TYPE_STR_IDX;
                case TunmValues.TYPE_RAW: return TunmValues.STR_TYPE_RAW;
                case TunmValues.TYPE_ARR: return TunmValues.STR_TYPE_ARR;
                case TunmValues.TYPE_MAP: return TunmValues.STR_TYPE_MAP;
                default: return TunmValues.STR_TYPE_NIL;
            }
        }


        public static String to_string(object obj)
        {
            var builder = new StringBuilder();
            to_string(ref builder, obj);
            return builder.ToString();
        }

        public static void to_string(ref StringBuilder builder, object obj)
        {
            if (obj == null)
            {
                builder.Append("null");
                return;
            }
            var name = obj.GetType().Name;
            if (name == TunmValues.STR_TYPE_STR)
            {
                builder.AppendFormat("\"{0}\"", (String)obj);
            }
            else if (name == TunmValues.STR_TYPE_RAW)
            {
                builder.AppendFormat("\"byte[]({0})\"", ((byte[])obj).Length);
            }
            else if (name == TunmValues.STR_TYPE_ARR)
            {
                var list = (ArrayList)(obj);
                var index = 0;
                builder.Append("[");
                foreach (var sub_val in list)
                {
                    to_string(ref builder, sub_val);
                    if (++index < list.Count)
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
                    to_string(ref builder, key.Key);
                    builder.Append(":");
                    to_string(ref builder, key.Value);
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
                    to_string(ref builder, key);
                    builder.Append(":");
                    to_string(ref builder, map[key]);
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

        public static bool is_string(Object obj)
        {
            if (obj == null)
            {
                return false;
            }
            if (obj.GetType().Name == STR_TYPE_STR)
            {
                return true;
            }
            return false;
        }

        public static bool is_arr(Object obj)
        {
            if (obj == null)
            {
                return false;
            }
            if (obj.GetType().Name == STR_TYPE_ARR)
            {
                return true;
            }
            return false;
        }

        public static bool is_dictionary(Object obj)
        {
            if (obj == null)
            {
                return false;
            }
            if (obj.GetType().Name == STR_TYPE_MAP)
            {
                return true;
            }
            return false;
        }

        public static bool is_long(Object obj)
        {
            if (obj == null)
            {
                return false;
            }

            switch (obj.GetType().Name)
            {
                case TunmValues.STR_TYPE_I8:
                case TunmValues.STR_TYPE_U8:
                    return true;
                case TunmValues.STR_TYPE_I16:
                    return true;
                case TunmValues.STR_TYPE_U16:
                    return true;
                case TunmValues.STR_TYPE_I32:
                    return true;
                case TunmValues.STR_TYPE_U32:
                    return true;
                case TunmValues.STR_TYPE_I64:
                    return true;
                case TunmValues.STR_TYPE_U64:
                    return true;
            }
            return false;
        }

        public static bool is_double(Object obj)
        {
            if (obj == null)
            {
                return false;
            }

            switch (obj.GetType().Name)
            {
                case TunmValues.STR_TYPE_FLOAT:
                    return true;
                case TunmValues.STR_TYPE_DOUBLE:
                    return true;
            }
            return false;
        }

        public static String get_string(Object obj)
        {
            if (is_string(obj))
            {
                return (String)(obj);
            }
            return "";
        }

        public static Dictionary<Object, Object> get_dictionary(Object obj)
        {
            if (is_dictionary(obj))
            {
                return (Dictionary<Object, Object>)(obj);
            }
            return new Dictionary<Object, Object>();
        }

        public static ArrayList get_arr(Object obj)
        {
            if (is_arr(obj))
            {
                return (ArrayList)(obj);
            }
            return new ArrayList();
        }

        public static long get_long(Object obj)
        {
            long val = 0;
            switch (obj.GetType().Name)
            {
                case TunmValues.STR_TYPE_I8:
                case TunmValues.STR_TYPE_U8:
                    val = (byte)obj;
                    break;
                case TunmValues.STR_TYPE_I16:
                    val = (short)obj;
                    break;
                case TunmValues.STR_TYPE_U16:
                    val = (ushort)obj;
                    break;
                case TunmValues.STR_TYPE_I32:
                    val = (int)obj;
                    break;
                case TunmValues.STR_TYPE_U32:
                    val = (uint)obj;
                    break;
                case TunmValues.STR_TYPE_I64:
                    val = (long)obj;
                    break;
                case TunmValues.STR_TYPE_U64:
                    val = (long)(ulong)obj;
                    break;
            }
            return val;
        }

        public static int get_int(Object obj)
        {
            return Convert.ToInt32(get_long(obj));
        }

        public static double get_double(Object obj)
        {
            double val = 0;
            switch (obj.GetType().Name)
            {
                case TunmValues.STR_TYPE_FLOAT:
                    val = (float)obj;
                    break;
                case TunmValues.STR_TYPE_DOUBLE:
                    val = (double)obj;
                    break;
            }
            return val;
        }


        public static String get_string(Object obj, String key)
        {
            var map = get_dictionary(obj);
            if (map == null)
            {
                return "";
            }
            if (map.ContainsKey(key))
            {
                return get_string(map[key]);
            }
            return "";
        }

        public static String get_string(Object obj, int index)
        {
            var arr = get_arr(obj);
            
            if (arr == null)
            {
                return "";
            }

            if (arr.Count > index)
            {
                return get_string(arr[index]);
            }
            return "";
        }
        
        public static byte[] get_bytes(Object obj,string key){
            var map = get_dictionary(obj);
            if (map == null)
            {
                return null;
            }
            if (map.ContainsKey(key))
            {
                return (byte[])(map[key]);
            }
            return new byte[0];
        }


        public static long get_long(Object obj, String key)
        {
            var map = get_dictionary(obj);
            if (map == null)
            {
                return 0;
            }
            if (map.ContainsKey(key))
            {
                return get_long(map[key]);
            }
            return 0;
        }

        public static long get_long(Object obj, int index)
        {
            var arr = get_arr(obj);
            if (arr == null)
            {
                return 0;
            }

            if (arr.Count > index)
            {
                return get_long(arr[index]);
            }
            return 0;
        }


        public static int get_int(Object obj, String key)
        {
            return Convert.ToInt32(get_long(obj, key));
        }

        public static int get_int(Object obj, int index)
        {
            return Convert.ToInt32(get_long(obj, index));
        }


        public static double get_double(Object obj, String key)
        {
            var map = get_dictionary(obj);
            if (map == null)
            {
                return 0;
            }
            if (map.ContainsKey(key))
            {
                return get_double(map[key]);
            }
            return 0;
        }

        public static double get_double(Object obj, int index)
        {
            var arr = get_arr(obj);
            if (arr == null)
            {
                return 0;
            }

            if (arr.Count > index)
            {
                return get_double(arr[index]);
            }
            return 0;
        }


        public static ArrayList get_arr(Object obj, String key)
        {
            var map = get_dictionary(obj);
            if (map == null)
            {
                return null;
            }
            if (map.ContainsKey(key))
            {
                return get_arr(map[key]);
            }
            return new ArrayList();
        }

        public static ArrayList get_arr(Object obj, int index)
        {
            var arr = get_arr(obj);
            if (arr == null)
            {
                return new ArrayList();
            }

            if (arr.Count > index)
            {
                return get_arr(arr[index]);
            }
            return new ArrayList();
        }


        public static Dictionary<Object, Object> get_dictionary(Object obj, String key)
        {
            var map = get_dictionary(obj);
            if (map == null)
            {
                return new Dictionary<Object, Object>();
            }
            if (map.ContainsKey(key))
            {
                return get_dictionary(map[key]);
            }
            return new Dictionary<Object, Object>();
        }

        public static Dictionary<Object, Object> get_dictionary(Object obj, int index)
        {
            var arr = get_arr(obj);
            if (arr == null)
            {
                return new Dictionary<Object, Object>();
            }

            if (arr.Count > index)
            {
                return get_dictionary(arr[index]);
            }
            return new Dictionary<Object, Object>();
        }
    }
}

