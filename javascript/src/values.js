
var TYPE_STEP = 20;

var TYPE_NIL = 0;
var TYPE_BOOL = 1;
var TYPE_U8 = 2;
var TYPE_I8 = 3;
var TYPE_U16 = 4;
var TYPE_I16 = 5;
var TYPE_U32 = 6;
var TYPE_I32 = 7;
var TYPE_U64 = 8;
var TYPE_I64 = 9;
var TYPE_VARINT = 10;
var TYPE_FLOAT = 11;
var TYPE_DOUBLE = 12;
var TYPE_STR = 13;
var TYPE_STR_IDX = 14;
var TYPE_RAW = 15;
var TYPE_ARR = 16;
var TYPE_MAP = 17;

var STR_TYPE_NIL = "nil";
var STR_TYPE_BOOL = "bool";
var STR_TYPE_U8 = "u8";
var STR_TYPE_I8 = "i8";
var STR_TYPE_U16 = "u16";
var STR_TYPE_I16 = "i16";
var STR_TYPE_U32 = "u32";
var STR_TYPE_I32 = "i32";
var STR_TYPE_U64 = "u64";
var STR_TYPE_I64 = "i64";
var STR_TYPE_VARINT = "varint";
var STR_TYPE_FLOAT = "float";
var STR_TYPE_DOUBLE = "double";
var STR_TYPE_STR = "str";
var STR_TYPE_STR_IDX = "str_idx";
var STR_TYPE_RAW = "raw";
var STR_TYPE_ARR = "arr";
var STR_TYPE_MAP = "map";

function get_type_by_name(name) {
    switch(name) {
        case STR_TYPE_NIL: return TYPE_NIL;
        case STR_TYPE_BOOL: return TYPE_BOOL;
        case STR_TYPE_U8: return TYPE_U8;
        case STR_TYPE_I8: return TYPE_I8;
        case STR_TYPE_U16: return TYPE_U16;
        case STR_TYPE_I16: return TYPE_I16;
        case STR_TYPE_U32: return TYPE_U32;
        case STR_TYPE_I32: return TYPE_I32;
        case STR_TYPE_U64: return TYPE_U64;
        case STR_TYPE_I64: return TYPE_I64;
        case STR_TYPE_VARINT: return TYPE_VARINT;
        case STR_TYPE_FLOAT: return TYPE_FLOAT;
        case STR_TYPE_DOUBLE: return TYPE_DOUBLE;
        case STR_TYPE_STR: return TYPE_STR;
        case STR_TYPE_STR_IDX: return TYPE_STR_IDX;
        case STR_TYPE_RAW: return TYPE_RAW;
        case STR_TYPE_ARR: return TYPE_ARR;
        case STR_TYPE_MAP: return TYPE_MAP;
        default: return TYPE_NIL;
    }
}

function get_name_by_type(index) {
    switch(index) {
        case TYPE_NIL: return STR_TYPE_NIL;
        case TYPE_BOOL: return STR_TYPE_BOOL;
        case TYPE_U8: return STR_TYPE_U8;
        case TYPE_I8: return STR_TYPE_I8;
        case TYPE_U16: return STR_TYPE_U16;
        case TYPE_I16: return STR_TYPE_I16;
        case TYPE_U32: return STR_TYPE_U32;
        case TYPE_I32: return STR_TYPE_I32;
        case TYPE_U64: return STR_TYPE_U64;
        case TYPE_I64: return STR_TYPE_I64;
        case TYPE_VARINT: return STR_TYPE_VARINT;
        case TYPE_FLOAT: return STR_TYPE_FLOAT;
        case TYPE_DOUBLE: return STR_TYPE_DOUBLE;
        case TYPE_STR: return STR_TYPE_STR;
        case TYPE_STR_IDX: return STR_TYPE_STR_IDX;
        case TYPE_RAW: return STR_TYPE_RAW;
        case TYPE_ARR: return STR_TYPE_ARR;
        case TYPE_MAP: return STR_TYPE_MAP;
        default: return STR_TYPE_NIL;
    }
}

