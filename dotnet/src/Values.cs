using System;

namespace proto.tunm {

    class TunmValues {
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
        public const string STR_TYPE_ARR = "List`1";
        public const string STR_TYPE_MAP = "Dictionary`2";

        static public byte get_type_by_value(ref Object obj) {
            if(obj == null) {
                return TYPE_NIL;
            }
            return get_type_by_name(obj.GetType().Name);
        }

        static public byte get_type_by_name(string name) {
            switch(name) {
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
        
        static public string get_name_by_type(byte index) {
            switch(index) {
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
        
    }
}

