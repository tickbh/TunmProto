use std::io::Write;
use std::mem;
use std::collections::HashMap;

use crate::{TYPE_ARR, TYPE_STR, TYPE_STR_IDX};

use super::{Value, Buffer, Field, RpResult, ErrorKind, get_type_by_name, get_name_by_type, get_type_by_value, STR_TYPE_NIL};

#[derive(Debug)]
pub struct EncodeConfig {
    msg_name: String,
    str_idx: HashMap<String, u16>,
    now_idx: u16,
}

impl EncodeConfig {
    pub fn new(msg_name: String) -> Self {
        EncodeConfig { msg_name: msg_name, str_idx: HashMap::new(), now_idx: 0 }
    }

    pub fn add_str(&mut self, value: String) -> u16 {
        if self.str_idx.contains_key(&value) {
            self.str_idx[&value]
        } else {
            self.now_idx += 1;
            self.str_idx.insert(value, self.now_idx);
            self.now_idx
        }
    }
}


fn append_and_align(buffer: &mut Buffer, val: &[u8]) -> RpResult<()> {
    let _add = match val.len() % 2 {
        0 => 0,
        val => 2 - val,
    };
    buffer.write(val)?;
    Ok(())
}


pub fn encode_sure_type(buffer: &mut Buffer, value: u16) -> RpResult<()> {
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
        Value::Float(val) => {
            let val = (val * 1000.0) as i32;
            buffer.write(unsafe { &mem::transmute::<i32, [u8; 4]>(val.to_le()) })?;
        }
        _ => unreachable!("encode_number only"),
    }
    Ok(())
}

pub fn encode_str_idx(buffer: &mut Buffer, config: &mut EncodeConfig, pattern: &str) -> RpResult<()> {
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

pub fn encode_map(buffer: &mut Buffer, config: &mut EncodeConfig, value: &Value) -> RpResult<()> {
    match *value {
        Value::Map(ref val) => {
            encode_type(buffer, value);
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


pub fn write_field(buffer: &mut Buffer, field: Option<&Field>) -> RpResult<bool> {
    if field.is_none() {
        return Ok(false);
    }
    let field = field.unwrap();
    encode_number(buffer, &Value::U16(field.index))?;
    encode_number(buffer, &Value::U16(get_type_by_name(&field.pattern)))?;
    Ok(true)
}

pub fn encode_field(buffer: &mut Buffer, config: &mut EncodeConfig, value: &Value) -> RpResult<()> {
    match *value {
        Value::U8(_) |
        Value::I8(_) |
        Value::U16(_) |
        Value::I16(_) |
        Value::U32(_) |
        Value::I32(_) |
        Value::Float(_) => {
            encode_type(buffer, value)?;
            encode_number(buffer, value)?;
        }
        Value::Str(_) | Value::Raw(_) => {
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

pub fn encode_proto(buffer: &mut Buffer,
                    name: &String,
                    infos: Vec<Value>)
                    -> RpResult<()> {
    let mut config = EncodeConfig::new(name.to_string());
    encode_str_raw(buffer, &Value::Str(name.clone()))?;
    encode_sure_type(buffer, TYPE_ARR)?;
    for info in &infos {
        encode_field(buffer, &mut config, info)?;
    }
    Ok(())
}
