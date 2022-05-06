extern crate rt_proto as rt;

fn main()
{
    println!("welcome to tickdream rust protocol");
    let value = rt::Value::from(rt::get_type_by_name("u8") as u8);
    println!("value = {:?}", value);
}
