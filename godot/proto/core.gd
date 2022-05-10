
enum RT_DATA_TYPE {
	TYPE_NIL = 0,
	TYPE_BOOL = 1,
	TYPE_U8 = 2,
	TYPE_I8 = 3,
	TYPE_U16 = 4,
	TYPE_I16 = 5,
	TYPE_U32 = 6,
	TYPE_I32 = 7,
	TYPE_U64 = 8,
	TYPE_I64 = 9,
	TYPE_VARINT = 10,
	TYPE_FLOAT = 11,
	TYPE_DOUBLE = 12,
	TYPE_STR = 13,
	TYPE_STR_IDX = 14,
	TYPE_RAW = 15,
	TYPE_ARR = 16,
	TYPE_MAP = 17,
}

class PBPacker:
	static func get_type_by_ref(godot_type) -> int:
		match godot_type:
			TYPE_BOOL:
				return RT_DATA_TYPE.TYPE_BOOL
			TYPE_INT:
				return RT_DATA_TYPE.TYPE_I64
			TYPE_REAL:
				return RT_DATA_TYPE.TYPE_DOUBLE
			TYPE_STRING:
				return RT_DATA_TYPE.TYPE_STR
			TYPE_RAW_ARRAY:
				return RT_DATA_TYPE.TYPE_RAW
			TYPE_DICTIONARY:
				return RT_DATA_TYPE.TYPE_MAP
			TYPE_ARRAY:
				return RT_DATA_TYPE.TYPE_ARR
			TYPE_INT_ARRAY:
				return RT_DATA_TYPE.TYPE_ARR
			TYPE_REAL_ARRAY:
				return RT_DATA_TYPE.TYPE_ARR
			TYPE_STRING_ARRAY:
				return RT_DATA_TYPE.TYPE_ARR
		return RT_DATA_TYPE.TYPE_NIL
			
		
	static func convert_signed(n : int) -> int:
		# var b = Buffer.Buffer.new();
		if n < -2147483648:
			return (n << 1) ^ (n >> 63)
		else:
			return (n << 1) ^ (n >> 31)
			
	static func deconvert_signed(n : int) -> int:
		if n & 0x01:
			return ~(n >> 1)
		else:
			return (n >> 1)

			
	static func pack_varint(value) -> PoolByteArray:
		var varint : PoolByteArray = PoolByteArray()
		if typeof(value) == TYPE_BOOL:
			if value:
				value = 1
			else:
				value = 0
		for _i in range(9):
			var b = value & 0x7F
			value >>= 7
			if value:
				varint.append(b | 0x80)
			else:
				varint.append(b)
				break
		if varint.size() == 9 && varint[8] == 0xFF:
			varint.append(0x01)
		return varint

	static func pack_bytes(value, count : int, data_type : int) -> PoolByteArray:
		var bytes : PoolByteArray = PoolByteArray()
		if data_type == RT_DATA_TYPE.FLOAT:
			var val: int = value * 1000
			for _i in range(count):
				bytes.append(val & 0xFF)
				val >>= 8
		elif data_type == RT_DATA_TYPE.DOUBLE:
			var val: int = value * 1000000
			for _i in range(count):
				bytes.append(val & 0xFF)
				val >>= 8
		else:
			for _i in range(count):
				bytes.append(value & 0xFF)
				value >>= 8
		return bytes

	static func unpack_bytes(bytes : PoolByteArray, index : int, count : int, data_type : int):
		var value = 0
		for i in range(index + count - 1, index - 1, -1):
			value |= (bytes[i] & 0xFF)
			if i != index:
				value <<= 8

		if data_type == RT_DATA_TYPE.FLOAT:
			value = value / 1000
		elif data_type == RT_DATA_TYPE.DOUBLE:
			value = value / 1000000
		return value

	static func unpack_varint(varint_bytes) -> int:
		var value : int = 0
		for i in range(varint_bytes.size() - 1, -1, -1):
			value |= varint_bytes[i] & 0x7F
			if i != 0:
				value <<= 7
		return value

	static func encode_type(buffer: Buffer, value: int):
		buffer.write_byte(value)
		
	static func decode_type(buffer: Buffer) -> int:
		return buffer.read_byte()

	static func encode_number(buffer: Buffer, value: int, pattern: int):
		match pattern:
			RT_DATA_TYPE.TYPE_U8, RT_DATA_TYPE.TYPE_I8:
				buffer.write_byte(value & 0xFF) 
			RT_DATA_TYPE.TYPE_U16, RT_DATA_TYPE.TYPE_I16:
				buffer.write_byte(value & 0xFF)
				buffer.write_byte(value & 0xFF00)
			RT_DATA_TYPE.TYPE_U32, RT_DATA_TYPE.TYPE_I32:
				buffer.write_byte(value & 0x000000FF)
				buffer.write_byte(value & 0x0000FF00)
				buffer.write_byte(value & 0x00FF0000)
				buffer.write_byte(value & 0xFF000000)
			_:
				print("encode_number no spport type ", pattern)
				
	static func decode_number(buffer: Buffer, pattern: int):
		match pattern:
			RT_DATA_TYPE.TYPE_U8, RT_DATA_TYPE.TYPE_I8:
				return buffer.read_byte()
			RT_DATA_TYPE.TYPE_U16, RT_DATA_TYPE.TYPE_I16:
				var bytes = buffer.read_bytes(2)
				return bytes[0] + bytes[1] << 8
			RT_DATA_TYPE.TYPE_U32, RT_DATA_TYPE.TYPE_I32:
				var bytes = buffer.read_bytes(4)
				return bytes[0] + bytes[1] << 8 + bytes[2] << 16 + bytes[3] << 24
			_:
				print("decode_number no spport type ", pattern)

	static func encode_varint(buffer: Buffer, value: int):
		var real = value * 2
		if value < 0:
			real = (-(value + 1)) * 2 + 1

		while true:
			var data = (real & 0x7F)
			real = real >> 7
			if real == 0:
				buffer.write_byte(data)
				break
			else:
				buffer.write_byte(data | 0x80)

	static func decode_varint(buffer: Buffer):
		var real = 0
		var shl_num = 0

		while true:
			var data = buffer.read_byte()
			print("data = ", data)
			print("shl_num = ", shl_num)
			real += (data & 0x7F) << shl_num
			shl_num += 7
			if data & 0x80 == 0:
				break

		var is_left = real % 2 == 1
		if is_left:
			return - int(real / 2) - 1
		else:
			return int(real / 2)
				
	static func encode_str_idx(buffer: Buffer, value: String):
		var idx = buffer.add_str(value)
		encode_type(buffer, RT_DATA_TYPE.TYPE_STR_IDX)
		encode_varint(buffer, idx);
		
	static func decode_str_idx(buffer: Buffer) -> String:
		var idx = decode_varint(buffer)
		return buffer.get_str(idx)

	static func encode_str_raw(buffer: Buffer, value: String):
		encode_varint(buffer, len(value));
		var str_bytes : PoolByteArray = value.to_utf8()
		buffer.write(str_bytes)

	static func decode_str_raw(buffer: Buffer, pattern: int):
		var size = decode_varint(buffer);
		if pattern == RT_DATA_TYPE.TYPE_STR:
			var bytes = buffer.read_bytes(size)
			return bytes.get_string_from_utf8()
		else:
			var bytes = buffer.read_bytes(size)
			return bytes


	static func encode_arr(buffer: Buffer, value: Array):
		encode_varint(buffer, len(value))
		for v in value:
			encode_field(buffer, v)
			
	static func decode_arr(buffer: Buffer) -> Array:
		var size = decode_varint(buffer)
		var arr = Array()
		for _idx in range(size):
			var sub = decode_field(buffer)
			arr.append(sub)
		return arr
			
	static func encode_map(buffer: Buffer, value: Dictionary):
		encode_varint(buffer, len(value))
		for k in value.keys():
			encode_field(buffer, k)
			encode_field(buffer, value[k])
			
	static func decode_map(buffer: Buffer) -> Dictionary:
		var size = decode_varint(buffer)
		var map = Dictionary()
		for _idx in range(size):
			var key = decode_field(buffer)
			var val = decode_field(buffer)
			map[key] = val
		return map
		
	static func encode_field(buffer: Buffer, value):
		var pattern = get_type_by_ref(typeof(value))
		match pattern:
			RT_DATA_TYPE.TYPE_BOOL:
				encode_type(buffer, pattern);
				buffer.write_byte(1 if value else 0)
			RT_DATA_TYPE.TYPE_I64:
				encode_type(buffer, pattern);
				encode_varint(buffer, value);
			RT_DATA_TYPE.TYPE_DOUBLE:
				encode_type(buffer, pattern);
				encode_varint(buffer, int(value * 1000000));
			RT_DATA_TYPE.TYPE_STR:
				encode_str_idx(buffer, value)
			RT_DATA_TYPE.TYPE_RAW:
				encode_type(buffer, pattern);
				encode_str_raw(buffer, value)
			RT_DATA_TYPE.TYPE_MAP:
				encode_type(buffer, pattern);
				encode_map(buffer, value)
			RT_DATA_TYPE.TYPE_ARR:
				encode_type(buffer, pattern);
				encode_arr(buffer, value)
				
	static func decode_field(buffer: Buffer):
		var pattern = decode_type(buffer)
		match pattern:
			RT_DATA_TYPE.TYPE_BOOL:
				return true if buffer.read_byte() != 0 else false
			RT_DATA_TYPE.TYPE_U8, RT_DATA_TYPE.TYPE_I8:
				return buffer.read_byte()
			RT_DATA_TYPE.TYPE_U16, \
			RT_DATA_TYPE.TYPE_I16, RT_DATA_TYPE.TYPE_U32, RT_DATA_TYPE.TYPE_I32, \
			RT_DATA_TYPE.TYPE_U64, RT_DATA_TYPE.TYPE_I64, RT_DATA_TYPE.TYPE_VARINT:
				return decode_varint(buffer)
			RT_DATA_TYPE.TYPE_FLOAT:
				var val = decode_varint(buffer)
				return val / 1000
			RT_DATA_TYPE.TYPE_DOUBLE:
				var val = decode_varint(buffer)
				return val / 1000000
			RT_DATA_TYPE.TYPE_STR_IDX:
				var idx = decode_varint(buffer)
				return buffer.get_str(idx)
			RT_DATA_TYPE.TYPE_STR:
				return decode_str_raw(buffer, RT_DATA_TYPE.TYPE_STR)
			RT_DATA_TYPE.TYPE_MAP:
				return decode_map(buffer)
			RT_DATA_TYPE.TYPE_ARR:
				return decode_arr(buffer)

	static func encode_proto(buffer: Buffer, name: String, infos: Array):
		var sub_buffer = Buffer.new()
		encode_field(sub_buffer, infos)

		encode_str_raw(buffer, name);
		encode_varint(buffer, len(sub_buffer.str_arr))
		for v in sub_buffer.str_arr:
			encode_str_raw(buffer, v)
		
		buffer.write(sub_buffer.bytes)

			
	static func decode_proto(buffer: Buffer):
		var name = decode_str_raw(buffer, RT_DATA_TYPE.TYPE_STR);
		var str_len = decode_varint(buffer)
		for __ in range(str_len):
			var value = decode_str_raw(buffer, RT_DATA_TYPE.TYPE_STR);
			buffer.add_str(value);


		var sub_value = decode_field(buffer);
		return [name, sub_value];
