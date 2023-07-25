use std::io::{Read, Write, Result};
use std::collections::HashMap;
use std::ptr;
use std::fmt;
use std::cmp;

use log::{warn, info, trace};

use crate::{ErrorKind, RpResult};

pub struct Buffer {
    val: Vec<u8>,
    rpos: usize,
    wpos: usize,
    pub str_arr: Vec<String>,
    pub str_map: HashMap<String, u16>,
}

impl Buffer {
    pub fn new() -> Buffer {
        let mut vec = Vec::with_capacity(2048);
        vec.resize(2048, 0);
        Buffer {
            val: vec,
            rpos: 0,
            wpos: 0,
            str_arr: Vec::new(),
            str_map: HashMap::new(),
        }
    }
    
    pub fn add_str(&mut self, value: String) -> u16 {
        if self.str_map.contains_key(&value) {
            self.str_map[&value]
        } else {
            self.str_arr.push(value.clone());
            self.str_map.insert(value, self.str_arr.len() as u16 - 1);
            self.str_arr.len() as u16 - 1
        }
    }

    pub fn get_str(&self, idx: u16) -> RpResult<String> {
        if idx as usize >= self.str_arr.len() {
            fail!((ErrorKind::BufferOverMaxError, "must left space to read "));
        } else {
            Ok(self.str_arr[idx as usize].clone())
        }
    }

    pub fn get_data(&self) -> &Vec<u8> {
        &self.val
    }

    pub fn get_write_data(&self) -> &[u8] {
        &self.val[self.rpos .. self.wpos]
    }
    
    pub fn len(&self) -> usize {
        self.val.len()
    }

    pub fn data_len(&self) -> usize {
        if self.wpos > self.rpos {
            (self.wpos - self.rpos) as usize
        } else {
            0
        }
    }

    pub fn set_rpos(&mut self, rpos: usize) {
        self.rpos = rpos;
    }

    pub fn get_rpos(&self) -> usize {
        self.rpos
    }

    pub fn set_wpos(&mut self, wpos: usize) {
        self.wpos = wpos;
    }

    pub fn get_wpos(&self) -> usize {
        self.wpos
    }
    
    pub fn get_read_array(&mut self, max_bytes: usize) -> &mut [u8] {
        if self.val.len() - self.wpos < max_bytes {
            self.val.resize(self.wpos + max_bytes + 1, 0);
        }
        &mut self.val[self.wpos .. (self.wpos+max_bytes-1)]
    }

    pub fn write_offset(&mut self, pos: usize) {
        self.wpos = self.wpos + pos;
    }
    
    pub fn read_offset(&mut self, pos: usize) -> bool {
        self.rpos = self.rpos + pos;
        self.fix_buffer();
        self.rpos == self.wpos
    }

    pub fn drain(&mut self, pos: usize) {
        self.rpos = self.rpos - cmp::min(self.rpos, pos);
        self.wpos = self.wpos - cmp::min(self.wpos, pos);
        let pos = cmp::min(self.val.len(), pos);
        self.val.drain(..pos);
        self.fix_buffer();
    }

    pub fn drain_collect(&mut self, pos: usize) -> Vec<u8> {
        self.rpos = self.rpos - cmp::min(self.rpos, pos);
        self.wpos = self.wpos - cmp::min(self.wpos, pos);
        let pos = cmp::min(self.val.len(), pos);
        let ret = self.val.drain(..pos).collect();
        self.fix_buffer();
        ret
    }
    
    pub fn drain_all_collect(&mut self) -> Vec<u8> {
        let (rpos, wpos) = (self.rpos, self.wpos);
        self.clear();
        self.val.drain(rpos..wpos).collect()
    }

    pub fn fix_buffer(&mut self) -> bool {
        if self.rpos >= self.wpos {
            self.rpos = 0;
            self.wpos = 0;

            if self.val.len() > 512000 {
                self.val.resize(512000, 0);
                warn!("TunmProto: buffer len big than 512k, resize to 512k");
            } else {
                trace!("TunmProto: read all size, reset to zero");
            }
        } else if self.rpos > self.val.len() / 2 {
            unsafe {
                ptr::copy(&self.val[self.rpos], &mut self.val[0], self.wpos - self.rpos);
                info!("TunmProto: fix buffer {} has half space so move position", self.rpos);
                (self.rpos, self.wpos) = (0, self.wpos - self.rpos);
            }
        }
        true
    }

    pub fn clear(&mut self) {
        self.rpos = 0;
        self.wpos = 0;
    }

    pub fn extend(&mut self, buffer: &Buffer) -> Result<usize> {
        self.write(buffer.get_write_data())
    }
}

impl fmt::Debug for Buffer {
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        write!(fmt, "bytes ({:?})", self.val)
    }
}

impl Read for Buffer {
    #[inline(always)]
    fn read(&mut self, buf: &mut [u8]) -> Result<usize> {
        let left = self.wpos - self.rpos;
        if left == 0 || buf.len() == 0 {
            return Ok(0);
        }
        let read = if left > buf.len() {
            buf.len()
        } else {
            left
        };
        unsafe {
            ptr::copy(&self.val[self.rpos], &mut buf[0], read);
        }
        self.rpos += read;
        Ok(read)
    }

    
}

impl Write for Buffer {
    #[inline(always)]
    fn write(&mut self, buf: &[u8]) -> Result<usize> {
        if self.val.len() < self.wpos + buf.len() {
            self.val.resize((self.wpos + buf.len()) * 2, 0);
            if self.val.len() > 512000 {
                warn!("TunmProto: resize buffer length to {:?}k", self.val.len() / 1024);
            }
        }
        if buf.len() == 0 {
            return Ok(buf.len());
        }
        unsafe {
            ptr::copy(&buf[0], &mut self.val[self.wpos], buf.len());
        }
        self.wpos += buf.len();
        Ok(buf.len())
    }

    fn flush(&mut self) -> Result<()> {
        Ok(())
    }
}
