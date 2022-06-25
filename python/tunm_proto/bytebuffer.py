
class ByteBuffer(object):
    def __init__(self):
        self.buffer = bytearray([00]*1024)
        self.wpos = 0
        self.rpos = 0
        self.endianness = "little"
        
        self.str_arr = []
        self.str_map = {}

    @staticmethod
    def allocate(n):
        d = bytearray([00] * n)
        b = ByteBuffer()
        b.__init(d)
        return b

    @staticmethod
    def wrap(data):
        b = ByteBuffer()
        b.__init(data)
        return b

    def __init(self, data):
        if type(data) is not bytearray:
            data = bytearray(data)

        self.buffer = data
        self.wpos = 0
        self.rpos = 0

    def _check_buffer(self, space):
        return (self.wpos - self.rpos) >= space
    
    def _ensure_buffer(self, space):
        if len(self.buffer) - self.wpos > space:
            return True
        now_len = len(self.buffer)
        if now_len < space:
            now_len += space
        new_data = bytearray([00] * now_len)
        self.buffer.extend(new_data)
        return True

    def _read(self, length=1):
        assert self._check_buffer(length), 'Buffer has not enough bytes to read'
        r = self.buffer[self.rpos:self.rpos + length]
        self._read_offsets(length)
        return r

    def _write_offsets(self, value):
        self.wpos += value
        
    def _read_offsets(self, value):
        self.rpos += value
        if self.rpos == self.wpos:
            self.rpos = 0
            self.wpos = 0

    def read(self, length=1):
        return int.from_bytes(self._read(length=length), byteorder=self.endianness)

    def write(self, value, size=0):
        from tunm_proto import TP_DATA_TYPE
        t = type(value)
        if t == int:
            b = int.to_bytes(value, size, byteorder=self.endianness)
        elif t == TP_DATA_TYPE:
            b = int.to_bytes(int(value), 1, byteorder=self.endianness)
        elif t == list:
            b = bytes(value)
        elif t == bytes or t == bytearray:
            b = value
        else:
            raise Exception('Attempting to write unknown object into Buffer')
        l = len(b)
        assert self._ensure_buffer(l), 'Buffer has not enough space left'
        for i in range(l):
            self.buffer[self.wpos + i:self.wpos + i + 1] = b[i:i + 1]
        self._write_offsets(l)
        
    def write_u8(self, value):
        self.write(value, 1)
        
    def write_i8(self, value):
        self.write(value, 1)
        
    def write_u16(self, value):
        self.write(value, 2)
        
    def write_i16(self, value):
        self.write(value, 2)
        
    def write_u32(self, value):
        self.write(value, 4)
        
    def write_i32(self, value):
        self.write(value, 4)
        
    def write_u64(self, value):
        self.write(value, 8)
        
    def write_i64(self, value):
        self.write(value, 8)
        
    def read_u8(self):
        return self.read(1)
        
    def read_i8(self):
        return self.read(1)
        
    def read_u16(self):
        return self.read(2)
        
    def read_i16(self):
        return self.read(2)
        
    def read_u32(self):
        return self.read(4)
        
    def read_i32(self):
        return self.read(4)
        
    def read_u64(self):
        return self.read(8)
        
    def read_i64(self):
        return self.read(8)
    
    def write_str(self, s: str):
        return self.write(s.encode("utf-8"))
    
    def read_str(self, length):
        r = self._read(length)
        return r.decode("utf-8")
    
    def read_bytes(self, length):
        return self._read(length)
    
    def write_bytes(self, b: bytes):
        return self.write(b)
    
    def add_str(self, val):
        if val in self.str_map:
            return self.str_map[val]
        else:
            self.str_arr.append(val)
            self.str_map[val] = len(self.str_arr) - 1
            return len(self.str_arr) - 1
    
    def get_str(self, idx):
        if idx < 0 or idx > len(self.str_arr):
            raise Exception("out of range")
        else:
            return self.str_arr[idx]

    def rewind(self):
        self.wpos = 0
        self.rpos = 0
        
    def all_bytes(self):
        return self.buffer[self.rpos:self.wpos]

    def get_bytes_len(self):
        return self.wpos - self.rpos

    
