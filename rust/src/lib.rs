
extern crate rustc_serialize;

pub mod macros;
pub mod values;
pub mod config;
pub mod buffer;
pub mod encode;
pub mod decode;

pub use values::*;
pub use config::{Field, Proto, StrConfig};
pub use buffer::Buffer;
pub use encode::{encode_proto, encode_field, encode_number, encode_map, encode_type, encode_sure_type, 
                 encode_str_raw};
pub use decode::{decode_proto, decode_field, read_field, decode_number, decode_map, decode_str_raw};
