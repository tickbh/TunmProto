use std::io::Write;
use std::mem;

use crate::{get_type_by_value, Buffer, RpResult, Value, TYPE_STR_IDX, TYPE_VARINT, TYPE_FLOAT, TYPE_DOUBLE};

#[inline(always)]
fn append_and_align(buffer: &mut Buffer, val: &[u8]) -> RpResult<()> {
    let _add = match val.len() % 2 {
        0 => 0,
        val => 2 - val,
    };
    buffer.write(val)?;
    Ok(())
}

#[inline(always)]
pub fn encode_sure_type(buffer: &mut Buffer, value: u8) -> RpResult<()> {
    buffer.write(unsafe { &mem::transmute::<u8, [u8; 1]>(value as u8) })?;
    Ok(())
}

#[inline(always)]
pub fn encode_type(buffer: &mut Buffer, value: &Value) -> RpResult<()> {
    buffer.write(unsafe { &mem::transmute::<u8, [u8; 1]>(get_type_by_value(value) as u8) })?;
    Ok(())
}

#[inline(always)]
pub fn encode_bool(buffer: &mut Buffer, value: &Value) -> RpResult<()> {
    match *value {
        Value::Bool(val) => {
            buffer.write(unsafe { &mem::transmute::<u8, [u8; 1]>(if val { 1 } else { 0 }) })?;
        }
        _ => unreachable!("encode_number only"),
    }
    Ok(())
}

#[inline(always)]
pub fn encode_number(buffer: &mut Buffer, value: &Value) -> RpResult<()> {
    match *value {
        Value::U8(val) => {
            buffer.write(unsafe { &mem::transmute::<u8, [u8; 1]>(val) })?;
        }
        Value::I8(val) => {
            buffer.write(unsafe { &mem::transmute::<i8, [u8; 1]>(val) })?;
        }
        Value::U16(val) => {
            buffer.write(unsafe { &mem::transmute::<u16, [u8; 2]>(val.to_le()) })?;
        }
        Value::I16(val) => {
            buffer.write(unsafe { &mem::transmute::<i16, [u8; 2]>(val.to_le()) })?;
        }
        Value::U32(val) => {
            buffer.write(unsafe { &mem::transmute::<u32, [u8; 4]>(val.to_le()) })?;
        }
        Value::I32(val) => {
            buffer.write(unsafe { &mem::transmute::<i32, [u8; 4]>(val.to_le()) })?;
        }
        Value::U64(val) => {
            buffer.write(unsafe { &mem::transmute::<u64, [u8; 8]>(val.to_le()) })?;
        }
        Value::I64(val) => {
            buffer.write(unsafe { &mem::transmute::<i64, [u8; 8]>(val.to_le()) })?;
        }
        Value::Float(val) => {
            let val = (val * 1000.0) as i32;
            buffer.write(unsafe { &mem::transmute::<i32, [u8; 4]>(val.to_le()) })?;
        }
        Value::Double(val) => {
            let val = (val * 1000000.0) as i64;
            buffer.write(unsafe { &mem::transmute::<i64, [u8; 8]>(val.to_le()) })?;
        }
        _ => unreachable!("encode_number only"),
    }
    Ok(())
}

#[inline(always)]
pub fn encode_varint(buffer: &mut Buffer, value: &Value) -> RpResult<()> {
    let val = match *value {
        Value::U8(val) => {
            val as i64
        }
        Value::I8(val) => {
            val as i64
        }
        Value::U16(val) => {
            val as i64
        }
        Value::I16(val) => {
            val as i64
        }
        Value::U32(val) => {
            val as i64
        }
        Value::I32(val) => {
            val as i64
        }
        Value::U64(val) => {
            val as i64
        }
        Value::I64(val) => {
            val as i64
        }
        Value::Varint(val) => {
            val as i64
        }
        Value::Float(val) => {
            let val = (val * 1000.0) as i32;
            val as i64
        }
        Value::Double(val) => {
            let val = (val * 1000000.0) as i64;
            val as i64
        }
        _ => unreachable!("encode_number only"),
    };
    let mut real = if val < 0 { 
        (-(val + 1)) as u64 * 2 + 1
    } else { 
        (val as u64) * 2
    };
    loop {
        let data = (real & 0x7F) as u8;
        real = real >> 7;
        if real == 0 {
            buffer.write(&[data])?;
            break;
        } else {
            buffer.write(&[data | 0x80])?;
        }
    }
    Ok(())
}

#[inline(always)]
pub fn encode_str_idx(buffer: &mut Buffer, pattern: &str) -> RpResult<()> {
    let idx = buffer.add_str(pattern.to_string());
    encode_sure_type(buffer, TYPE_STR_IDX)?;
    encode_varint(buffer, &Value::U16(idx))?;
    Ok(())
}

#[inline(always)]
pub fn encode_str_raw(buffer: &mut Buffer, value: &Value) -> RpResult<()> {
    match *value {
        Value::Str(ref val) => {
            encode_varint(buffer, &Value::U16(val.as_bytes().len() as u16))?;
            append_and_align(buffer, &val.as_bytes()[..])?;
        }
        Value::Raw(ref val) => {
            encode_varint(buffer, &Value::U16(val.len() as u16))?;
            append_and_align(buffer, &val[..])?;
        }
        _ => unreachable!("encode_str_raw only"),
    }
    Ok(())
}

pub fn encode_map(buffer: &mut Buffer, value: &Value) -> RpResult<()> {
    match *value {
        Value::Map(ref val) => {
            encode_varint(buffer, &Value::from(val.len() as u16))?;
            for (name, sub_value) in val {
                encode_field(buffer, name)?;
                encode_field(buffer, sub_value)?;
            }
        }
        _ => unreachable!("encode_map only"),
    }
    Ok(())
}

pub fn encode_field(buffer: &mut Buffer, value: &Value) -> RpResult<()> {
    match &*value {
        Value::Bool(_) => {
            encode_type(buffer, value)?;
            encode_bool(buffer, value)?;
        }
        Value::U8(_)
        | Value::I8(_) => {
            encode_type(buffer, value)?;
            encode_number(buffer, value)?;
        }
        Value::U16(_)
        | Value::I16(_)
        | Value::U32(_)
        | Value::I32(_)
        | Value::U64(_)
        | Value::I64(_)
        | Value::Varint(_) => {
            encode_sure_type(buffer, TYPE_VARINT)?;
            encode_varint(buffer, value)?;
        }
        | Value::Float(_) => {
            encode_sure_type(buffer, TYPE_FLOAT)?;
            encode_number(buffer, value)?;
        }
        | Value::Double(_) => {
            encode_sure_type(buffer, TYPE_DOUBLE)?;
            encode_number(buffer, value)?;
        }
        Value::Str(ref pattern) => {
            encode_str_idx(buffer, pattern)?;
        }
        Value::Raw(_) => {
            encode_type(buffer, value)?;
            encode_str_raw(buffer, value)?;
        }
        Value::Arr(ref val) => {
            encode_type(buffer, value)?;
            encode_varint(buffer, &Value::from(val.len() as u16))?;
            for v in val {
                encode_field(buffer, v)?;
            }
        }
        Value::Map(_) => {
            encode_type(buffer, value)?;
            encode_map(buffer, value)?;
        }
        Value::Nil => {
            encode_type(buffer, value)?;
        }
    }
    Ok(())
}

pub fn encode_proto(buffer: &mut Buffer, name: &String, infos: Vec<Value>) -> RpResult<()> {
    let mut sub_buffer = Buffer::new();
    encode_field(&mut sub_buffer, &Value::from(infos))?;

    encode_str_raw(buffer, &Value::Str(name.clone()))?;
    encode_varint(buffer, &Value::U16(sub_buffer.str_arr.len() as u16))?;
    for v in &sub_buffer.str_arr {
        encode_str_raw(buffer, &Value::Str(v.to_string()))?;
    }

    buffer.extend(&sub_buffer)?;
    Ok(())
}
