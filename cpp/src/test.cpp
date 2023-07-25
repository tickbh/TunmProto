#include "Proto.h"

#include <iostream>
#include <string>


void assert_write_data(tunm_cpp::Buffer& buffer, u8 test[]) {
	u32 count = 0;
	auto data = buffer.get_write_data(count);
	for (u32 i = 0; i < count; i++) {
		assert(data[i] == test[i]);
	}
}

void test_enocde_u8() {
	auto buffer = tunm_cpp::Buffer();
	auto value = tunm_cpp::Values((u8)12);
	tunm_cpp::encode_field(buffer, value);

	u8 test[] = { 2, 12 };
	assert_write_data(buffer, test);

	auto ret = tunm_cpp::decode_field(buffer);
	assert(buffer.isVaild() && ret.sub_type == tunm_cpp::TYPE_U8);
	assert(ret._u8 == 12);
	std::cout << "success test test_enocde_u8" << std::endl;
}
//
void test_encode_u16() {
	auto buffer = tunm_cpp::Buffer();
	auto value = tunm_cpp::Values((u16)0x1234);
	tunm_cpp::encode_field(buffer, tunm_cpp::Values((i16)-1));
	tunm_cpp::encode_field(buffer, tunm_cpp::Values((u16)0x1234));

	u8 test[] = { 10, 1, 10, 232, 72 };
	assert_write_data(buffer, test);

	{
		auto ret = tunm_cpp::decode_field(buffer);
		assert(buffer.isVaild() && ret.sub_type == tunm_cpp::TYPE_VARINT);
		assert(ret._i16 == -1);
	}
	{
		auto ret = tunm_cpp::decode_field(buffer);
		assert(buffer.isVaild() && ret.sub_type == tunm_cpp::TYPE_VARINT);
		assert(ret._u16 == 0x1234);
	}

	std::cout << "success test test_encode_u16" << std::endl;
}

void test_encode_u32() {
	auto buffer = tunm_cpp::Buffer();
	tunm_cpp::encode_field(buffer, tunm_cpp::Values((i32)-90));
	tunm_cpp::encode_field(buffer, tunm_cpp::Values((u32)0x12345678));

	u8 test[] = { 10, 179, 1, 10, 240, 217, 162, 163, 2 };
	assert_write_data(buffer, test);

	{
		auto ret = tunm_cpp::decode_field(buffer);
		assert(buffer.isVaild() && ret.sub_type == tunm_cpp::TYPE_VARINT);
		assert(ret._i32 == -90);
	}
	{
		auto ret = tunm_cpp::decode_field(buffer);
		assert(buffer.isVaild() && ret.sub_type == tunm_cpp::TYPE_VARINT);
		assert(ret._u32 == 0x12345678);
	}

	std::cout << "success test test_encode_u32" << std::endl;
}

void test_encode_float() {
	auto buffer = tunm_cpp::Buffer();
	auto value = tunm_cpp::Values(12345.123f);
	tunm_cpp::encode_field(buffer, value);

	u8 test[] = { 11, 198, 252, 226, 11 };
	assert_write_data(buffer, test);

	auto ret = tunm_cpp::decode_field(buffer);
	assert(buffer.isVaild() && ret.sub_type == tunm_cpp::TYPE_FLOAT);
	assert(std::fabs(ret._f - 12345.123) < 0.001);
	std::cout << "success test test_encode_float" << std::endl;
}

void test_encode_str() {
	auto buffer = tunm_cpp::Buffer();
	std::string name = "this is tunm proto, 中文测试";
	auto char_len = strlen(name.c_str());

	auto value = tunm_cpp::Values(new std::string(name));
	tunm_cpp::encode_str_raw(buffer, value);

	u8 test[] = { 64, 116, 104, 105, 115, 32, 105, 115, 32, 116, 117, 110, 109, 32, 112, 114, 111, 116, 111, 44, 32, 228, 184, 173, 230, 150, 135, 230, 181, 139, 232, 175, 149 };
	assert_write_data(buffer, test);

	auto ret = tunm_cpp::decode_str_raw(buffer, tunm_cpp::TYPE_STR);
	assert(buffer.isVaild() && ret.sub_type == tunm_cpp::TYPE_STR);
	assert(strcmp(name.c_str(), ret._str->c_str()) == 0);
	std::cout << "success test test_encode_str" << std::endl;
}

void test_encode_map() {
	auto buffer = tunm_cpp::Buffer();
	std::unordered_map<tunm_cpp::Values, tunm_cpp::Values> hash_value;
	hash_value.insert(std::make_pair(tunm_cpp::Values("name"),tunm_cpp::Values(new std::string("tickbh"))));
	hash_value.insert(std::make_pair(tunm_cpp::Values("proto"), tunm_cpp::Values(new std::string("tunm"))));
	hash_value.insert(std::make_pair(tunm_cpp::Values("index"), tunm_cpp::Values((u16)1)));

	auto value_map = tunm_cpp::Values(&hash_value);
	tunm_cpp::encode_field(buffer, value_map);

	auto ret = tunm_cpp::decode_field(buffer);
	assert(buffer.isVaild() && ret.sub_type == tunm_cpp::TYPE_MAP);
	assert(ret._map->size() == 3);

	assert(strcmp(ret._map->at(tunm_cpp::Values("name"))._str->c_str(), hash_value.at(tunm_cpp::Values("name"))._str->c_str()) == 0);
	assert(ret._map->at(tunm_cpp::Values("index"))._u16 == hash_value.at(tunm_cpp::Values("index"))._u16);
	//value_map.unfree();
	std::cout << "success test test_encode_map" << std::endl;
}

void test_encode_array_u8() {
	auto buffer = tunm_cpp::Buffer();
	std::vector<tunm_cpp::Values> u8array;
	for (int i = 0; i < 10; i++) {
		u8array.push_back(tunm_cpp::Values((u8)i));
	}
	auto array = tunm_cpp::Values(&u8array);
	tunm_cpp::encode_field(buffer, array);

	auto read = tunm_cpp::decode_field(buffer);
	assert(read.sub_type == tunm_cpp::TYPE_ARR);
	auto i = 0;
	for (auto& iter : *read._array) {
		assert(iter._u8 == (u8)i++);
	}
	array.unfree();
	std::cout << "success test test_encode_array_u8" << std::endl;
}

void test_base_proto() {

	auto buffer = tunm_cpp::Buffer();

	std::unordered_map<tunm_cpp::Values, tunm_cpp::Values>* hash_value = new std::unordered_map<tunm_cpp::Values, tunm_cpp::Values>();
	hash_value->insert(std::make_pair(tunm_cpp::Values("name"), tunm_cpp::Values(new std::string("tunm"))));
	hash_value->insert(std::make_pair(tunm_cpp::Values("sub_name"), tunm_cpp::Values(new std::string("tickdream"))));
	hash_value->insert(std::make_pair(tunm_cpp::Values("index"), tunm_cpp::Values((u16)1)));

	auto value_map = tunm_cpp::Values(hash_value);
	std::vector<tunm_cpp::Values> array;
	array.push_back(std::move(value_map));
	tunm_cpp::encode_proto(buffer, "cmd_test_op", array);

	std::string name;
	std::vector<tunm_cpp::Values> val = tunm_cpp::decode_proto(buffer, name);
	assert(buffer.isVaild());
	assert(name == "cmd_test_op");
	assert(val.size() == 1);
	assert(val.at(0)._map->size() == 3);
	assert(strcmp(val.at(0)._map->at(tunm_cpp::Values("name"))._str->c_str(), hash_value->at(tunm_cpp::Values("name"))._str->c_str()) == 0);
	assert(val.at(0)._map->at(tunm_cpp::Values("index"))._u16 == hash_value->at(tunm_cpp::Values("index"))._u16);
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