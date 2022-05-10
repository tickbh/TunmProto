
function td_check_vaild(buffer, size) {
    return buffer.remaining() >= size
}

function td_check_unvaild(buffer, size) {
    if(!td_check_vaild(buffer, size)) {
        throw new Error("now vaild buffer size")
    }
    return false
}

var IsNull = IsNull || function(value) {
    return value == null || value == undefined
}

function get_type_by_ref(value) {
    var type = typeof(value)
    if (type == "boolean") {
        return TYPE_BOOL
    } else if(type == 'string') {
        return TYPE_STR
    } else if(type == "number") {
        var step = value - Math.floor(value)
        if(step < 0.001) {
            return TYPE_I64
        } else {
            return TYPE_FLOAT
        }
    } else if(type == "object") {
        if(value instanceof String) {
            return TYPE_STR
        } else if(value instanceof Array) {
            return TYPE_ARR
        } else {
            return TYPE_MAP
        }
    }
    return TYPE_NIL
}
