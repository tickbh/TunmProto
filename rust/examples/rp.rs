extern crate rt_proto as rt;

use std::fs::File;
use std::io::prelude::*;
use std::io;

fn read_all(name : &str) -> io::Result<String> {
    let mut f = File::open(name)?;
    let mut s = String::new();
    f.read_to_string(&mut s)?;
    Ok(s)
}

fn main()
{
    println!("welcome to tickdream rust protocol");
    let value = rt::Value::from(rt::get_type_by_name("u8") as u8);
    println!("value = {:?}", value);
    
    

}
