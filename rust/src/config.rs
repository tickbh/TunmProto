use super::{RpResult, make_extension_error};

#[derive(Debug)]
pub struct StrConfig {
    pub str_arr: Vec<String>,
}

impl StrConfig {
    pub fn new() -> Self {
        StrConfig { str_arr: Vec::new() }
    }

    pub fn add_str(&mut self, value: String) -> u16 {
        if self.str_arr.contains(&value) {
            self.str_arr.iter().position(|x| x == &value).unwrap() as u16
        } else {
            self.str_arr.push(value);
            self.str_arr.len() as u16 - 1
        }
    }
    
    pub fn get_str(&self, idx: u16) -> RpResult<String> {
        if idx as usize >= self.str_arr.len() {
            Err(make_extension_error("too big index", None))
        } else {
            Ok(self.str_arr[idx as usize].clone())
        }
        
    }
}
