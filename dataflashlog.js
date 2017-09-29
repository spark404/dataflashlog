const util = require('util')
const {U64, I64} = require('n64');

// These are needed for the timestamp calculation
const gpsEpochSeconds = 315964800;
const weekSeconds = 60 * 60 * 24 * 7;

module.exports = {
    parse: parse,
    _readValue: _readValue
}

function gpsToEpochMicroseconds(gms, gwk) {
	// gms Time of Week
	// gwk Week number
	console.log("gms=" + gms + ", gwk=" + gwk + " => " + (gpsEpochSeconds + weekSeconds * gwk + gms))
	return (gpsEpochSeconds + weekSeconds * gwk) * 1000 + gms
}

function parse(binaryData, callback) {
	var index = 0
    var formats = {}

    results = {}
    results['messages'] = []

    while (index + 4 < binaryData.length) {

	    if (binaryData[index + 0] != 0xff && binaryData[index + 1] != 0xff) {
	    	// We have a valid message
	    	// third byte is the message id
	    	var msgid = binaryData[index + 2]
	    	var size = 0

	    	if (msgid == 0x80) { // FMT
	    		var msgtype = binaryData[index + 3]
		    	var length = binaryData[index + 4]
		    	var name = binaryData.slice(index + 5, index + 5 + 4)
		    	var types = binaryData.slice(index + 9, index + 9 + 16)
		    	var labels = binaryData.slice(index + 25, index + 25 + 64)

		    	formats[msgtype] = {}
		    	formats[msgtype]['size'] = length
		    	formats[msgtype]['name'] = name.toString().replace(/\0/g, '')
		    	formats[msgtype]['format'] = types.toString().replace(/\0/g, '')
		    	formats[msgtype]['labels'] = labels.toString().replace(/\0/g, '').split(",")
		    	
		    	//console.log("New message format for message " + msgtype + " : " + util.inspect(formats[msgtype]))
	    	}
	    	if (msgid in formats) {
	    		// console.log("Message " + formats[msgid]['name'] + " with length " + formats[msgid]['size'] )
	    		var message = binaryData.slice(index, index + formats[msgid]['size'])

	    		var format = formats[msgid]['format']
	    		var offset = 3; // Start after the header

	    		event = {}
	    		event['name'] = formats[msgid]['name']

	    		for (var x = 0; x < format.length; x++)
				{
				    var formatChar = format.charAt(x)
				    var result = _readValue(message, offset, formatChar)
				    event[formats[msgid]['labels'][x]] = result.value;
				    offset = offset + result.bytesRead
				}

				//console.log(util.inspect(event))
				results['messages'].push(event)

				if (event.name == 'GPS' && !results.hasOwnProperty('referenceTimestamp')) {
					// We have a GPS event, so we can determine the timeofday
					var referenceTimestamp = {}
					referenceTimestamp['timeus'] = event.TimeUS;
					referenceTimestamp['reference'] = gpsToEpochMicroseconds(event.GMS, event.GWk)

					results.referenceTimestamp = referenceTimestamp;
					console.log(util.inspect(event))
					console.log(util.inspect(referenceTimestamp))
				}
	    	} else {
	    		console.warn("Unknown messageId " + msgid)
	    	}

	    	index = index + formats[msgid]['size']
	    }
	    else {
	    	console.warn("Skipping a byte!")
	    	index = index + 1
	    }
	}

    callback(null, results)
}

function _readValue(message, offset, formatChar) {
	var result = {}
    result.value = undefined;
    result.bytesRead = 0;
    result.formatChar = formatChar;

    var uint8array = new Uint8Array(message)

    switch (formatChar) {
    	case 'b': //ctypes.c_int8
            var array = new Int8Array(uint8array.buffer.slice(offset, offset + 1))
    		result.value = array[0]
    		result.bytesRead = 1
    		break;
    	case 'B': //ctypes.c_uint8
    	case 'M': //ctypes.c_uint8
            var array = new Uint8Array(uint8array.buffer.slice(offset, offset + 1))
    		result.value = array[0]
    		result.bytesRead = 1
    		break;
    	case 'h': //ctypes.c_int16
    	    var array16 = new Int16Array(uint8array.buffer.slice(offset, offset + 2))
    	    result.value = array16[0]
    		result.bytesRead = 2
    		break;
    	case 'H': // ctypes.c_uint16
    	    var array16 = new Uint16Array(uint8array.buffer.slice(offset, offset + 2))
    	    result.value = array16[0]
    		result.bytesRead = 2
    		break;
    	case 'i': // ctypes.c_int32
    	case 'L': // ctypes.c_int32
    		var array32 = new Int32Array(uint8array.buffer.slice(offset, offset + 4))
    	    result.value = array32[0]
    	    result.bytesRead = 4
    		break;
    	case 'I': // ctypes.c_uint32
    		var array32 = new Uint32Array(uint8array.buffer.slice(offset, offset + 4))
    	    result.value = array32[0]
    		result.bytesRead = 4
    		break;
    	case 'f': // ctypes.c_float
    		var arrayf = new Float32Array(uint8array.buffer.slice(offset, offset + 4))
    		result.value = arrayf[0]
    		result.bytesRead = 4
    		break;
    	case 'd': //ctypes.c_double
    		var arrayf = new Float64Array(uint8array.buffer.slice(offset, offset + 8))
    		result.value = arrayf[0]
    		result.bytesRead = 8
    		break;
    	case 'n': // ctypes.c_char * 4
    		result.value = message.slice(offset, offset + 4).toString().replace(/\0/g, '')
    		result.bytesRead = 4
    		break;
    	case 'N': // ctypes.c_char * 16
    		result.value = message.slice(offset, offset + 16).toString().replace(/\0/g, '')
    		result.bytesRead = 16
    		break;
    	case 'Z': // ctypes.c_char * 64
    		result.value = message.slice(offset, offset + 64).toString().replace(/\0/g, '')
    		result.bytesRead = 64
    		break;
    	case 'c': // ctypes.c_int16 * 100
    		var array16 = new Int16Array(uint8array.buffer.slice(offset, offset + 2))
    	    result.value = array16[0] / 100
    		result.bytesRead = 2
    		break;
    	case 'C': // ctypes.c_uint16 * 100
    		var array16 = new Uint16Array(uint8array.buffer.slice(offset, offset + 2))
    	    result.value = array16[0] / 100
    		result.bytesRead = 2
    		break;
    	case 'e': // ctypes.c_int32 * 100
    		var array32 = new Int32Array(uint8array.buffer.slice(offset, offset + 4))
    	    result.value = array32[0] / 100
    		result.bytesRead = 4
    		break;
    	case 'E': // ctypes.c_uint32 * 100
    		var array32 = new Uint32Array(uint8array.buffer.slice(offset, offset + 4))
    	    result.value = array32[0] / 100
    		result.bytesRead = 4
    		break;
    	case 'q': // ctypes.c_int64
            var signed64 = I64.readRaw(message.slice(offset, offset + 8), 0)
            result.value =  signed64.toNumber()
    		result.bytesRead = 8
    		break;
    	case 'Q': // ctypes.c_uint64
            var unsigned64 = U64.readRaw(message.slice(offset, offset + 8), 0)
            result.value =  unsigned64.toNumber()
    		result.bytesRead = 8
    		break;
    }


    return result;
}