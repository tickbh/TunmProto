#ifndef _TUNM_CPP_VALUES_H_
#define _TUNM_CPP_VALUES_H_
#include "TDMacro.h"

#include <string>
#include <vector>
#include <map>

namespace tunm_cpp {

	static const u8 TYPE_NIL = 0;
	static const u8 TYPE_BOOL = 1;
	static const u8 TYPE_U8 = 2;
	static const u8 TYPE_I8 = 3;
	static const u8 TYPE_U16 = 4;
	static const u8 TYPE_I16 = 5;
	static const u8 TYPE_U32 = 6;
	static const u8 TYPE_I32 = 7;
	static const u8 TYPE_U64 = 8;
	static const u8 TYPE_I64 = 9;
	static const u8 TYPE_VARINT = 10;
	static const u8 TYPE_FLOAT = 11;
	static const u8 TYPE_DOUBLE = 12;
	static const u8 TYPE_STR = 13;
	static const u8 TYPE_STR_IDX = 14;
	static const u8 TYPE_RAW = 15;
	static const u8 TYPE_ARR = 16;
	static const u8 TYPE_MAP = 17;

	static const char* STR_TYPE_NIL = "nil";
	static const char* TYPE_BOOL = "bool";
	static const char* STR_TYPE_U8 = "u8";
	static const char* STR_TYPE_I8 = "i8";
	static const char* STR_TYPE_U16 = "u16";
	static const char* STR_TYPE_I16 = "i16";
	static const char* STR_TYPE_U32 = "u32";
	static const char* STR_TYPE_I32 = "i32";
	static const char* STR_TYPE_U64 = "u64";
	static const char* STR_TYPE_I64 = "i64";
	static const char* STR_TYPE_VARINT = "varint";
	static const char* STR_TYPE_FLOAT = "float";
	static const char* STR_TYPE_DOUBLE = "double";
	static const char* STR_TYPE_STR = "str";
	static const char* STR_TYPE_STR_IDX = "str_idx";
	static const char* STR_TYPE_RAW = "raw";
	static const char* STR_TYPE_ARR = "arr";
	static const char* STR_TYPE_MAP = "map";

	struct cmp_str
	{
		bool operator()(char const *a, char const *b) const
		{
			return strcmp(a, b) < 0;
		}
	};

	static std::map<const char*, u8, cmp_str> HASH_STR_INT = {
		{ STR_TYPE_NIL, TYPE_NIL },
		{ STR_TYPE_BOOL, TYPE_BOOL },
		{ STR_TYPE_U8, TYPE_U8 },
		{ STR_TYPE_I8, TYPE_I8 },
		{ STR_TYPE_U16, TYPE_U16 },
		{ STR_TYPE_I16, TYPE_I16 },
		{ STR_TYPE_U32, TYPE_U32 },
		{ STR_TYPE_I32, TYPE_I32 },
		{ STR_TYPE_U64, TYPE_U64 },
		{ STR_TYPE_I64, TYPE_I64 },
		{ STR_TYPE_VARINT, TYPE_VARINT },
		{ STR_TYPE_FLOAT, TYPE_FLOAT },
		{ STR_TYPE_DOUBLE, TYPE_DOUBLE },
		{ STR_TYPE_STR, TYPE_STR },
		{ STR_TYPE_STR_IDX, TYPE_STR_IDX },
		{ STR_TYPE_RAW, TYPE_RAW },
		{ STR_TYPE_ARR, TYPE_ARR },
		{ STR_TYPE_MAP, TYPE_MAP },
	};

	static std::map<u16, const char*> HASH_INT_STR;

	static u16 get_type_by_name(const char* name) {
		auto iter = HASH_STR_INT.find(name);
		if (iter == HASH_STR_INT.end()) {
			return 0;
		}
		return iter->second;
	}

	static const char* get_name_by_type(u16 index) {
		if (HASH_INT_STR.empty()) {
			for (auto iter : HASH_STR_INT)
			{
				HASH_INT_STR.insert(std::make_pair(iter.second, iter.first));
			}
		}
		auto iter = HASH_INT_STR.find(index);
		if (iter == HASH_INT_STR.end()) {
			return STR_TYPE_NIL;
		}
		return iter->second;
	}

	class Values
	{
	public:
		bool own;
		u8 sub_type;
		union {
			bool _b;
			u8 _u8;
			i8 _i8;
			u16 _u16;
			i16 _i16;
			u32 _u32;
			i32 _i32;
			u64 _u64;
			i64 _i64;
			i64 _varint;
			float _f;
			double _d;
			std::string* _str;
			std::vector<char>* _raw;
			std::map<Values, Values>* _map;
			std::vector<Values>* _array;
		};

		explicit Values() : sub_type(TYPE_NIL), _u8(0) {

		}
		explicit Values(bool _b) : sub_type(TYPE_BOOL), _b(_b) {
		}
		explicit Values(u8 _u8) : sub_type(TYPE_U8), _u8(_u8) {
		}
		explicit Values(i8 _i8) : sub_type(TYPE_I8), _i8(_i8) {
		}
		explicit Values(u16 _u16) : sub_type(TYPE_U16), _u16(_u16) {
		}
		explicit Values(i16 _i16) : sub_type(TYPE_I16), _i16(_i16) {
		}
		explicit Values(u32 _u32) : sub_type(TYPE_U32), _u32(_u32) {
		}
		explicit Values(i32 _i32) : sub_type(TYPE_I32), _i32(_i32) {
		}
		explicit Values(float _f) : sub_type(TYPE_FLOAT), _f(_f) {
		}
		explicit Values(std::string* _str, bool own = true) : sub_type(TYPE_STR), _str(_str), own(own) {
		}
		explicit Values(std::vector<char>* _raw, bool own = true) : sub_type(TYPE_RAW), _raw(_raw), own(own) {
		}
		explicit Values(std::map<Values, Values>* _map, bool own = true) : sub_type(TYPE_MAP), _map(_map), own(own) {
		}
		explicit Values(std::vector<Values>* arrays, bool own = true) : sub_type(TYPE_ARR), own(own) {
			_array =arrays;
		}

		Values(Values& value) {
			this->own = false;
		}
		~Values() {
			free();
		}

		void move(Values& other)
		{
			free();
			this->sub_type = other.sub_type;
			this->own = other.own;
			switch (other.sub_type)
			{
			case TYPE_U8:
				this->_u8 = other._u8;
				break;
			case TYPE_I8:
				this->_i8 = other._i8;
				break;
			case TYPE_U16:
				this->_u16 = other._u16;
				break;
			case TYPE_I16:
				this->_i16 = other._i16;
				break;
			case TYPE_U32:
				this->_u32 = other._u32;
				break;
			case TYPE_I32:
				this->_i32 = other._i32;
			case TYPE_U64:
				this->_u64 = other._u64;
				break;
			case TYPE_I64:
				this->_i64 = other._i64;
				break;
			case TYPE_VARINT:
				this->_varint = other._varint;
				break;
			case TYPE_FLOAT:
				this->_f = other._f;
				break;
			case TYPE_DOUBLE:
				this->_d = other._d;
				break;
			case TYPE_STR:
				this->_str = other._str;
				break;
			case TYPE_STR_IDX:
				this->_varint = other._varint;
				break;
			case TYPE_RAW:
				this->_raw = other._raw;
				break;
			case TYPE_MAP:
				this->_map = other._map;
				break;
			case TYPE_ARR:
				this->_array = other._array;
				break;
			default:
				break;
			}
			other.sub_type = TYPE_NIL;
		}

		Values(Values&& other) : sub_type(0)
		{
			move(other);
		}
		Values& operator= (Values&& other) {
			move(other);
			return *this;
		}

		i64 get_num() const {
			switch (this->sub_type)
			{
			case TYPE_U8:
				return this->_u8;
			case TYPE_I8:
				return this->_i8;
			case TYPE_U16:
				return this->_u16;
			case TYPE_I16:
				return this->_i16;
			case TYPE_U32:
				return this->_u32;
			case TYPE_I32:
				return this->_i32;
			case TYPE_U64:
				return this->_u64;
			case TYPE_I64:
				return this->_i64;
			case TYPE_VARINT:
				return this->_varint;
			case TYPE_FLOAT:
				return this->_f * 1000;
			case TYPE_DOUBLE:
				return this->_d * 1000000;
			default:
				std::terminate();
			}
		}

		void free() {
			if (!this->own) {
				return;
			}
			switch (this->sub_type)
			{
			case TYPE_STR:
				delete _str;
				break;
			case TYPE_RAW:
				delete _raw;
				break;
			case TYPE_MAP:
				delete _map;
				break;
			case TYPE_ARR:
				delete _array;
				break;
			default:
				break;
			}
			this->sub_type = TYPE_NIL;
		}

		//当指针引用的栈变量的时候，我们不能析构这个指针
		void unfree() {
			this->sub_type = TYPE_NIL;
		}
	};

}
#endif