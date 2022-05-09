
extends SceneTree

var Buffer = preload("res://proto/buffer.gd")
var Core = preload("res://proto/core.gd")
        
func _init():
    # var buffer = Buffer.Buffer.new()
    # buffer.read_byte()
    Core.PBPacker.fuck()
    print("Compilation failed.!!!!!!!!!!!")
    quit(0)
