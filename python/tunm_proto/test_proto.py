from tunm_proto import ByteBuffer, TPPacker, TP_DATA_TYPE

def func(x):
    return x +1

def test_answer():
    assert func(3)==4
    
def check_buffer_data(buffer: ByteBuffer, bs):
    mbs = buffer.all_bytes()
    assert buffer.get_bytes_len() == len(bs), "length must equal"
    for i, d in enumerate(bs):
        assert int.from_bytes(mbs[i:i+1], byteorder="little") == d, "data must equal"
    
    
    
def test_encode_u8():
    buffer = ByteBuffer();

    TPPacker.encode_field(buffer, 12)
    check_buffer_data(buffer, [2, 12])
    
    number = TPPacker.decode_field(buffer)
    assert number == 12, "Number Not Match"

    
def test_encode_16():
    buffer = ByteBuffer();

    TPPacker.encode_field(buffer, -1, TP_DATA_TYPE.TYPE_I16)
    TPPacker.encode_field(buffer, 0x1234, TP_DATA_TYPE.TYPE_U16)
    check_buffer_data(buffer, [10, 1, 10, 232, 72])
    
    number = TPPacker.decode_field(buffer)
    assert number == -1, "Number Not Match"
    number = TPPacker.decode_field(buffer)
    assert number == 0x1234, "Number Not Match"

def test_encode_u32():
    buffer = ByteBuffer();

    TPPacker.encode_field(buffer, -90, TP_DATA_TYPE.TYPE_I32)
    TPPacker.encode_field(buffer, 0x12345678, TP_DATA_TYPE.TYPE_U32)
    check_buffer_data(buffer, [10, 179, 1, 10, 240, 217, 162, 163, 2])
    
    number = TPPacker.decode_field(buffer)
    assert number == -90, "Number Not Match"
    number = TPPacker.decode_field(buffer)
    assert number == 0x12345678, "Number Not Match"
    
    
def test_encode_float():
    buffer = ByteBuffer();

    TPPacker.encode_field(buffer, 12345.123, TP_DATA_TYPE.TYPE_FLOAT)
    check_buffer_data(buffer, [11, 35, 95, 188, 0])
    
    number = TPPacker.decode_field(buffer)
    assert number == 12345.123, "Number Not Match"
    
    
def test_encode_str():
    buffer = ByteBuffer();

    name = "this is tunm proto, 中文测试";
    TPPacker.encode_str_raw(buffer, name, TP_DATA_TYPE.TYPE_STR);
    
    check_buffer_data(buffer, [64, 116, 104, 105, 115, 32, 105, 115, 32, 116, 117, 110, 109, 32, 112, 114, 111, 116, 111, 44, 32, 228, 184, 173, 230, 150, 135, 230, 181, 139, 232, 175, 149])
    
    read = TPPacker.decode_str_raw(buffer, TP_DATA_TYPE.TYPE_STR)
    assert read == name, "str Not Match"
    
def test_encode_map():
    buffer = ByteBuffer();

    hash_value = {
        "name": "tickbh",
        "proto": "tunm",
        "index": 1,
    }
    TPPacker.encode_field(buffer, hash_value)
    read = TPPacker.decode_field(buffer)
    assert read == hash_value, "map Not Match"
    
    
def test_encode_array():
    buffer = ByteBuffer();
    array = []
    
    for i in range(10):
        array.append(i);
    TPPacker.encode_field(buffer, array)
    read = TPPacker.decode_field(buffer)
    assert read == array, "array Not Match"
    
def test_base_proto():
    buffer = ByteBuffer();
    array = []
    
    hash_value = {
        "name": "tickbh",
        "proto": "tunm",
        "index": 1,
    }
    
    TPPacker.encode_proto(buffer, "cmd_test_op", [hash_value])
    name, read = TPPacker.decode_proto(buffer)
    assert name == "cmd_test_op", "array Not Match"
    assert read == [hash_value], "array Not Match"
    