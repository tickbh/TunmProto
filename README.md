# tunm_proto
tickbh rust bin protocol

## suport type
base type is contain "u8",   "i8",   "u16",   "i16",   "u32",   "i32", "u64",   "i64", "varint", "float",   "string",  "raw",   "map", "array"

# example proto
```rust
extern crate tunm_proto as rt;
use rt::{Value, Buffer};

use std::collections::{HashMap};
fn main()
{
    println!("welcome to tickdream rust protocol");

    let mut hash_value = HashMap::<Value, Value>::new();
    hash_value.insert(Value::Str("name".to_string()), Value::Str("I'm a chinese people".to_string()));
    hash_value.insert(Value::Str("sub_name".to_string()), Value::Str("tickdream".to_string()));
    hash_value.insert(Value::Str("index".to_string()), Value::U16(1 as u16));

    {
        let mut buffer = Buffer::new();
        rt::encode_proto(&mut buffer, &"cmd_test_op".to_string(), vec![Value::Map(hash_value.clone())]).unwrap();

        // just read field
        let read = rt::decode_proto(&mut buffer).unwrap();
        match read {
            (name, val) => {
                assert_eq!(name, "cmd_test_op".to_string());
                assert_eq!(val[0], Value::Map(hash_value));
                assert_eq!(val.len(), 1);
            }
        }
    }
}

```
it will encode Vec<Value> accords to proto name like as "cmd_test_op" define args is [map]

# compatible
it will ensure data decoded maximum
 - old protocol can decode the new protocol if new protocol not change the old field info, but it will miss some info
 - new protocol can decode the old protocol all datas
