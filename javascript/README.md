#td_proto_js

tickbh javascript bin protocol

## suport type
base type is contain "u8",   "i8",   "u16",   "i16",   "u32",   "i32",   "float",   "string",   "raw",   "map"

array type is contain "u8[]", "i8[]", "u16[]", "i16[]", "u32[]", "i32[]", "float[]", "string[]", "raw[]", "map[]"

# data detail
data will be format like as Id, Type, Data store by little endian, Id is 2bytes, Type is 2bytes
 - "u8",   "i8"                   -- 1bytes 
 - "u16",   "i16"                 -- 2bytes
 - "u32",  "i32",  "float"        -- 4bytes, float decode with i32 div 1000
 - "string",  "raw"               -- 2bytes len, len bytes datas
 - map                            -- key always encode string, contains id, type, value is base value, end will key type is nil
 - array                          -- write base data, stop with id = 0, type = 0

# compatible
it will ensure data decoded maximum
 - old protocol can decode the new protocol if new protocol not change the old field info, but it will miss some info
 - new protocol can decode the old protocol all datas
