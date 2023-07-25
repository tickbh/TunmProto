#include "Proto.h"

#include <iostream>
#include <string>

void test_head_field(tunm_cpp::Buffer& buffer, u16 index, u16 t) {
	u8 data[2] = { 0, 0 };
	buffer.read(data, 2);
	assert(buffer.isVaild());
	auto val = tunm_cpp::ByteGetValue<u16>((char *)data);
	assert(val == index);

	buffer.read(data, 2);
	assert(buffer.isVaild());
	auto val_t = tunm_cpp::ByteGetValue<u16>((char *)data);
	assert(val_t == t);
}

void test_enocde_u8() {
	auto buffer = tunm_cpp::Buffer();
	auto value = tunm_cpp::Values((u8)1);
	tunm_cpp::encode_field(buffer, value);
	tunm_cpp::encode_field(buffer, value);

	test_head_field(buffer, 0, tunm_cpp::TYPE_U8);
	u8 data[1] = { 0 };
	buffer.read(data, 1);
	assert(data[0] == 1);

	auto ret = tunm_cpp::decode_field(buffer, config);
	assert(buffer.isVaild() && ret.sub_type == tunm_cpp::TYPE_U8);
	assert(ret._u8 == 1);
	std::cout << "success test test_enocde_u8" << std::endl;
}

void test_encode_u16() {
	auto config = tunm_cpp::Config();
	auto buffer = tunm_cpp::Buffer();
	auto value = tunm_cpp::Values((u16)0x1234);
	tunm_cpp::encode_field(buffer, config, value);
	tunm_cpp::encode_field(buffer, config, value);
	test_head_field(buffer, 0, tunm_cpp::TYPE_U16);
	u8 data[2] = { 0, 0 };
	buffer.read(data, 2);
	assert(buffer.isVaild());
	assert(data[0] == 0x34);
	assert(data[1] == 0x12);

	auto ret = tunm_cpp::decode_field(buffer, config);
	assert(buffer.isVaild() && ret.sub_type == tunm_cpp::TYPE_U16);
	assert(ret._u16 == 0x1234);
	std::cout << "success test test_encode_u16" << std::endl;
}

void test_encode_u32() {
	auto config = tunm_cpp::Config();
	auto buffer = tunm_cpp::Buffer();
	auto value = tunm_cpp::Values((u32)0x12345678);
	tunm_cpp::encode_field(buffer, config, value);
	tunm_cpp::encode_field(buffer, config, value);
	test_head_field(buffer, 0, tunm_cpp::TYPE_U32);
	u8 data[4] = { 0, 0, 0, 0 };
	buffer.read(data, 4);
	assert(buffer.isVaild());
	assert(data[0] == 0x78);
	assert(data[1] == 0x56);
	assert(data[2] == 0x34);
	assert(data[3] == 0x12);

	auto ret = tunm_cpp::decode_field(buffer, config);
	assert(buffer.isVaild() && ret.sub_type == tunm_cpp::TYPE_U32);
	assert(ret._u32 == 0x12345678);
	std::cout << "success test test_encode_u32" << std::endl;
}

void test_encode_float() {
	auto config = tunm_cpp::Config();
	auto buffer = tunm_cpp::Buffer();
	auto value = tunm_cpp::Values(12345.123f);
	tunm_cpp::encode_field(buffer, config, value);
	tunm_cpp::encode_field(buffer, config, value);
	test_head_field(buffer, 0, tunm_cpp::TYPE_FLOAT);
	u8 data[4] = { 0, 0, 0, 0 };
	buffer.read(data, 4);
	assert(buffer.isVaild());
	auto val = tunm_cpp::ByteGetValue<u32>((char *)data);
	auto val_f = val / 1000.0;
	assert(std::fabs(val_f - 12345.123) < 0.001);

	auto ret = tunm_cpp::decode_field(buffer, config);
	assert(buffer.isVaild() && ret.sub_type == tunm_cpp::TYPE_FLOAT);
	assert(std::fabs(ret._f - 12345.123) < 0.001);
	std::cout << "success test test_encode_float" << std::endl;
}

void test_encode_str() {
	auto config = tunm_cpp::Config();
	auto buffer = tunm_cpp::Buffer();
	const char* name = "I'm a chinese people";
	auto char_len = strlen(name);

	auto value = tunm_cpp::Values(new std::string(name));
	tunm_cpp::encode_field(buffer, config, value);
	tunm_cpp::encode_field(buffer, config, value);
	test_head_field(buffer, 0, tunm_cpp::TYPE_STR);

	auto len = tunm_cpp::decode_number(buffer, tunm_cpp::TYPE_U16);
	assert(len._u16 == char_len);
	u8* data = new u8[char_len + 1];
	buffer.read(data, char_len);
	data[char_len] = '\0';
	assert(strcmp(name, (char*)data) == 0);

	auto ret = tunm_cpp::decode_field(buffer, config);
	assert(buffer.isVaild() && ret.sub_type == tunm_cpp::TYPE_STR);
	assert(strcmp(name, ret._str->c_str()) == 0);
	std::cout << "success test test_encode_str" << std::endl;
}

void test_encode_map() {
	std::map<std::string, tunm_cpp::Field> fields = {
		{ "name", tunm_cpp::Field(1, "string") },
		{ "index", tunm_cpp::Field(2, "u16") },
	};
	std::map<std::string, tunm_cpp::Proto> protos;
	auto config = tunm_cpp::Config(fields, protos);
	auto buffer = tunm_cpp::Buffer();
	std::map<std::string, tunm_cpp::Values> hash_value;
	hash_value.insert(std::make_pair("name",tunm_cpp::Values(new std::string("I'm a chinese people"))));
	hash_value.insert(std::make_pair("sub_name", tunm_cpp::Values(new std::string("tickdream"))));
	hash_value.insert(std::make_pair("index", tunm_cpp::Values((u16)1)));

	auto value_map = tunm_cpp::Values(&hash_value);
	tunm_cpp::encode_field(buffer, config, value_map);

	auto ret = tunm_cpp::decode_field(buffer, config);
	assert(buffer.isVaild() && ret.sub_type == tunm_cpp::TYPE_MAP);
	assert(ret._map->size() == 2);
	assert(strcmp(ret._map->at("name")._str->c_str(), hash_value.at("name")._str->c_str()) == 0);
	assert(ret._map->at("index")._u16 == hash_value.at("index")._u16);
	value_map.unfree();
	std::cout << "success test test_encode_map" << std::endl;
}

void test_encode_array_u8() {
	auto config = tunm_cpp::Config();
	auto buffer = tunm_cpp::Buffer();
	std::vector<tunm_cpp::Values> u8array;
	for (int i = 0; i < 10; i++) {
		u8array.push_back(tunm_cpp::Values((u8)i));
	}
	auto array = tunm_cpp::Values(&u8array, tunm_cpp::TYPE_AU8);
	tunm_cpp::encode_field(buffer, config, array);

	auto read = tunm_cpp::decode_field(buffer, config);
	assert(read.sub_type == tunm_cpp::TYPE_AU8);
	auto i = 0;
	for (auto& iter : *read._array) {
		assert(iter._u8 == (u8)i++);
	}
	array.unfree();
	std::cout << "success test test_encode_array_u8" << std::endl;
}

void test_base_proto() {
	std::map<std::string, tunm_cpp::Field> fields = {
		{ "name", tunm_cpp::Field(1, "string") },
		{ "index", tunm_cpp::Field(2, "u16") },
	};
	std::map<std::string, tunm_cpp::Proto> protos = {
		{ "cmd_test_op", tunm_cpp::Proto("server", { "map" }) },
	};
	auto config = tunm_cpp::Config(fields, protos);
	auto buffer = tunm_cpp::Buffer();

	std::map<std::string, tunm_cpp::Values>* hash_value = new std::map<std::string, tunm_cpp::Values>();
	hash_value->insert(std::make_pair("name", tunm_cpp::Values(new std::string("I'm a chinese people"))));
	hash_value->insert(std::make_pair("sub_name", tunm_cpp::Values(new std::string("tickdream"))));
	hash_value->insert(std::make_pair("index", tunm_cpp::Values((u16)1)));

	auto value_map = tunm_cpp::Values(hash_value);
	std::vector<tunm_cpp::Values> array;
	array.push_back(std::move(value_map));
	tunm_cpp::encode_proto(buffer, config, "cmd_test_op", array);

	std::vector<tunm_cpp::Values> val;
	auto ret = tunm_cpp::decode_proto(buffer, config, val);
	assert(buffer.isVaild());
	assert(ret == "cmd_test_op");
	assert(val.size() == 1);
	assert(val.at(0)._map->size() == 2);
	assert(strcmp(val.at(0)._map->at("name")._str->c_str(), hash_value->at("name")._str->c_str()) == 0);
	assert(val.at(0)._map->at("index")._u16 == hash_value->at("index")._u16);
	std::cout << "success test test_base_proto" << std::endl;
}

int main(int argc, char *argv[]) {

	std::cout << "------ start test proto cpp ------" << std::endl;

	test_enocde_u8();
	test_encode_u16();
	test_encode_u32();
	test_encode_float();
	test_encode_str();
	test_encode_map();
	test_encode_array_u8();
	test_base_proto();


	std::cout << "------ success test proto cpp ------" << std::endl;
}