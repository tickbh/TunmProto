

class_name Buffer

var bytes : PoolByteArray
var rpos : int = 0
var wpos : int = 0
var str_arr: Array

func add_str(value: String):
    if value in str_arr:
        return str_arr.find(value)
    else:
        str_arr.push_back(value)
        return len(str_arr) - 1

func get_str(idx):
    return str_arr[idx]

func read_bytes(read_len : int) -> PoolByteArray:
    var arr: PoolByteArray = PoolByteArray()
    var left = wpos - rpos;
    if left == 0:
        return arr
    if read_len > left:
        read_len = left
    arr.append_array(bytes.subarray(rpos, rpos+read_len))
    return arr

func read_byte():
    print("read bytes")
    var reads = read_bytes(1)
    if len(reads) == 0:
        return 0
    return reads[0]

func write(arr: PoolByteArray):
    var size = arr.size()
    bytes.append_array(arr)
    self.wpos += size
    return size

# export(Buffer) var buffer