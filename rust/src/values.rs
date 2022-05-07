use std::collections::HashMap;
use std::error;
use std::fmt;
use std::io;
use std::hash::Hash;


pub const TYPE_NIL: u8 = 0;
pub const TYPE_U8: u8 = 1;
pub const TYPE_I8: u8 = 2;
pub const TYPE_U16: u8 = 3;
pub const TYPE_I16: u8 = 4;
pub const TYPE_U32: u8 = 5;
pub const TYPE_I32: u8 = 6;
pub const TYPE_U64: u8 = 7;
pub const TYPE_I64: u8 = 8;
pub const TYPE_FLOAT: u8 = 9;
pub const TYPE_STR: u8 = 10;
pub const TYPE_STR_IDX: u8 = 11;
pub const TYPE_RAW: u8 = 12;
pub const TYPE_ARR: u8 = 13;
pub const TYPE_MAP: u8 = 14;

pub const STR_TYPE_NIL: &'static str = "nil";
pub const STR_TYPE_U8: &'static str = "u8";
pub const STR_TYPE_I8: &'static str = "i8";
pub const STR_TYPE_U16: &'static str = "u16";
pub const STR_TYPE_I16: &'static str = "i16";
pub const STR_TYPE_U32: &'static str = "u32";
pub const STR_TYPE_I32: &'static str = "i32";
pub const STR_TYPE_U64: &'static str = "u64";
pub const STR_TYPE_I64: &'static str = "i64";
pub const STR_TYPE_FLOAT: &'static str = "float";
pub const STR_TYPE_STR: &'static str = "str";
pub const STR_TYPE_STR_IDX: &'static str = "str_idx";
pub const STR_TYPE_RAW: &'static str = "raw";
pub const STR_TYPE_ARR: &'static str = "arr";
pub const STR_TYPE_MAP: &'static str = "map";

#[derive(PartialEq, Clone)]
pub enum Value {
    Nil,
    U8(u8),
    I8(i8),
    U16(u16),
    I16(i16),
    U32(u32),
    I32(i32),
    U64(u64),
    I64(i64),
    Float(f32),
    Str(String),
    Raw(Vec<u8>),
    Arr(Vec<Value>),
    Map(HashMap<Value, Value>),
}

impl Eq for Value {
}


impl Hash for Value {
    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
        core::mem::discriminant(self).hash(state);
    }
}

impl fmt::Debug for Value {
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        match *self {
            Value::Nil => write!(fmt, "nil"),
            Value::U8(val) => write!(fmt, "u8({:?})", val),
            Value::I8(val) => write!(fmt, "i8({:?})", val),
            Value::U16(val) => write!(fmt, "u16({:?})", val),
            Value::I16(val) => write!(fmt, "i16({:?})", val),
            Value::U32(val) => write!(fmt, "u32({:?})", val),
            Value::I32(val) => write!(fmt, "i32({:?})", val),
            Value::U64(val) => write!(fmt, "u64({:?})", val),
            Value::I64(val) => write!(fmt, "i64({:?})", val),
            Value::Float(val) => write!(fmt, "float({:?})", val),
            Value::Str(ref val) => write!(fmt, "str({:?})", val),
            Value::Raw(ref val) => write!(fmt, "str({:?})", val),
            Value::Arr(ref val) => write!(fmt, "arr({:?})", val),
            Value::Map(ref val) => write!(fmt, "str({:?})", val),
        }
    }
}

impl From<u8> for Value {
    fn from(val: u8) -> Value {
        Value::U8(val)
    }
}

impl From<i8> for Value {
    fn from(val: i8) -> Value {
        Value::I8(val)
    }
}

impl From<u16> for Value {
    fn from(val: u16) -> Value {
        Value::U16(val)
    }
}

impl From<i16> for Value {
    fn from(val: i16) -> Value {
        Value::I16(val)
    }
}

impl From<u32> for Value {
    fn from(val: u32) -> Value {
        Value::U32(val)
    }
}

impl From<i32> for Value {
    fn from(val: i32) -> Value {
        Value::I32(val)
    }
}

impl From<f32> for Value {
    fn from(val: f32) -> Value {
        Value::Float(val)
    }
}

impl From<String> for Value {
    fn from(val: String) -> Value {
        Value::Str(val)
    }
}

impl From<Vec<u8>> for Value {
    fn from(val: Vec<u8>) -> Value {
        Value::Raw(val)
    }
}

impl From<Vec<Value>> for Value {
    fn from(val: Vec<Value>) -> Value {
        Value::Arr(val)
    }
}

impl From<HashMap<Value, Value>> for Value {
    fn from(val: HashMap<Value, Value>) -> Value {
        Value::Map(val)
    }
}

impl Into<u8> for Value {
    fn into(self) -> u8 {
        match self {
            Value::U8(val) => val,
            _ => panic!("into error type {}", get_name_by_type(get_type_by_value(&self))),
        }
    }
}

impl Into<i8> for Value {
    fn into(self) -> i8 {
        match self {
            Value::I8(val) => val,
            _ => panic!("into error type {}", get_name_by_type(get_type_by_value(&self))),
        }
    }
}

impl Into<u16> for Value {
    fn into(self) -> u16 {
        match self {
            Value::U16(val) => val,
            _ => panic!("into error type {}", get_name_by_type(get_type_by_value(&self))),
        }
    }
}

impl Into<i16> for Value {
    fn into(self) -> i16 {
        match self {
            Value::I16(val) => val,
            _ => panic!("into error type {}", get_name_by_type(get_type_by_value(&self))),
        }
    }
}

impl Into<u32> for Value {
    fn into(self) -> u32 {
        match self {
            Value::U32(val) => val,
            _ => panic!("into error type {}", get_name_by_type(get_type_by_value(&self))),
        }
    }
}

impl Into<i32> for Value {
    fn into(self) -> i32 {
        match self {
            Value::I32(val) => val,
            _ => panic!("into error type {}", get_name_by_type(get_type_by_value(&self))),
        }
    }
}

impl Into<f32> for Value {
    fn into(self) -> f32 {
        match self {
            Value::Float(val) => val,
            _ => panic!("into error type {}", get_name_by_type(get_type_by_value(&self))),
        }
    }
}

impl Into<String> for Value {
    fn into(self) -> String {
        match self {
            Value::Str(val) => val,
            _ => panic!("into error type {}", get_name_by_type(get_type_by_value(&self))),
        }
    }
}

impl Into<Vec<u8>> for Value {
    fn into(self) -> Vec<u8> {
        match self {
            Value::Raw(val) => val,
            _ => panic!("into error type {}", get_name_by_type(get_type_by_value(&self))),
        }
    }
}

impl Into<Vec<Value>> for Value {
    fn into(self) -> Vec<Value> {
        match self {
            Value::Arr(val) => val,
            _ => panic!("into error type {}", get_name_by_type(get_type_by_value(&self))),
        }
    }
}

impl Into<HashMap<Value, Value>> for Value {
    fn into(self) -> HashMap<Value, Value> {
        match self {
            Value::Map(val) => val,
            _ => panic!("into error type {}", get_name_by_type(get_type_by_value(&self))),
        }
    }
}


pub fn get_type_by_value(value: &Value) -> u8 {
    match *value {
        Value::U8(_) => TYPE_U8,
        Value::I8(_) => TYPE_I8,
        Value::U16(_) => TYPE_U16,
        Value::I16(_) => TYPE_I16,
        Value::U32(_) => TYPE_U32,
        Value::I32(_) => TYPE_I32,
        Value::Float(_) => TYPE_FLOAT,
        Value::Str(_) => TYPE_STR,
        Value::Raw(_) => TYPE_RAW,
        Value::Arr(_) => TYPE_ARR,
        Value::Map(_) => TYPE_MAP,
        _ => TYPE_NIL,
    }
}

pub fn get_type_by_name(name: &str) -> u8 {
    match name {
        STR_TYPE_NIL => TYPE_NIL,
        STR_TYPE_U8 => TYPE_U8,
        STR_TYPE_I8 => TYPE_I8,
        STR_TYPE_U16 => TYPE_U16,
        STR_TYPE_I16 => TYPE_I16,
        STR_TYPE_U32 => TYPE_U32,
        STR_TYPE_I32 => TYPE_I32,
        STR_TYPE_FLOAT => TYPE_FLOAT,
        STR_TYPE_STR => TYPE_STR,
        STR_TYPE_RAW => TYPE_RAW,
        STR_TYPE_ARR => TYPE_ARR,
        STR_TYPE_MAP => TYPE_MAP,
        _ => TYPE_NIL,
    }
}

pub fn get_name_by_type(index: u8) -> &'static str {
    match index {
        TYPE_NIL => STR_TYPE_NIL,
        TYPE_U8 => STR_TYPE_U8,
        TYPE_I8 => STR_TYPE_I8,
        TYPE_U16 => STR_TYPE_U16,
        TYPE_I16 => STR_TYPE_I16,
        TYPE_U32 => STR_TYPE_U32,
        TYPE_I32 => STR_TYPE_I32,
        TYPE_FLOAT => STR_TYPE_FLOAT,
        TYPE_STR => STR_TYPE_STR,
        TYPE_RAW => STR_TYPE_RAW,
        TYPE_ARR => STR_TYPE_ARR,
        TYPE_MAP => STR_TYPE_MAP,
        _ => STR_TYPE_NIL,
    }
}
/// An enum of all error kinds.
#[derive(PartialEq, Eq, Copy, Clone, Debug)]
pub enum ErrorKind {
    /// will read bytes over than left bytes
    NoLeftSpaceError,
    /// the buffer over max
    BufferOverMaxError,
    /// The type not match
    TypeNotMatchError,
    /// the buffer can't parse the right data
    ParseError,
    /// miss the major data
    MissingError,
    /// string format must be utf-8
    StringFormatError,
    /// This kind is returned if the redis error is one that is
    /// not native to the system.  This is usually the case if
    /// the cause is another error.
    IoError,
    /// An extension error.  This is an error created by the server
    /// that is not directly understood by the library.
    ExtensionError,
}

#[derive(Debug)]
enum ErrorRepr {
    WithDescription(ErrorKind, &'static str),
    WithDescriptionAndDetail(ErrorKind, &'static str, String),
    ExtensionError(String, String),
    IoError(io::Error),
}

/// Represents a redis error.  For the most part you should be using
/// the Error trait to interact with this rather than the actual
/// struct.
pub struct RpError {
    repr: ErrorRepr,
}

/// Library generic result type.
pub type RpResult<T> = Result<T, RpError>;


impl PartialEq for RpError {
    fn eq(&self, other: &RpError) -> bool {
        match (&self.repr, &other.repr) {
            (&ErrorRepr::WithDescription(kind_a, _), &ErrorRepr::WithDescription(kind_b, _)) => {
                kind_a == kind_b
            }
            (&ErrorRepr::WithDescriptionAndDetail(kind_a, _, _),
             &ErrorRepr::WithDescriptionAndDetail(kind_b, _, _)) => kind_a == kind_b,
            (&ErrorRepr::ExtensionError(ref a, _), &ErrorRepr::ExtensionError(ref b, _)) => {
                *a == *b
            }
            _ => false,
        }
    }
}

impl From<io::Error> for RpError {
    fn from(err: io::Error) -> RpError {
        RpError { repr: ErrorRepr::IoError(err) }
    }
}


impl From<(ErrorKind, &'static str)> for RpError {
    fn from((kind, desc): (ErrorKind, &'static str)) -> RpError {
        RpError { repr: ErrorRepr::WithDescription(kind, desc) }
    }
}

impl From<(ErrorKind, &'static str, String)> for RpError {
    fn from((kind, desc, detail): (ErrorKind, &'static str, String)) -> RpError {
        RpError { repr: ErrorRepr::WithDescriptionAndDetail(kind, desc, detail) }
    }
}

impl error::Error for RpError {
    fn cause(&self) -> Option<&dyn error::Error> {
        match self.repr {
            ErrorRepr::IoError(ref err) => Some(err as &dyn error::Error),
            _ => None,
        }
    }
}

impl fmt::Display for RpError {
    fn fmt(&self, f: &mut fmt::Formatter) -> Result<(), fmt::Error> {
        match self.repr {
            ErrorRepr::WithDescription(_, desc) => desc.fmt(f),
            ErrorRepr::WithDescriptionAndDetail(_, desc, ref detail) => {
                desc.fmt(f)?;
                f.write_str(": ")?;
                detail.fmt(f)
            }
            ErrorRepr::ExtensionError(ref code, ref detail) => {
                code.fmt(f)?;
                f.write_str(": ")?;
                detail.fmt(f)
            }
            ErrorRepr::IoError(ref err) => err.fmt(f),
        }
    }
}

impl fmt::Debug for RpError {
    fn fmt(&self, f: &mut fmt::Formatter) -> Result<(), fmt::Error> {
        fmt::Display::fmt(self, f)
    }
}

/// Indicates a general failure in the library.
impl RpError {
    /// Returns the kind of the error.
    pub fn kind(&self) -> ErrorKind {
        match self.repr {
            ErrorRepr::WithDescription(kind, _) => kind,
            ErrorRepr::WithDescriptionAndDetail(kind, _, _) => kind,
            ErrorRepr::ExtensionError(_, _) => ErrorKind::ExtensionError,
            ErrorRepr::IoError(_) => ErrorKind::IoError,
        }
    }

    /// Returns the name of the error category for display purposes.
    pub fn category(&self) -> &str {
        match self.kind() {
            ErrorKind::NoLeftSpaceError => "no left space error",
            ErrorKind::BufferOverMaxError => "buffer over max error",
            ErrorKind::TypeNotMatchError => "type not match error",
            ErrorKind::ParseError => "parse error",
            ErrorKind::MissingError => "missing error",
            ErrorKind::StringFormatError => "string format error",
            ErrorKind::IoError => "I/O error",
            ErrorKind::ExtensionError => "extension error",
        }
    }

    /// Indicates that this failure is an IO failure.
    pub fn is_io_error(&self) -> bool {
        match self.kind() {
            ErrorKind::IoError => true,
            _ => false,
        }
    }

    /// Returns the extension error code
    pub fn extension_error_code(&self) -> Option<&str> {
        match self.repr {
            ErrorRepr::ExtensionError(ref code, _) => Some(&code),
            _ => None,
        }
    }

    /// Returns the extension error detail
    pub fn extension_error_detail(&self) -> Option<&str> {
        match self.repr {
            ErrorRepr::ExtensionError(_, ref detail) => Some(&detail),
            ErrorRepr::WithDescriptionAndDetail(_, _, ref detail) => Some(&detail),
            _ => None,
        }
    }
}

pub fn make_extension_error(code: &str, detail: Option<&str>) -> RpError {
    RpError {
        repr: ErrorRepr::ExtensionError(code.to_string(),
                                        match detail {
                                            Some(x) => x.to_string(),
                                            None => {
                                                "Unknown extension error encountered".to_string()
                                            }
                                        }),
    }
}
