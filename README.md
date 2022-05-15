# tunm_proto
simple binary proto
一种简单的二进制数据协议

## suport type
基本支持的类型 "u8",   "i8",   "u16",   "i16",   "u32",   "i32", "u64",   "i64", "varint", "float",   "string",  "raw",   "map", "array"

## 数据使用, 以Rust为例
```rust
extern crate tunm_proto as tunm;
use tunm::{Value, Buffer};

mod test_data;
use std::collections::{HashMap};

fn main()
{
    println!("welcome to tickdream rust protocol");

    let mut hash_value = HashMap::<Value, Value>::new();
    hash_value.insert(Value::Str("name".to_string()), Value::Str("tunm_proto".to_string()));
    hash_value.insert(Value::Str("tunm_proto".to_string()), Value::U16(1 as u16));

    {
        let mut buffer = Buffer::new();
        tunm::encode_proto(&mut buffer, &"cmd_test_op".to_string(), vec![Value::Map(hash_value.clone())]).unwrap();
        let just_str = "
        [\"cmd_test_op\", [\"tunm_proto\", {\"name\": \"tunm_proto\", \"tunm_proto\": 1}]]
        ";
        println!("just json len = {}", just_str.len());
        println!("buffer len == {}", buffer.data_len());
        // just read field
        let read = tunm::decode_proto(&mut buffer).unwrap();
        match read {
            (name, val) => {
                assert_eq!(name, "cmd_test_op".to_string());
                assert_eq!(val[0], Value::Map(hash_value));
                assert_eq!(val.len(), 1);
            }
        }
    }
}

```

### 格式说明
数据协议分为三部分(协议名称, 字符串索引区, 数据区(默认为数组))
如数据协议名为cmd_test_op, 数据为["tunm_proto", {"name": "tunm_proto", "tunm_proto": 1}]
1.那么数据将先压缩协议名cmd_test_op, 将先写下可变长度(varint)值为11占用1字节, 然后再写入cmd_test_op的utf8的字节数
2.接下来准备写入字符串索引区, 索引数据用到的字符串为["tunm_proto", "name"]两个字符串, 即将写入可变长度(varint)值为2占用一字节, 然后分别写入字符串tunm_proto和name两个字符串, 这样子字符串相接近有利于压缩, 且如果有相同的字符串可以更好的进行复用
3.接下来准备写入数据区, 
首先判断为一个数组, 写入类型u8(TYPE_ARR=16), 写入数组长度varint(2), 准备开始写第一个数据, 字符串tunm_proto, 已转成id, 则写入类型u8(TYPE_STR_IDX=14), 查索引号0, 则写入varint(0), 第一个字段写入完毕, 接下来第二个字段是一个map数据, 写入map长度varint(2), 然后进行遍历得到key值为name, 则写入写入类型u8(TYPE_STR_IDX=14),查索引号1, 则写入varint(1), 然后开始写name对应的值tunm_proto, 写入TYPE_STR_IDX类型的0值, 则这组key写入完毕, 依此类推写入第二组数据

测试打印的结果
用完整的level-full4.json

```
原始的JSON长度 = 2.2M
解析JSON用时 = Ok(1.520187s)
用tunm_proto压缩test_level4_json的长度 = 370k
压缩JSON耗时 = Ok(31.842ms)
name = cmd_level4_full
解析buffer耗时 = Ok(22.642ms)
```
解析速度约为JSON的68倍, 符合预期, 大小为明文的0.16倍, 符合压缩比
