// See https://aka.ms/new-console-template for more information

using proto.tunm;

Console.WriteLine("Hello, World!");

proto.tunm.Test.test_encode_u8();
proto.tunm.Test.test_encode_u16();
proto.tunm.Test.test_encode_u32();
proto.tunm.Test.test_encode_float();
proto.tunm.Test.test_encode_str();
proto.tunm.Test.test_encode_map();
proto.tunm.Test.test_base_proto();

Console.WriteLine("end test!");