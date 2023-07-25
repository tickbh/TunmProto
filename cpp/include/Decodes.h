#ifndef _TUNM_CPP_DECODE_H_
#define _TUNM_CPP_DECODE_H_

#include "Values.h"

namespace tunm_cpp {

#define CHECK_RETURN_BUFFER_VAILD(value) if (!buffer.isVaild()) { \
	return value; \
}

#define CHECK_BREAK_BUFFER_VAILD() if (!buffer.isVaild()) { \
	break; \
}

	static Values decode_field(Buffer& buffer);

	static Values decode_varint(Buffer& buffer) {
		u64 real = 0;
		int shl_num = 0;
		while (true) {
			CHECK_BREAK_BUFFER_VAILD();
			auto data = buffer.read<u8>();
			u64 read = data & 0x7F;
			real += read << shl_num;
			shl_num += 7;
			if ((data & 0x80) == 0) {
				break;
			}
		}
		bool is_neg = real % 2 == 1;
		if (is_neg) {
			return Values(-(real / 2) - 1, true);
		} else {
			return Values(real / 2, true);
		}
	}

	static Values decode_type(Buffer& buffer) {
		CHECK_RETURN_BUFFER_VAILD(Values());
		return Values(buffer.read<u8>());
	}


	static Values decode_bool(Buffer& buffer) {
		CHECK_RETURN_BUFFER_VAILD(Values());
		return Values(buffer.read<u8>() == 1 ? true : false);
	}

	static Values decode_number(Buffer& buffer, u16 pattern) {
		CHECK_RETURN_BUFFER_VAILD(Values());
		switch (pattern)
		{
		case TYPE_U8:
			return Values(buffer.read<u8>());
		case TYPE_I8:
			return Values(buffer.read<i8>());
		case TYPE_U16:
			return Values(buffer.read<u16>());
		case TYPE_I16:
			return Values(buffer.read<i16>());
		case TYPE_U32:
			return Values(buffer.read<u32>());
		case TYPE_I32:
			return Values(buffer.read<i32>());
		case TYPE_U64:
			return Values(buffer.read<u64>());
		case TYPE_I64:
			return Values(buffer.read<i64>());
		case TYPE_FLOAT: {
			float value = (float)(decode_varint(buffer)._varint / 1000.0);
			return Values(value);
		}
		case TYPE_DOUBLE: {
			double value = (double)(decode_varint(buffer)._varint / 1000000.0);
			return Values(value);
		}
		case TYPE_VARINT: {
			return decode_varint(buffer);
		}
		default:
			std::terminate();
			break;
		}
		return Values();
	}

	static Values decode_str_raw(Buffer& buffer, u16 pattern) {
		CHECK_RETURN_BUFFER_VAILD(Values());
		switch (pattern)
		{
		case TYPE_STR: {
			u16 len = decode_varint(buffer)._varint;
			if( len == 0 ) {
				return Values(new std::string());
			}
			
			u8* value = new u8[len];
			buffer.read(value, len);
			std::string* str = new std::string((const char*)value, len);
			delete[] value;
			return Values(str);
		}
		case TYPE_RAW: {
			u16 len = decode_varint(buffer)._varint;
			if (len == 0) {
				return Values(new std::vector<char>());
			}

			auto vecs = new std::vector<char>(len);
			auto &vecsRef = *vecs;
			u8* value = new u8[len];
			buffer.read(value, len);
			memcpy(&vecsRef[0], value, len);
			return Values(vecs);
		}
		default:
			std::terminate();
			break;
		}
		return Values();
	}

	static Values decode_map(Buffer& buffer) {
		CHECK_RETURN_BUFFER_VAILD(Values());
		auto map = new std::unordered_map<Values, Values>();
		auto len = decode_varint(buffer)._varint;
		for (auto i = 0; i < len; i++) {
			auto key = decode_field(buffer);
			auto sub_value = decode_field(buffer);
			CHECK_RETURN_BUFFER_VAILD(Values(map));
			map->insert(std::make_pair(std::move(key), std::move(sub_value)));
		}
		return Values(map);
	}

	static Values decode_arrays(Buffer& buffer) {
		CHECK_RETURN_BUFFER_VAILD(Values());
		auto vec = new std::vector<Values>();
		auto len = decode_varint(buffer)._varint;
		for (auto i = 0; i < len; i++) {
			auto val = decode_field(buffer);
			CHECK_RETURN_BUFFER_VAILD(Values(vec));
			vec->push_back(std::move(val));
		}
		return Values(vec);
	}

	static Values decode_by_pattern(Buffer& buffer, u8 pattern) {
		CHECK_RETURN_BUFFER_VAILD(Values());
		switch (pattern)
		{
		case TYPE_BOOL:
			return decode_bool(buffer);
		case TYPE_U8:
		case TYPE_I8:
		case TYPE_U16:
		case TYPE_I16:
		case TYPE_U32:
		case TYPE_I32:
		case TYPE_U64:
		case TYPE_I64:
		case TYPE_FLOAT:
		case TYPE_DOUBLE:
		case TYPE_VARINT:
			return decode_number(buffer, pattern);
		case TYPE_STR_IDX: {
			u16 idx = (u16)decode_varint(buffer)._varint;
			if (buffer.get_str(idx)) {
				return Values(buffer.cacheStr);
			}
			return  Values();
		}
		case TYPE_STR:
		case TYPE_RAW:
			return decode_str_raw(buffer, pattern);
		case TYPE_MAP:
			return decode_map(buffer);
		case TYPE_ARR:
			return decode_arrays(buffer);
		default:
			std::terminate();
		}
	}

	static Values decode_field(Buffer& buffer) {
		CHECK_RETURN_BUFFER_VAILD(Values());
		auto val = decode_type(buffer);
		if (val.sub_type == TYPE_NIL) {
			return Values();
		}
		return decode_by_pattern(buffer, val._u8);
	}

	static std::vector<Values> decode_proto(Buffer& buffer, std::string& name) {
		auto name_value = decode_str_raw(buffer, TYPE_STR);
		auto len = decode_varint(buffer)._varint;
		for (auto i = 0; i < len; i++) {
			auto value = decode_str_raw(buffer, TYPE_STR);
			buffer.add_str(*value._str);
		}
		name = *name_value._str;
		auto sub_value = decode_field(buffer);
		if (sub_value.sub_type == TYPE_ARR) {
			//return *sub_value._array;
		}
		return std::vector<Values>();

	}

}
#endif