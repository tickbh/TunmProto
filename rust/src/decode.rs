use std::collections::HashMap;
use std::io::Read;
use std::mem;

use crate::{TYPE_STR_IDX, TYPE_VARINT};

use super::{Value, Buffer, RpResult, ErrorKind};
use super::{TYPE_NIL, TYPE_BOOL, TYPE_U8, TYPE_I8, TYPE_U16, TYPE_I16, TYPE_U32, TYPE_I32, TYPE_U64, TYPE_I64, TYPE_FLOAT, TYPE_DOUBLE, TYPE_STR,
     TYPE_RAW, TYPE_ARR, TYPE_MAP};
use super::{make_extension_error};

pub fn decode_type(buffer: &mut Buffer) -> RpResult<Value> {
    let data: &mut [u8; 1] = &mut [0];
    try_read!(buffer.read(data), data.len());
    Ok(Value::from(data[0]))
}

pub fn decode_bool(buffer: &mut Buffer, pattern: u8) -> RpResult<Value> {
    match pattern {
        TYPE_BOOL => {
            let data: &mut [u8; 1] = &mut [0];
            try_read!(buffer.read(data), data.len());
            Ok(Value::from(if data[0] == 1 { true } else { false }))
        }
        _ => {
            unreachable!("not other numbers");
        }
    }
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
        TYPE_U64 => {
            let data: &mut [u8; 8] = &mut [0, 0, 0, 0, 0, 0, 0, 0];
            try_read!(buffer.read(data), data.len());
            let val = unsafe { mem::transmute::<[u8; 8], u64>(*data) };
            Ok(Value::from(u64::from_le(val)))
        }
        TYPE_I64 => {
            let data: &mut [u8; 8] = &mut [0, 0, 0, 0, 0, 0, 0, 0];
            try_read!(buffer.read(data), data.len());
            let val = unsafe { mem::transmute::<[u8; 8], i64>(*data) };
            Ok(Value::from(i64::from_le(val)))
        }
        TYPE_VARINT => {
            decode_varint(buffer)
        }
        TYPE_FLOAT => {
            let data: &mut [u8; 4] = &mut [0, 0, 0, 0];
            try_read!(buffer.read(data), data.len());
            let val = unsafe { mem::transmute::<[u8; 4], i32>(*data) };
            Ok(Value::from(val as f32 / 1000.0))
        }
        TYPE_DOUBLE => {
            let data: &mut [u8; 8] = &mut [0, 0, 0, 0, 0, 0, 0, 0];
            try_read!(buffer.read(data), data.len());
            let val = unsafe { mem::transmute::<[u8; 8], i64>(*data) };
            Ok(Value::from(val as f64 / 1000000.0))
        }
        _ => {
            unreachable!("not other numbers");
        }
    }
}

pub fn decode_varint(buffer: &mut Buffer) -> RpResult<Value> {
    let data: &mut [u8; 1] = &mut [0];
    let mut real = 0u64;
    let mut shl_num = 0;
    loop {
        try_read!(buffer.read(data), data.len());
        let read = (data[0] & 0x7F) as u64;
        if let Some(sread) = read.checked_shl(shl_num) {
            real += sread;
        } else {
            fail!((ErrorKind::ParseError, "too big varint"));
        }
        shl_num += 7;
        if (data[0] & 0x80) == 0 {
            break;
        }
    }
    let is_left = real % 2 == 1;
    let val = if is_left {
        - ((real / 2) as i64) - 1
    } else {
        (real / 2) as i64
    };
    Ok(Value::Varint(val))
}

pub fn decode_str_raw(buffer: &mut Buffer, pattern: u8) -> RpResult<Value> {
    match pattern {
        TYPE_STR => {
            let len: u16 = decode_varint(buffer)?.into();
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
            let len: u16 = decode_varint(buffer)?.into();
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

pub fn decode_map(buffer: &mut Buffer) -> RpResult<Value> {
    let mut map = HashMap::<Value, Value>::new();
    let arr_len: u16 = decode_varint(buffer)?.into();
    for _ in 0 .. arr_len {
        let key = decode_field(buffer)?;
        let sub_value = decode_field(buffer)?;
        map.insert(key, sub_value);
    }
    Ok(Value::from(map))
}

pub fn decode_arr(buffer: &mut Buffer) -> RpResult<Value> {
    let mut arr = Vec::<Value>::new();
    let arr_len: u16 = decode_varint(buffer)?.into();
    for _ in 0 .. arr_len {
        let sub_value = decode_field(buffer)?;
        arr.push(sub_value);
    }
    Ok(Value::from(arr))
}

fn decode_by_pattern(buffer: &mut Buffer, pattern: &u8) -> RpResult<Value> {
    match *pattern {
        TYPE_BOOL => {
            decode_bool(buffer, *pattern)
        }
        TYPE_U8 | TYPE_I8 | TYPE_U16 | TYPE_I16 | TYPE_U32 | TYPE_I32 => {
            decode_number(buffer, *pattern)
        }
        TYPE_FLOAT => {
            let val: i64 = decode_varint(buffer)?.into();
            Ok(Value::Float(val as f32 / 1000.0))
        }
        TYPE_DOUBLE => {
            let val: i64 = decode_varint(buffer)?.into();
            Ok(Value::Double(val as f64 / 1000000.0f64))
        }
        TYPE_VARINT => {
            decode_varint(buffer)
        }
        TYPE_STR | TYPE_RAW => decode_str_raw(buffer, *pattern),
        TYPE_MAP => decode_map(buffer),
        TYPE_ARR => decode_arr(buffer),
        TYPE_STR_IDX => {
            let idx: u16 = decode_varint(buffer)?.into();
            Ok(Value::from(buffer.get_str(idx)?))
        },
        // TYPE_AMAP => decode_array!(decode_field(buffer, config), Value::AMap, Value::Map),
        TYPE_NIL => Ok(Value::Nil),
        _ => fail!((ErrorKind::TypeNotMatchError, "must match type")),
    }
}


pub fn decode_field(buffer: &mut Buffer) -> RpResult<Value> {
    let pattern = decode_type(buffer)?.into();
    decode_by_pattern(buffer, &pattern)
}

pub fn decode_proto(buffer: &mut Buffer) -> RpResult<(String, Vec<Value>)> {
    let name = decode_str_raw(buffer, TYPE_STR)?.into();
    
    let str_len: u16 = decode_varint(buffer)?.into();
    for _ in 0..str_len {
        let value = decode_str_raw(buffer, TYPE_STR)?.into();
        buffer.add_str(value);
    }

    let sub_value = decode_field(buffer)?;
    match sub_value {
        Value::Arr(val) => Ok((name, val)),
        _ => Err(make_extension_error("proto is not array", None))
    }
    
}
