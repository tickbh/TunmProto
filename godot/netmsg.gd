

class_name NetMsg

var Core = preload("res://proto/core.gd")

const HEAD_LEN: int = 24;
var buffer : Buffer
var seq_fd : int = 0
var length : int = 0
var cookie: int = 0
var msg_type: int = 0
var msg_flag: int = 0
var from_svr_type: int = 0
var from_svr_id: int = 0
var to_svr_type: int = 0
var to_svr_id: int = 0
var pack_name: String = ""
var is_vaild: bool = true

func _init(data = null):
	buffer = Buffer.new()
	if data == null:
		return;
	buffer.write(data)

	self.read_head()
	
	if len(data) != length:
		is_vaild = false
	
func min_len() -> int:
	return HEAD_LEN

func end_msg(o_seq_fd):
	seq_fd = o_seq_fd
	length = buffer.size()
	var temp_wpos = buffer.wpos
	buffer.set_wpos(0)

	Core.PBPacker.encode_number(buffer, length, Core.RT_DATA_TYPE.TYPE_U32);
	Core.PBPacker.encode_number(buffer, seq_fd, Core.RT_DATA_TYPE.TYPE_U16);
	Core.PBPacker.encode_number(buffer, cookie, Core.RT_DATA_TYPE.TYPE_U32);
	Core.PBPacker.encode_number(buffer, msg_type, Core.RT_DATA_TYPE.TYPE_U8);
	Core.PBPacker.encode_number(buffer, msg_flag, Core.RT_DATA_TYPE.TYPE_U8);
	Core.PBPacker.encode_number(buffer, from_svr_type, Core.RT_DATA_TYPE.TYPE_U16);
	Core.PBPacker.encode_number(buffer, from_svr_id, Core.RT_DATA_TYPE.TYPE_U32);
	Core.PBPacker.encode_number(buffer, to_svr_type, Core.RT_DATA_TYPE.TYPE_U16);
	Core.PBPacker.encode_number(buffer, to_svr_id, Core.RT_DATA_TYPE.TYPE_U32);

	buffer.set_wpos(temp_wpos)

func get_buffer() -> Buffer:
	return buffer

func read_head():
	var temp_rpos = buffer.rpos
	length = Core.PBPacker.decode_number(buffer, Core.RT_DATA_TYPE.TYPE_U32)
	seq_fd = Core.PBPacker.decode_number(buffer, Core.RT_DATA_TYPE.TYPE_U16)
	cookie = Core.PBPacker.decode_number(buffer, Core.RT_DATA_TYPE.TYPE_U32)
	msg_type = Core.PBPacker.decode_number(buffer, Core.RT_DATA_TYPE.TYPE_U8)
	msg_flag = Core.PBPacker.decode_number(buffer, Core.RT_DATA_TYPE.TYPE_U8)
	from_svr_type = Core.PBPacker.decode_number(buffer, Core.RT_DATA_TYPE.TYPE_U16)
	from_svr_id = Core.PBPacker.decode_number(buffer, Core.RT_DATA_TYPE.TYPE_U32)
	to_svr_type = Core.PBPacker.decode_number(buffer, Core.RT_DATA_TYPE.TYPE_U16)
	to_svr_id = Core.PBPacker.decode_number(buffer, Core.RT_DATA_TYPE.TYPE_U32)
	buffer.set_rpos(HEAD_LEN)
	pack_name = Core.PBPacker.decode_str_raw(buffer, Core.RT_DATA_TYPE.TYPE_STR)
	buffer.set_rpos(temp_rpos)
	
func read_bytes(read_len : int) -> PoolByteArray:
	return buffer.read_bytes(read_len)

func read_byte():
	return buffer.read_byte()
	
func write_byte(b: int):
	buffer.write_byte(b)

func write(arr: PoolByteArray):
	buffer.write(arr)

	

func encode_proto(name: String, infos: Array):
	var temp_wpos = buffer.wpos
	
	buffer.set_wpos(HEAD_LEN)
	Core.PBPacker.encode_proto(buffer, name, infos)
	buffer.set_wpos(temp_wpos)
	end_msg(0)
	buffer.set_rpos(0)
	return buffer.get_all_bytes()
			
func decode_proto(buffer: Buffer):
	var temp_rpos = buffer.rpos
	buffer.set_rpos(HEAD_LEN)
	var ret = Core.PBPacker.decode_proto(buffer)
	buffer.set_rpos(HEAD_LEN)
	return ret
