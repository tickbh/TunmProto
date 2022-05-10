
function test_head_field(buffer, index, t) {
    var data = buffer.readBytes(2);
    console.assert(data.remaining()==2, "Size Must Equal 2");
    console.assert(data.readUint16() == index, "Index Not Match");


    var data = buffer.readBytes(2);
    console.assert(data.remaining()==2, "Size Must Equal 2");
    console.assert(data.readUint16() == t, "Type Not Match");

}

function test_encode_u8() {
    var buffer = new ByteBuffer();

    encode_field(buffer, {pattern: TYPE_U8, number: 3})
    encode_field(buffer, {pattern: TYPE_U8, number: 3})

    buffer.mark(0)
    buffer.reset()
    test_head_field(buffer, 0, TYPE_U8)

    var data = buffer.readBytes(1);
    console.assert(data.remaining() == 1, "Size Must Equal 2");
    console.assert(data.readUint8() == 3, "Type Not Match");


    var field = decode_field(buffer)
    console.assert(field.pattern == TYPE_U8, "Type Not Match");
    console.assert(field.number == 3, "Number Not Match");

    var a = document.createElement('a');
    document.body.appendChild(a);
    a.innerHTML = 'test_encode_u8 success<br/>'; 
}

function test_encode_u16() {
    var buffer = new ByteBuffer();

    encode_field(buffer, {pattern: TYPE_U16, number: 0x1234})
    encode_field(buffer, {pattern: TYPE_U16, number: 0x1234})

    buffer.mark(0)
    buffer.reset()
    test_head_field(buffer, 0, TYPE_U16)

    var data = buffer.readBytes(2);
    console.assert(data.remaining() == 2, "Size Must Equal 2");
    console.assert(data.readUint16() == 0x1234, "Type Not Match");


    var field = decode_field(buffer)
    console.assert(field.pattern == TYPE_U16, "Type Not Match");
    console.assert(field.number == 0x1234, "Number Not Match");

    var a = document.createElement('a');
    document.body.appendChild(a);
    a.innerHTML = 'test_encode_u16 success<br/>'; 
}


function test_encode_u32() {
    var buffer = new ByteBuffer();

    encode_field(buffer, {pattern: TYPE_U32, number: 0x12345678})
    encode_field(buffer, {pattern: TYPE_U32, number: 0x12345678})

    buffer.mark(0)
    buffer.reset()
    test_head_field(buffer, 0, TYPE_U32)

    var data = buffer.readBytes(4);
    console.assert(data.remaining() == 4, "Size Must Equal 2");
    console.assert(data.readUint32() == 0x12345678, "Type Not Match");


    var field = decode_field(buffer)
    console.assert(field.pattern == TYPE_U32, "Type Not Match");
    console.assert(field.number == 0x12345678, "Number Not Match");

    var a = document.createElement('a');
    document.body.appendChild(a);
    a.innerHTML = 'test_encode_u32 success<br/>'; 
}


function test_encode_float() {
    var buffer = new ByteBuffer();

    var number = 12345.123;

    encode_field(buffer, {pattern: TYPE_FLOAT, number: number})
    encode_field(buffer, {pattern: TYPE_FLOAT, number: number})

    buffer.mark(0)
    buffer.reset()
    test_head_field(buffer, 0, TYPE_FLOAT)

    var data = buffer.readBytes(4);
    console.assert(data.remaining() == 4, "Size Must Equal 2");
    console.assert(data.readUint32() == number * 1000, "Type Not Match");


    var field = decode_field(buffer)
    console.assert(field.pattern == TYPE_FLOAT, "Type Not Match");
    console.assert(field.number == number, "Number Not Match");

    var a = document.createElement('a');
    document.body.appendChild(a);
    a.innerHTML = 'test_encode_float success<br/>'; 
}

function test_encode_str() {
    var buffer = new ByteBuffer();

    var str = "I'm a chinese people";

    encode_field(buffer, {pattern: TYPE_STR, str: str})
    encode_field(buffer, {pattern: TYPE_STR, str: str})

    buffer.mark(0)
    buffer.reset()
    test_head_field(buffer, 0, TYPE_STR)

    var length = buffer.readUint16();
    console.assert(str.length == length, "Size Must Equal length");
    var readStr = buffer.readUTF8String(length)
    console.assert(str == readStr, "UTF8 equal");
    


    var field = decode_field(buffer)
    console.assert(field.pattern == TYPE_STR, "Type Not Match");
    console.assert(field.str == str, "UTF8 Not Match");

    var a = document.createElement('a');
    document.body.appendChild(a);
    a.innerHTML = 'test_encode_str success<br/>'; 
}

function test_encode_map() {
    var buffer = new ByteBuffer();

    var value = {}
    value["name"] = "I'm a chinese people"
    value["sub_name"] = "tickdream"
    value["index"] = 1

    encode_field(buffer, rt_from_value(value, TYPE_MAP));

    buffer.mark(0)
    buffer.reset()

    var read = rt_into_value(decode_field(buffer, config))
    for(var k in value) {
        console.assert(value[k] == read[k], "Type Not Match");
    }

    value["undefine"] = 1
    var buffer = new ByteBuffer();
    encode_field(buffer, rt_from_value(value, TYPE_MAP));

    buffer.mark(0)
    buffer.reset()

    var read = rt_into_value(decode_field(buffer, config))
    console.assert(IsNull(read["undefine"]), "Type Not Match");

    var a = document.createElement('a');
    document.body.appendChild(a);
    a.innerHTML = 'test_encode_map success<br/>'; 
}

function test_encode_array_u8() {

    var buffer = new ByteBuffer();

    var value = []
    for(var i = 0; i < 10; i++) {
        value.push(i);
    }

    encode_field(buffer, rt_from_value(value, TYPE_AU8))

    buffer.mark(0)
    buffer.reset()

    var read = rt_into_value(decode_field(buffer, config))
    console.assert(read.length == 10, "Type Not Match");
    for(var i = 0; i < 10; i++) {
        console.assert(read[i] == i, "Type Not Match");
    }

    var a = document.createElement('a');
    document.body.appendChild(a);
    a.innerHTML = 'test_encode_array_u8 success<br/>'; 
}

function test_base_proto() {

    td_reinit_proto("{ \
        \"field\":  { \"name\" : { \"index\" :    1, \"pattern\" : \"str\" }, \
                    \"index\" : { \"index\" :    2, \"pattern\" : \"u16\" },  \
                    \"sub_name\" : { \"index\" :    3, \"pattern\" :\"str\" }}, \
        \"proto\":   {\"cmd_test_op\"        : { \"msg_type\" :    \"server\", \"args\" : [ \"map\" ] }}\
    }")


    var buffer = new ByteBuffer();

    var value = {}
    value["name"] = "I'm a chinese people"
    value["sub_name"] = "tickdream"
    value["index"] = 1

    encode_proto(buffer, "cmd_test_op", [value])

    buffer.mark(0)
    buffer.reset()

    var read = decode_proto(buffer, config)
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