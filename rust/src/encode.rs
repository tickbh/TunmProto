use std::io::Write;
use std::mem;

use crate::{get_type_by_value, Buffer, RpResult, StrConfig, Value, TYPE_STR_IDX};

fn append_and_align(buffer: &mut Buffer, val: &[u8]) -> RpResult<()> {
    let _add = match val.len() % 2 {
        0 => 0,
        val => 2 - val,
    };
    buffer.write(val)?;
    Ok(())
}

pub fn encode_sure_type(buffer: &mut Buffer, value: u8) -> RpResult<()> {
    buffer.write(unsafe { &mem::transmute::<u8, [u8; 1]>(value as u8) })?;
    Ok(())
}

pub fn encode_type(buffer: &mut Buffer, value: &Value) -> RpResult<()> {
    buffer.write(unsafe { &mem::transmute::<u8, [u8; 1]>(get_type_by_value(value) as u8) })?;
    Ok(())
}

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

pub fn encode_str_idx(buffer: &mut Buffer, config: &mut StrConfig, pattern: &str) -> RpResult<()> {
    let idx = config.add_str(pattern.to_string());
    encode_sure_type(buffer, TYPE_STR_IDX)?;
    encode_number(buffer, &Value::U16(idx))?;
    Ok(())
}

pub fn encode_str_raw(buffer: &mut Buffer, value: &Value) -> RpResult<()> {
    match *value {
        Value::Str(ref val) => {
            encode_number(buffer, &Value::U16(val.len() as u16))?;
            append_and_align(buffer, &val.as_bytes()[..])?;
        }
        Value::Raw(ref val) => {
            encode_number(buffer, &Value::U16(val.len() as u16))?;
            append_and_align(buffer, &val[..])?;
        }
        _ => unreachable!("encode_str_raw only"),
    }
    Ok(())
}

pub fn encode_map(buffer: &mut Buffer, config: &mut StrConfig, value: &Value) -> RpResult<()> {
    match *value {
        Value::Map(ref val) => {
            encode_number(buffer, &Value::from(val.len() as u16))?;
            for (name, sub_value) in val {
                encode_field(buffer, config, name)?;
                encode_field(buffer, config, sub_value)?;
            }
        }
        _ => unreachable!("encode_map only"),
    }
    Ok(())
}

pub fn encode_field(buffer: &mut Buffer, config: &mut StrConfig, value: &Value) -> RpResult<()> {
    match &*value {
        Value::U8(_)
        | Value::I8(_)
        | Value::U16(_)
        | Value::I16(_)
        | Value::U32(_)
        | Value::I32(_)
        | Value::U64(_)
        | Value::I64(_)
        | Value::Float(_)
        | Value::Double(_) => {
            encode_type(buffer, value)?;
            encode_number(buffer, value)?;
        }
        Value::Str(ref pattern) => {
            encode_str_idx(buffer, config, pattern)?;
        }
        Value::Raw(_) => {
            encode_type(buffer, value)?;
            encode_str_raw(buffer, value)?;
        }
        Value::Arr(ref val) => {
            encode_type(buffer, value)?;
            encode_number(buffer, &Value::from(val.len() as u16))?;
            for v in val {
                encode_field(buffer, config, v)?;
            }
        }
        Value::Map(_) => {
            encode_type(buffer, value)?;
            encode_map(buffer, config, value)?;
        }
        Value::Nil => {}
    }
    Ok(())
}

pub fn encode_proto(buffer: &mut Buffer, name: &String, infos: Vec<Value>) -> RpResult<()> {
    let mut config = StrConfig::new();

    let mut sub_buffer = Buffer::new();
    encode_str_raw(&mut sub_buffer, &Value::Str(name.clone()))?;
    encode_field(&mut sub_buffer, &mut config, &Value::from(infos))?;

    encode_number(buffer, &Value::U16(config.str_arr.len() as u16))?;
    for v in config.str_arr {
        encode_str_raw(buffer, &Value::Str(v))?;
    }
    buffer.extend(&sub_buffer)?;
    Ok(())
}
