use std::io::{Read, Write, Result};
use std::ptr;
use std::fmt;
use std::cmp;

pub struct Buffer {
    val: Vec<u8>,
    rpos: usize,
    wpos: usize,
}

impl Buffer {
    pub fn new() -> Buffer {
        Buffer {
            val: Vec::new(),
            rpos: 0,
            wpos: 0,
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

    pub fn drain(&mut self, pos: usize) {
        self.rpos = self.rpos - cmp::min(self.rpos, pos);
        self.wpos = self.wpos - cmp::min(self.wpos, pos);
        let pos = cmp::min(self.val.len(), pos);
        self.val.drain(..pos);
    }

    pub fn drain_collect(&mut self, pos: usize) -> Vec<u8> {
        self.rpos = self.rpos - cmp::min(self.rpos, pos);
        self.wpos = self.wpos - cmp::min(self.wpos, pos);
        let pos = cmp::min(self.val.len(), pos);
        self.val.drain(..pos).collect()
    }

    pub fn clear(&mut self) {
        self.val.clear();
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
        if self.rpos >= self.wpos {
            self.rpos = 0;
            self.wpos = 0;
        }
        Ok(read)
    }
}

impl Write for Buffer {
    fn write(&mut self, buf: &[u8]) -> Result<usize> {
        if self.val.len() < self.wpos + buf.len() {
            self.val.resize(self.wpos + buf.len(), 0);
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
