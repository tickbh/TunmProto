
namespace proto.tunm {
    class Buffer {
        byte[] val;
        int rpos;
        int wpos;

        public byte[] one_temp;
        public byte[] two_temp;
        public byte[] four_temp;

        public List<String> str_arr;
        Dictionary<String, int> str_map;

        public Buffer() {
            this.val = new byte[2048];
            this.str_arr = new List<String>();
            this.str_map = new Dictionary<String, int>();

            this.one_temp = new byte[1]{0};
            this.two_temp = new byte[2]{0, 0};
            this.four_temp = new byte[4]{0, 0, 0, 0};
        }

        public int add_str(String value) {
            if(this.str_map.ContainsKey(value)) {
                return this.str_map[value];
            } else {
                var old = this.str_arr.Count;
                this.str_arr.Add(value);
                this.str_map.Add(value, old);
                return old;
            }
        }

        public String? get_str(int idx) {
            if (idx >= this.str_arr.Count || idx < 0) {
                return null;
            }
            return this.str_arr[idx];
        }

        public byte[] get_data() {
            return this.val;
        }

        public byte[] get_write_data() {
            return this.val.Skip(this.rpos).Take(this.wpos - this.rpos).ToArray();
        }

        public int len() {
            return this.val.Length;
        }

        public int data_len() {
            return Math.Max(this.wpos - this.rpos, 0);
        }

        public void set_rpos(int rpos) {
            this.rpos = rpos;
        }

        public int get_rpos() {
            return this.rpos;
        }

        public void set_wpos(int wpos) {
            this.wpos = wpos;
        }

        public int get_wpos() {
            return this.wpos;
        }

        public void clear() {
            this.rpos = 0;
            this.wpos = 0;
        }

        public void extend(Buffer buffer) {
            this.write(buffer.get_write_data());
        }

        public uint read(ref byte[] buf) {
            var left = this.wpos - this.rpos;
            if(left == 0 || this.val.Length == 0) {
                return 0;
            }
            var read = left > buf.Length ? buf.Length : left;
            Array.Copy(this.val, this.rpos, buf, 0, read);
            this.rpos += read;
            if(this.rpos >= this.wpos) {
                this.rpos = 0;
                this.wpos = 0;
            }
            return (uint)read;
        }

        public uint write(byte[] buf) {
            if(this.val.Length < this.wpos + buf.Length) {
                Array.Resize(ref this.val, (this.wpos + buf.Length) * 2);
            }
            if(buf.Length == 0) {
                return 0;
            }

            Array.Copy(buf, 0, this.val, this.wpos, buf.Length);
            this.wpos += buf.Length;
            return (uint)buf.Length;
        }




    }
}