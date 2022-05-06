use std::collections::HashMap;
use std::io::Read;
use std::mem;

use crate::TYPE_STR_IDX;

use super::{StrConfig, Value, Buffer, Field, RpResult, ErrorKind};
use super::{TYPE_NIL, TYPE_U8, TYPE_I8, TYPE_U16, TYPE_I16, TYPE_U32, TYPE_I32, TYPE_FLOAT, TYPE_STR,
     TYPE_RAW, TYPE_ARR, TYPE_MAP};
use super::{get_name_by_type, get_type_by_name, make_extension_error};

pub fn decode_type(buffer: &mut Buffer) -> RpResult<Value> {
    let data: &mut [u8; 1] = &mut [0];
    try_read!(buffer.read(data), data.len());
    Ok(Value::from(data[0]))
}


pub fn decode_number(buffer: &mut Buffer, pattern: u8) -> RpResult<Value> {
    match pattern {
        TYPE_U8 => {
            let data: &mut [u8; 1] = &mut [0];
            try_read!(buffer.read(data), data.len());
            Ok(Value::from(data[0]))
        }
        TYPE_I8 => {
            let data: &mut [u8; 1] = &mut [0];
            try_read!(buffer.read(data), data.len());
            Ok(Value::from(data[0] as i8))
        }
        TYPE_U16 => {
            let data: &mut [u8; 2] = &mut [0, 0];
            try_read!(buffer.read(data), data.len());
            let val = unsafe { mem::transmute::<[u8; 2], u16>(*data) };
            Ok(Value::from(u16::from_le(val)))
        }
        TYPE_I16 => {
            let data: &mut [u8; 2] = &mut [0, 0];
            try_read!(buffer.read(data), data.len());
            let val = unsafe { mem::transmute::<[u8; 2], i16>(*data) };
            Ok(Value::from(i16::from_le(val)))
        }
        TYPE_U32 => {
            let data: &mut [u8; 4] = &mut [0, 0, 0, 0];
            try_read!(buffer.read(data), data.len());
            let val = unsafe { mem::transmute::<[u8; 4], u32>(*data) };
            Ok(Value::from(u32::from_le(val)))
        }
        TYPE_I32 => {
            let data: &mut [u8; 4] = &mut [0, 0, 0, 0];
            try_read!(buffer.read(data), data.len());
            let val = unsafe { mem::transmute::<[u8; 4], i32>(*data) };
            Ok(Value::from(i32::from_le(val)))
        }
        TYPE_FLOAT => {
            let data: &mut [u8; 4] = &mut [0, 0, 0, 0];
            try_read!(buffer.read(data), data.len());
            let val = unsafe { mem::transmute::<[u8; 4], i32>(*data) };
            Ok(Value::from(val as f32 / 1000.0))
        }
        _ => {
            unreachable!("not other numbers");
        }
    }
}

pub fn decode_str_raw(buffer: &mut Buffer, pattern: u8) -> RpResult<Value> {
    match pattern {
        TYPE_STR => {
            let len: u16 = decode_number(buffer, TYPE_U16)?.into();
            if len == 0 {
                return Ok(Value::from(String::new()));
            }
            let mut rv = vec![0; len as usize];
            try_read!(buffer.read(&mut rv[..]), len as usize);
            let val = String::from_utf8(rv);
            if val.is_err() {
                fail!((ErrorKind::StringFormatError, "string format error"));
            }
            Ok(Value::from(val.ok().unwrap()))
        }
        TYPE_RAW => {
            let len: u16 = decode_number(buffer, TYPE_U16)?.into();
            if len == 0 {
                return Ok(Value::from(Vec::<u8>::new()))
            }
            let mut rv = vec![0; len as usize];
            try_read!(buffer.read(&mut rv[..]), len as usize);
            Ok(Value::from(rv))
        }
        _ => {
            unreachable!("not other str");
        }
    }
}

pub fn decode_map(buffer: &mut Buffer, config: &StrConfig) -> RpResult<Value> {
    let mut map = HashMap::<Value, Value>::new();
    let arr_len: u16 = decode_number(buffer, TYPE_U16)?.into();
    for idx in 0 .. arr_len {
        let key = decode_field(buffer, config)?;
        let sub_value = decode_field(buffer, config)?;
        map.insert(key, sub_value);
    }
    Ok(Value::from(map))
}

pub fn decode_arr(buffer: &mut Buffer, config: &StrConfig) -> RpResult<Value> {
    let mut arr = Vec::<Value>::new();
    let arr_len: u16 = decode_number(buffer, TYPE_U16)?.into();
    for _ in 0 .. arr_len {
        let sub_value = decode_field(buffer, config)?;
        arr.push(sub_value);
    }
    Ok(Value::from(arr))
}

pub fn read_field(buffer: &mut Buffer) -> RpResult<Field> {
    let index = decode_number(buffer, TYPE_U16)?.into();
    let pattern = decode_number(buffer, TYPE_U16)?.into();
    Ok(Field {
        index: index,
        pattern: get_name_by_type(pattern).to_string(),
    })
}

// fn decode_by_field(buffer: &mut Buffer, config: &StrConfig, field: &Field) -> RpResult<Value> {
//     let t = get_type_by_name(&*field.pattern);
//     match t {
//         TYPE_U8 | TYPE_I8 | TYPE_U16 | TYPE_I16 | TYPE_U32 | TYPE_I32 | TYPE_FLOAT => {
//             decode_number(buffer, t)
//         }
//         TYPE_STR | TYPE_RAW => decode_str_raw(buffer, t),
//         TYPE_MAP => decode_map(buffer, config),
//         // TYPE_AU8 => decode_array!(decode_field(buffer, config), Value::AU8, Value::U8),
//         // TYPE_AI8 => decode_array!(decode_field(buffer, config), Value::AI8, Value::I8),
//         // TYPE_AU16 => decode_array!(decode_field(buffer, config), Value::AU16, Value::U16),
//         // TYPE_AI16 => decode_array!(decode_field(buffer, config), Value::AI16, Value::I16),
//         // TYPE_AU32 => decode_array!(decode_field(buffer, config), Value::AU32, Value::U32),
//         // TYPE_AI32 => decode_array!(decode_field(buffer, config), Value::AI32, Value::I32),
//         // TYPE_AFLOAT => decode_array!(decode_field(buffer, config), Value::AFloat, Value::Float),
//         // TYPE_ASTR => decode_array!(decode_field(buffer, config), Value::AStr, Value::Str),
//         // TYPE_ARAW => decode_array!(decode_field(buffer, config), Value::ARaw, Value::Raw),
//         // TYPE_AMAP => decode_array!(decode_field(buffer, config), Value::AMap, Value::Map),
//         TYPE_NIL => Ok(Value::Nil),
//         _ => fail!((ErrorKind::TypeNotMatchError, "must match type")),
//     }
// }


fn decode_by_pattern(buffer: &mut Buffer, config: &StrConfig, pattern: &u8) -> RpResult<Value> {
    match *pattern {
        TYPE_U8 | TYPE_I8 | TYPE_U16 | TYPE_I16 | TYPE_U32 | TYPE_I32 | TYPE_FLOAT => {
            decode_number(buffer, *pattern)
        }
        TYPE_STR | TYPE_RAW => decode_str_raw(buffer, *pattern),
        TYPE_MAP => decode_map(buffer, &config),
        TYPE_ARR => decode_arr(buffer, &config),
        TYPE_STR_IDX => {
            let idx: u16 = decode_number(buffer, TYPE_U16)?.into();
            Ok(Value::from(config.get_str(idx)?))
        },
        // TYPE_AMAP => decode_array!(decode_field(buffer, config), Value::AMap, Value::Map),
        TYPE_NIL => Ok(Value::Nil),
        _ => fail!((ErrorKind::TypeNotMatchError, "must match type")),
    }
}


pub fn decode_field(buffer: &mut Buffer, config: &StrConfig) -> RpResult<Value> {
    let pattern = decode_type(buffer)?.into();
    decode_by_pattern(buffer, config, &pattern)
}

pub fn decode_proto(buffer: &mut Buffer) -> RpResult<(String, Vec<Value>)> {
    let str_len: u16 = decode_number(buffer, TYPE_U16)?.into();
    let mut config = StrConfig::new();
    for _ in 0..str_len {
        let value = decode_str_raw(buffer, TYPE_STR)?.into();
        config.add_str(value);
    }

    let name = decode_str_raw(buffer, TYPE_STR)?.into();
    println!("name = {}", name);
    let sub_value = decode_field(buffer, &config)?;
    match sub_value {
        Value::Arr(val) => Ok((name, val)),
        _ => Err(make_extension_error("proto is not array", None))
    }
    
}
