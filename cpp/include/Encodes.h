#ifndef _TUNM_CPP_ENCODE_H_
#define _TUNM_CPP_ENCODE_H_
#include "Buffer.h"
#include "Values.h"
namespace tunm_cpp {

	static bool encode_field(Buffer& buffer, const Values& value);

	static bool encode_sure_type(Buffer& buffer, u8 type) {
		buffer.write<u8>(type);
		return true;
	}

	static bool encode_type(Buffer& buffer, const Values& value) {
		buffer.write<u8>(value.sub_type);
		return true;
	}

	static bool encode_bool(Buffer& buffer, const Values& value) {
		switch (value.sub_type)
		{
		case TYPE_BOOL:
			buffer.write<u8>(value._b ? 1 : 0);
			break;
		default:
			std::terminate();
			break;
		}
		buffer.write<u8>(value.sub_type);
		return true;
	}

	static bool encode_number(Buffer& buffer, const Values& value) {
		switch (value.sub_type)
		{
		case TYPE_U8:
			buffer.write<u8>(value._u8);
			break;
		case TYPE_I8:
			buffer.write<i8>(value._i8);
			break;
		case TYPE_U16:
			buffer.write<u16>(value._u16);
			break;
		case TYPE_I16:
			buffer.write<i16>(value._i16);
			break;
		case TYPE_U32:
			buffer.write<u32>(value._u32);
			break;
		case TYPE_I32:
			buffer.write<i32>(value._i32);
			break;
		case TYPE_FLOAT: {
			auto v = (i32)(value._f * 1000);
			buffer.write<i32>(v);
		}
			break;
		default:
			std::terminate();
		}
		return true;
	}

	static bool encode_varint(Buffer& buffer, const Values& value) {
		i64 number = value.get_num();
		u64 real = 0;
		if (number < 0) {
			real = (-(number + 1) * 2) + 1;
		} else {
			real = number * 2;
		}
		while (true) {
			u8 data = (real & 0x7F);
			real = real >> 7;
			if (real == 0) {
				buffer.write<u8>(data);
				break;
			} else {
				buffer.write<u8>(data | 0x80);
			}
		}
		return true;
	}

	//static bool encode_number(Buffer& buffer, const Values&& value) {
	//	Values newValue = std::move(value);
	//	return encode_number(buffer, newValue);
	//}


	static bool write_str_field(Buffer& buffer, const char* pattern) {
		encode_number(buffer, Values((u16)0));
		encode_number(buffer, Values((u16)get_type_by_name(pattern)));
		return true;
	}

	static bool encode_str_idx(Buffer& buffer, const std::string& str) {
		u16 idx = buffer.add_str(str);
		encode_sure_type(buffer, TYPE_STR_IDX);
		encode_varint(buffer, Values(idx));
		return true;
	}

	static bool encode_str_raw(Buffer& buffer, const Values& value) {
		switch (value.sub_type)
		{
		case TYPE_STR:
			encode_varint(buffer, Values((u16)value._str->size()));
			buffer.append(value._str->c_str(), value._str->size());
			break;
		case TYPE_RAW:
			encode_varint(buffer, Values((u16)value._raw->size()));
			buffer.append(&value._raw[0], value._raw->size());
			break;
		default:
			std::terminate();
		}
		return true;
	}

	//static bool encode_str_raw(Buffer& buffer, const Values&& value) {
	//	Values newValue = std::move(value);
	//	return encode_str_raw(buffer, newValue);
	//}

	static bool encode_map(Buffer& buffer, const Values& value) {
		switch (value.sub_type) {
		case TYPE_MAP: {

			encode_varint(buffer, Values((u16)(value._map->size())));
			for (auto& iter : *value._map) {
				const Values* key = &iter.first;
				encode_field(buffer, iter.first);
				encode_field(buffer, iter.second);
			}
		}
			break;
		default:
			std::terminate();
		}
		return true;
	}

	static bool encode_field(Buffer& buffer, const Values& value) {
		switch (value.sub_type)
		{
			case TYPE_BOOL: {
				encode_type(buffer, value);
				encode_bool(buffer, value);
			}break;

			case TYPE_U8:
			case TYPE_I8:
			{
				encode_type(buffer, value);
				encode_number(buffer, value);
			}break;
			case TYPE_U16:
			case TYPE_I16:
			case TYPE_U32:
			case TYPE_I32:
			case TYPE_U64:
			case TYPE_I64:
			case TYPE_VARINT: {
				encode_sure_type(buffer, TYPE_VARINT);
				encode_varint(buffer, value);
			}
							break;
			case TYPE_FLOAT: {
				encode_sure_type(buffer, TYPE_FLOAT);
				encode_varint(buffer, value);
			}
						   break;
			case TYPE_DOUBLE: {
				encode_sure_type(buffer, TYPE_DOUBLE);
				encode_varint(buffer, value);
			}
							break;
			case TYPE_STR: {
				encode_str_idx(buffer, *value._str);
			}
						 break;
			case TYPE_RAW:
				encode_type(buffer, value);
				encode_str_raw(buffer, value);
				break;
			case TYPE_MAP:
				encode_type(buffer, value);
				encode_map(buffer, value);
				break;
			case TYPE_ARR: {
				encode_type(buffer, value);
				encode_varint(buffer, Values((u16)value._array->size()));
				for(auto& v : *value._array) {
					encode_field(buffer, v);
				}
				break;
			default:
				encode_sure_type(buffer, TYPE_NIL);
				break;
			}
		}
		return true;
	}


	static bool encode_proto(Buffer& buffer, std::string name, std::vector<Values>& infos) {
		auto sub_buffer = Buffer();
		auto array_value = Values(&infos, false);
		encode_field(sub_buffer, array_value);
		encode_str_raw(buffer, Values(&name, false));
		encode_varint(buffer, Values((u16)sub_buffer.str_arr.size()));
		for (auto& iter : sub_buffer.str_arr) {
			encode_str_raw(buffer, Values(&iter, false));
		}
		buffer.extend(sub_buffer);
		return true;
	}

}

#endif