extern crate rt_proto as td_rp;
use td_rp::{Value, StrConfig, Buffer};

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
    let mut config = StrConfig::new();
    let mut buffer = Buffer::new();
    let value = Value::U8(1 as u8);
    td_rp::encode_field(&mut buffer, &mut config, &value).unwrap();
    td_rp::encode_field(&mut buffer, &mut config, &value).unwrap();

    // first read field
    test_head_field(&mut buffer, td_rp::TYPE_U8);
    // after index type is data
    let data: &mut [u8; 1] = &mut [0];
    let size = buffer.read(data).unwrap();
    assert_eq!(size, 1);
    assert_eq!(data[0], 1);

    // second read field
    let read = td_rp::decode_field(&mut buffer, &config).unwrap();
    match read {
        Value::U8(val) => assert_eq!(val, 1),
        _ => unreachable!("it will not read"),
    }

    let size = buffer.read(data).unwrap();
    assert_eq!(size, 0);
}

#[test]
fn test_encode_u16() {
    let mut config = StrConfig::new();
    let mut buffer = Buffer::new();
    let value = Value::U16(0x1234 as u16);
    td_rp::encode_field(&mut buffer, &mut config, &value).unwrap();
    td_rp::encode_field(&mut buffer, &mut config, &value).unwrap();

    // first read field
    test_head_field(&mut buffer, td_rp::TYPE_U16);
    // after index type is data
    let data: &mut [u8; 2] = &mut [0, 0];
    let size = buffer.read(data).unwrap();
    assert_eq!(size, 2);
    assert_eq!(data[0], 0x34);
    assert_eq!(data[1], 0x12);

    // second read field
    let read = td_rp::decode_field(&mut buffer, &config).unwrap();
    match read {
        Value::U16(val) => assert_eq!(val, 0x1234),
        _ => unreachable!("it will not read"),
    }
    let size = buffer.read(data).unwrap();
    assert_eq!(size, 0);
}


#[test]
fn test_encode_u32() {
    let mut config = StrConfig::new();
    let mut buffer = Buffer::new();
    let value = Value::U32(0x12345678 as u32);
    td_rp::encode_field(&mut buffer, &mut config, &value).unwrap();
    td_rp::encode_field(&mut buffer, &mut config, &value).unwrap();

    // first read field
    test_head_field(&mut buffer, td_rp::TYPE_U32);
    // after index type is data
    let data: &mut [u8; 4] = &mut [0, 0, 0, 0];
    let size = buffer.read(data).unwrap();
    assert_eq!(size, 4);
    assert_eq!(data[0], 0x78);
    assert_eq!(data[1], 0x56);
    assert_eq!(data[2], 0x34);
    assert_eq!(data[3], 0x12);

    // second read field
    let read = td_rp::decode_field(&mut buffer, &config).unwrap();
    match read {
        Value::U32(val) => assert_eq!(val, 0x12345678),
        _ => unreachable!("it will not read"),
    }
    let size = buffer.read(data).unwrap();
    assert_eq!(size, 0);
}


#[test]
fn test_encode_float() {
    let mut config = StrConfig::new();
    let mut buffer = Buffer::new();
    let value = Value::Float(12345.123);
    td_rp::encode_field(&mut buffer, &mut config, &value).unwrap();
    td_rp::encode_field(&mut buffer, &mut config, &value).unwrap();

    // first read field
    test_head_field(&mut buffer, td_rp::TYPE_FLOAT);
    // after index type is data
    let data: &mut [u8; 4] = &mut [0, 0, 0, 0];
    let size = buffer.read(data).unwrap();
    assert_eq!(size, 4);
    let val = u32::from_le(unsafe { mem::transmute::<[u8;4], u32>(*data) });
    let val = val as f32 / 1000.0;
    assert_eq!(val, 12345.123);
    // second read field
    let read = td_rp::decode_field(&mut buffer, &config).unwrap();
    match read {
        Value::Float(val) => assert_eq!(val, 12345.123),
        _ => unreachable!("it will not read"),
    }
    let size = buffer.read(data).unwrap();
    assert_eq!(size, 0);
}

#[test]
fn test_encode_str() {
    let mut config = StrConfig::new();
    let mut buffer = Buffer::new();
    let name = "I'm a chinese people";
    let value = Value::Str(name.to_string());
    td_rp::encode_type(&mut buffer, &value).unwrap();
    td_rp::encode_str_raw(&mut buffer, &value).unwrap();
    
    td_rp::encode_field(&mut buffer, &mut config, &value).unwrap();

    // first read field
    test_head_field(&mut buffer, td_rp::TYPE_STR);

    let len = match td_rp::decode_number(&mut buffer, td_rp::TYPE_U16).unwrap() {
        Value::U16(val) => val,
        _ => panic!("error"),
    };
    let mut rv = vec![0; len as usize];
    let size = buffer.read(&mut rv[..]).unwrap();
    assert_eq!(size, len as usize);
    let val = String::from_utf8(rv).unwrap();
    assert_eq!(&*val, name);

    // second read field
    let read = td_rp::decode_field(&mut buffer, &config).unwrap();
    match read {
        Value::Str(val) => assert_eq!(&*val, name),
        _ => unreachable!("it will not read"),
    }
}

#[test]
fn test_encode_map() {
    let mut config = td_rp::StrConfig::new();
    let mut hash_value = HashMap::<Value, Value>::new();
    hash_value.insert(Value::Str("name".to_string()), Value::Str("I'm a chinese people".to_string()));
    hash_value.insert(Value::Str("sub_name".to_string()), Value::Str("tickdream".to_string()));
    hash_value.insert(Value::Str("index".to_string()), Value::U16(1 as u16));
    {
        let mut buffer = Buffer::new();
        td_rp::encode_field(&mut buffer, &mut config, &Value::Map(hash_value.clone())).unwrap();

        // just read field
        let read = td_rp::decode_field(&mut buffer, &config).unwrap();
        match read {
            Value::Map(val) => assert_eq!(val, hash_value),
            _ => unreachable!("it will not read"),
        }
    }

    let mut undefined = hash_value.clone();
    undefined.insert(Value::Str("undefine".to_string()), Value::U16(1 as u16));
    {
        let mut buffer = Buffer::new();
        td_rp::encode_field(&mut buffer, &mut config, &Value::Map(undefined.clone())).unwrap();

        // just read field
        let read = td_rp::decode_field(&mut buffer, &config).unwrap();
        match read {
            Value::Map(val) => assert_eq!(val, undefined),
            _ => unreachable!("it will not read"),
        }
    }
}

#[test]
fn test_encode_array_u8() {
    let mut config = StrConfig::new();
    let mut array : Vec<Value> = vec![];
    for i in 0 .. 10 {
        array.push(Value::U8(i as u8));
    }

    let mut buffer = Buffer::new();
    td_rp::encode_field(&mut buffer, &mut config, &Value::Arr(array.clone())).unwrap();

    let read = td_rp::decode_field(&mut buffer, &config).unwrap();
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
        td_rp::encode_proto(&mut buffer, &"cmd_test_op".to_string(), vec![Value::Map(hash_value.clone())]).unwrap();

        // just read field
        let read = td_rp::decode_proto(&mut buffer).unwrap();
        match read {
            (name, val) => {
                assert_eq!(name, "cmd_test_op".to_string());
                assert_eq!(val[0], Value::Map(hash_value));
                assert_eq!(val.len(), 1);
            }
        }
    }
}