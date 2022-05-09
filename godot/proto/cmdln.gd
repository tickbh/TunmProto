
extends Node

var Buffer = preload("res://proto/buffer.gd")
var Core = preload("res://proto/core.gd")

func test_varint():
	var buffer = Buffer.new()
	var ret;
	Core.PBPacker.encode_varint(buffer, 111)
	buffer.reset_rpos()
	ret = Core.PBPacker.decode_varint(buffer)
	assert(ret == 111)


func test_str():
	var buffer = Buffer.new()
	var ret;
	Core.PBPacker.encode_str_raw(buffer, "rt_proto_ok")
	buffer.reset_rpos()
	ret = Core.PBPacker.decode_str_raw(buffer, Core.RT_DATA_TYPE.TYPE_STR)
	print("ret", ret)
	assert(ret == "rt_proto_ok")

func test_array():
	var buffer = Buffer.new()
	var ret;
	var before = ["rt_proto_ok", "aaaa"," ccccc", "cccc", "cccc", 11111]
	Core.PBPacker.encode_arr(buffer, before)
	buffer.reset_rpos()
	ret = Core.PBPacker.decode_arr(buffer)
	print("ret", ret)
	assert(ret == before)
		
func test_map():
	var buffer = Buffer.new()
	var ret;
	var before = {"rt_proto_ok": 122, "aaaa":111," ccccc":{"aaa": 12}, "cccc":1111, "cccc1": 11111}
	Core.PBPacker.encode_map(buffer, before)
	buffer.reset_rpos()
	ret = Core.PBPacker.decode_map(buffer)
	print("ret", ret)
	#assert(ret == before)
	
func _init():
	# var buffer = Buffer.Buffer.new()
	# buffer.read_byte()

	test_varint()
	test_str()
	test_array()
	test_map()

	var buffer = Buffer.new()
	Core.PBPacker.encode_proto(buffer, "cmd_ok", ["qaa1", "aa2aaaa111", 3])
	print("Compilation failed.!!!!!!!!!!!")
	buffer.reset_rpos()

	var unpack = Core.PBPacker.decode_proto(buffer)
	print("unpack ===", unpack)

