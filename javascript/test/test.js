var rt = new RtProto()

function test_manual_field(buffer, index, t) {
    var type = rt.decode_type(buffer)
    console.assert(type==t, "field type no match");
    var idx = rt.decode_varint(buffer)
    console.assert(idx==index, "value no match");
}

function test_encode_u8() {
    console.log("test_encode_u8")
    var buffer = new ByteBuffer();

    rt.encode_field(buffer, 3)
    rt.encode_field(buffer, 3)

    buffer.mark(0)
    buffer.reset()
    test_manual_field(buffer, 3, rt.TYPE_VARINT)

    var number = rt.decode_field(buffer)
    console.assert(number == 3, "Number Not Match");

    var a = document.createElement('a');
    document.body.appendChild(a);
    a.innerHTML = 'test_encode_u8 success<br/>'; 
}

function test_encode_u16() {
    console.log("test_encode_u16")
    var buffer = new ByteBuffer();

    rt.encode_field(buffer, 0x1234)
    rt.encode_field(buffer, 0x1234)

    buffer.mark(0)
    buffer.reset()
    test_manual_field(buffer, 0x1234, rt.TYPE_VARINT)

    var value = rt.decode_field(buffer)
    console.assert(value == 0x1234, "Number Not Match");

    var a = document.createElement('a');
    document.body.appendChild(a);
    a.innerHTML = 'test_encode_u16 success<br/>'; 
}


function test_encode_u32() {
    console.log("test_encode_u32")
    var buffer = new ByteBuffer();

    rt.encode_field(buffer, 0x12345678)
    rt.encode_field(buffer, 0x12345678)

    buffer.mark(0)
    buffer.reset()
    test_manual_field(buffer, 0x12345678, rt.TYPE_VARINT)

    var value = rt.decode_field(buffer)
    console.assert( value == 0x12345678, "Number Not Match");

    var a = document.createElement('a');
    document.body.appendChild(a);
    a.innerHTML = 'test_encode_u32 success<br/>'; 
}


function test_encode_float() {
    console.log("test_encode_float")
    var buffer = new ByteBuffer(5, true);

    var number = 12345.123;

    rt.encode_field(buffer, number)
    buffer.mark(0)
    buffer.reset()
    
    // console.log(new Uint8Array(buffer.buffer).subarray(0, 5))
    // assert_eq(new Uint8Array(buffer.buffer).subarray(0, 5), new Uint8Array([11, 198, 252, 226, 11]))

    var value = rt.decode_field(buffer)
    console.assert(value == 12345.123, "Number Not Match");

    var a = document.createElement('a');
    document.body.appendChild(a);
    a.innerHTML = 'test_encode_float success<br/>'; 
}

function test_encode_str() {
    console.log("test_encode_str")
    var buffer = new ByteBuffer();

    var str = "I'm a chinese people";

    rt.encode_str_raw(buffer, str, rt.TYPE_STR)
    rt.encode_field(buffer, str)

    buffer.mark(0)
    buffer.reset()

    var length = rt.decode_varint(buffer);
    console.assert(str.length == length, "Size Must Equal length");
    var readStr = buffer.readUTF8String(length)
    console.assert(str == readStr, "UTF8 equal");


    var value = rt.decode_field(buffer)
    console.assert(value == str, "UTF8 Not Match");

    var a = document.createElement('a');
    document.body.appendChild(a);
    a.innerHTML = 'test_encode_str success<br/>'; 
}

function test_encode_map() {
    console.log("test_encode_map")
    var buffer = new ByteBuffer();

    var value = {}
    value["name"] = "I'm a chinese people"
    value["sub_name"] = "tickdream"
    value["index"] = 1

    rt.encode_field(buffer, value);

    buffer.mark(0)
    buffer.reset()

    var read = rt.decode_field(buffer)
    for(var k in value) {
        console.assert(value[k] == read[k], "Type Not Match");
    }

    value["undefine"] = 1
    var buffer = new ByteBuffer();
    rt.encode_field(buffer, value);

    buffer.mark(0)
    buffer.reset()

    var read = rt.decode_field(buffer)
    console.assert(read["undefine"] == 1, "Type Not Match");

    var a = document.createElement('a');
    document.body.appendChild(a);
    a.innerHTML = 'test_encode_map success<br/>'; 
}

function test_encode_array_u8() {

    console.log("test_encode_array_u8")
    var buffer = new ByteBuffer();

    var value = []
    for(var i = 0; i < 10; i++) {
        value.push(i);
    }

    rt.encode_field(buffer, value)

    buffer.mark(0)
    buffer.reset()

    var read = rt.decode_field(buffer)
    console.assert(read.length == 10, "Type Not Match");
    for(var i = 0; i < 10; i++) {
        console.assert(read[i] == i, "Type Not Match");
    }

    var a = document.createElement('a');
    document.body.appendChild(a);
    a.innerHTML = 'test_encode_array_u8 success<br/>'; 
}

function test_base_proto() {

    console.log("test_base_proto")

    var buffer = new ByteBuffer();

    var value = {}
    value["name"] = "I'm a chinese people"
    value["sub_name"] = "tickdream"
    value["index"] = 1

    rt.encode_proto(buffer, "cmd_test_op", [value])

    buffer.mark(0)
    buffer.reset()

    var read = rt.decode_proto(buffer)
    console.assert(read != null, "read not null")

    console.assert(read.proto == "cmd_test_op", "read name null")
    console.assert(read.list.length == 1, "read name null")

    var read_value = read.list[0]
    for(var k in value) {
        console.assert(value[k] == read_value[k], "Type Not Match");
    }

    var a = document.createElement('a');
    document.body.appendChild(a);
    a.innerHTML = 'test_base_proto success<br/>'; 
}


test_encode_u8()
test_encode_u16()
test_encode_u32()
test_encode_float()
test_encode_str()
test_encode_map()
test_encode_array_u8()
test_base_proto()