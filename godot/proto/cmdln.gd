
extends SceneTree

var Buffer = preload("res://proto/buffer.gd")
var Core = preload("res://proto/core.gd")
        
func _init():
    # var buffer = Buffer.Buffer.new()
    # buffer.read_byte()

    var buffer = Buffer.new()
    Core.PBPacker.encode_proto(buffer, "c", ["1", "2111", 3])
    print("Compilation failed.!!!!!!!!!!!")
    buffer.reset_rpos()

    var unpack = Core.PBPacker.decode_proto(buffer)
    print("unpack ===", unpack)
    quit(0)
