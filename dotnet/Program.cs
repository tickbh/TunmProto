// See https://aka.ms/new-console-template for more information

using proto.tunm;


Console.WriteLine("Hello, World!");
List<Object> value = new List<Object>();
value.Add("11????????????");

Console.WriteLine("obj null type = " + value.GetType().Name);

Dictionary<Object, Object> value1 = new Dictionary<Object, Object>();

Console.WriteLine("obj null type = " + value1.GetType().Name);
byte[] ok = new byte[1];
Console.WriteLine("obj null type = " + ok.GetType().Name);

proto.tunm.Test.test_encode_u8();
proto.tunm.Test.test_encode_u16();
proto.tunm.Test.test_encode_u32();
proto.tunm.Test.test_encode_float();
proto.tunm.Test.test_encode_str();
proto.tunm.Test.test_encode_map();
proto.tunm.Test.test_base_proto();
