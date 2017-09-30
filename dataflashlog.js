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

    var binaryDataArray = new Uint8Array(binaryData)
    var binaryDataView = new DataView(binaryDataArray.buffer)

    while (index + 4 < binaryData.length) {

	    if (binaryData[index + 0] != 0xff && binaryData[index + 1] != 0xff) {
	    	// We have a valid message
	    	// third byte is the message id
	    	var msgid = binaryDataView.getUint8(index + 2)
	    	var size = 0

	    	if (msgid == 0x80) { // FMT
	    		var msgtype = binaryDataView.getUint8(index + 3)
		    	var length = binaryDataView.getUint8(index + 4)
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

	    		var format = formats[msgid]['format']
	    		var offset = 3; // Start after the header

	    		event = {}
	    		event['name'] = formats[msgid]['name']

	    		for (var x = 0; x < format.length; x++)
				{
				    var formatChar = format.charAt(x)
				    var result = _readValue(binaryData, binaryDataView, index + offset, formatChar)
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

function _readValue(message, dv, offset, formatChar) {
	var result = {}
    result.value = undefined;
    result.bytesRead = 0;
    result.formatChar = formatChar;

    switch (formatChar) {
    	case 'b': //ctypes.c_int8
    		result.value = dv.getInt8(offset, true)
    		result.bytesRead = 1
    		break;
    	case 'B': //ctypes.c_uint8
    	case 'M': //ctypes.c_uint8
    		result.value = dv.getUint8(offset, true)
    		result.bytesRead = 1
    		break;
    	case 'h': //ctypes.c_int16
    	    result.value = dv.getInt16(offset, true)
    		result.bytesRead = 2
    		break;
    	case 'H': // ctypes.c_uint16
    	    result.value = dv.getUint16(offset, true)
    		result.bytesRead = 2
    		break;
    	case 'i': // ctypes.c_int32
    	case 'L': // ctypes.c_int32
    	    result.value = dv.getInt32(offset, true)
    	    result.bytesRead = 4
    		break;
    	case 'I': // ctypes.c_uint32
    	    result.value = dv.getUint32(offset, true)
    		result.bytesRead = 4
    		break;
    	case 'f': // ctypes.c_float
    		result.value = dv.getFloat32(offset, true)
    		result.bytesRead = 4
    		break;
    	case 'd': //ctypes.c_double
    		result.value = dv.getFloat64(offset, true)
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
    	    result.value = dv.getInt16(offset, true) / 100
    		result.bytesRead = 2
    		break;
    	case 'C': // ctypes.c_uint16 * 100
    	    result.value = dv.getUint16(offset, true) / 100
    		result.bytesRead = 2
    		break;
    	case 'e': // ctypes.c_int32 * 100
    	    result.value = dv.getInt32(offset, true) / 100
    		result.bytesRead = 4
    		break;
    	case 'E': // ctypes.c_uint32 * 100
    	    result.value = dv.getUint32(offset, true) / 100
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