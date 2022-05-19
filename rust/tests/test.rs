extern crate tunm_proto as tunm;
use tunm::{Value, Buffer};

use std::io::prelude::*;
use std::mem;
use std::collections::{HashMap};

fn test_head_field(buffer : &mut Buffer, t : u8) {
    // first index bytes
    let data: &mut [u8; 1] = &mut [0];
    let size = buffer.read(data).unwrap();
    assert_eq!(size, 1);
    let val = u8::from_le(unsafe { mem::transmute::<[u8;1], u8>(*data) });
    assert_eq!(val, t);

}

#[test]
fn test_encode_u8() {
    let mut buffer = Buffer::new();
    let value = Value::U8(12 as u8);
    tunm::encode_field(&mut buffer, &value).unwrap();
    
    assert_eq!(buffer.get_write_data(), [2, 12]);

    // second read field
    let read = tunm::decode_field(&mut buffer).unwrap();
    match read {
        Value::U8(val) => assert_eq!(val, 12),
        _ => unreachable!("it will not read"),
    }
}

#[test]
fn test_encode_16() {
    let mut buffer = Buffer::new();
    
    //-1
    tunm::encode_field(&mut buffer, &Value::I16(-1 as i16)).unwrap(); 
    tunm::encode_field(&mut buffer, &Value::U16(0x1234 as u16)).unwrap();

    assert_eq!(buffer.get_write_data(), [10, 1, 10, 232, 72]);

    // first read field
    let read = tunm::decode_field(&mut buffer).unwrap();
    match read {
        Value::Varint(val) => assert_eq!(val, -1),
        _ => unreachable!("it will not read"),
    }

    // second read field
    let read = tunm::decode_field(&mut buffer).unwrap();
    match read {
        Value::Varint(val) => assert_eq!(val, 0x1234),
        _ => unreachable!("it will not read"),
    }
}


#[test]
fn test_encode_u32() {
    let mut buffer = Buffer::new();
    tunm::encode_field(&mut buffer, &Value::I32(-90 as i32)).unwrap();
    tunm::encode_field(&mut buffer, &Value::U32(0x12345678 as u32)).unwrap();
    // println!("{:?}", buffer.get_write_data());
    assert_eq!(buffer.get_write_data(), [10, 179, 1, 10, 240, 217, 162, 163, 2]);

    let read = tunm::decode_field(&mut buffer).unwrap();
    match read {
        Value::Varint(val) => assert_eq!(val, -90),
        _ => unreachable!("it will not read"),
    }
    // second read field
    let read = tunm::decode_field(&mut buffer).unwrap();
    match read {
        Value::Varint(val) => assert_eq!(val, 0x12345678),
        _ => unreachable!("it will not read"),
    }
}


#[test]
fn test_encode_float() {
    let mut buffer = Buffer::new();
    let value = Value::Float(12345.123);
    tunm::encode_field(&mut buffer, &value).unwrap();
    assert_eq!(buffer.get_write_data(), [11, 35, 95, 188, 0]);

    // second read field
    let read = tunm::decode_field(&mut buffer).unwrap();
    match read {
        Value::Float(val) => assert_eq!(val, 12345.123),
        _ => unreachable!("it will not read"),
    }
}

#[test]
fn test_encode_str() {
    let mut buffer = Buffer::new();
    let name = "this is tunm proto, 中文测试";
    let value = Value::Str(name.to_string());
    tunm::encode_str_raw(&mut buffer, &value).unwrap();
    
    assert_eq!(buffer.get_write_data(), [64, 116, 104, 105, 115, 32, 105, 115, 32, 116, 117, 110, 109, 32, 112, 114, 111, 116, 111, 44, 32, 228, 184, 173, 230, 150, 135, 230, 181, 139, 232, 175, 149]);
    

    // second read field
    let read = tunm::decode_str_raw(&mut buffer, tunm::TYPE_STR).unwrap();
    match read {
        Value::Str(val) => assert_eq!(&*val, name),
        _ => unreachable!("it will not read"),
    }
}

#[test]
fn test_encode_map() {
    let mut hash_value = HashMap::<Value, Value>::new();
    hash_value.insert(Value::Str("name".to_string()), Value::Str("tickbh".to_string()));
    hash_value.insert(Value::Str("proto".to_string()), Value::Str("tunm".to_string()));
    hash_value.insert(Value::Str("index".to_string()), Value::U16(1 as u16));
    {
        let mut buffer = Buffer::new();
        tunm::encode_field(&mut buffer, &Value::Map(hash_value.clone())).unwrap();

        // just read field
        let read = tunm::decode_field(&mut buffer).unwrap();
        match read {
            Value::Map(val) => assert_eq!(val, hash_value),
            _ => unreachable!("it will not read"),
        }
    }
}

#[test]
fn test_encode_array_u8() {
    let mut array : Vec<Value> = vec![];
    for i in 0 .. 10 {
        array.push(Value::U8(i as u8));
    }

    let mut buffer = Buffer::new();
    tunm::encode_field(&mut buffer, &Value::Arr(array.clone())).unwrap();

    let read = tunm::decode_field(&mut buffer).unwrap();
    match read {
        Value::Arr(ref val) => {
            assert_eq!(*val, array);
        },
        _ => unreachable!("it will not read"),
    }
}


#[test]
fn test_base_proto() {
    let mut hash_value = HashMap::<Value, Value>::new();
    hash_value.insert(Value::Str("name".to_string()), Value::Str("I'm a chinese people".to_string()));
    hash_value.insert(Value::Str("sub_name".to_string()), Value::Str("tickdream".to_string()));
    hash_value.insert(Value::Str("index".to_string()), Value::U16(1 as u16));

    {
        let mut buffer = Buffer::new();
        tunm::encode_proto(&mut buffer, &"cmd_test_op".to_string(), vec![Value::Map(hash_value.clone())]).unwrap();

        // just read field
        let read = tunm::decode_proto(&mut buffer).unwrap();
        match read {
            (name, val) => {
                assert_eq!(name, "cmd_test_op".to_string());
                assert_eq!(val[0], Value::Map(hash_value));
                assert_eq!(val.len(), 1);
            }
        }
    }
}