const {U64, I64} = require("n64");

// These are needed for the timestamp calculation
const gpsEpochSeconds = 315964800;
const weekSeconds = 60 * 60 * 24 * 7;

module.exports = {
  parse: parse,
  _readValue: _readValue
};

function gpsToEpochMicroseconds(gms, gwk) {
  // gms Time of Week
  // gwk Week number
  return (gpsEpochSeconds + weekSeconds * gwk) * 1000 + gms;
}

function parse(binaryData, callback) {
  let index = 0;
  let formats = {};
  let messages = [];
  let referenceTimestamp = null;

  const binaryDataArray = new Uint8Array(binaryData);
  const binaryDataView = new DataView(binaryDataArray.buffer);

  while (index + 4 < binaryData.length) {

    if (binaryData[index] !== 0xff && binaryData[index + 1] !== 0xff) {
      // We have a valid message
      // third byte is the message id
      const msgid = binaryDataView.getUint8(index + 2);

      /* Parse a format message and add the results toi the format list
       */
      if (msgid === 0x80) { // FMT
        const msgtype = binaryDataView.getUint8(index + 3);
        const length = binaryDataView.getUint8(index + 4);
        const name = binaryData.slice(index + 5, index + 5 + 4);
        const types = binaryData.slice(index + 9, index + 9 + 16);
        const labels = binaryData.slice(index + 25, index + 25 + 64);

        formats[msgtype] = {
          size: length,
          name: name.toString().replace(/\0/g, ""),
          format: types.toString().replace(/\0/g, ""),
          labels: labels.toString().replace(/\0/g, "").split(",")
        };
      }

      if (msgid in formats) {
        const format = formats[msgid]["format"];
        let offset = 3; // Start after the header

        const event = {
          "name": formats[msgid]["name"]
        };

        console.log(event, binaryData.length, index, formats[msgid]["size"])
        if ((index + formats[msgid]["size"]) > binaryData.length) {
          console.log("Skipping incomplete message");
          index = binaryData.length
          continue
        }
        for (let x = 0; x < format.length; x++)
        {
          const formatChar = format.charAt(x);
          const result = _readValue(binaryData, binaryDataView, index + offset, formatChar);
          event[formats[msgid]["labels"][x]] = result.value;
          offset = offset + result.bytesRead;
        }

        messages.push(event);

        if (event.name === "GPS" && referenceTimestamp == null) {
          // We have out first GPS event, so we can calculate the time of day
          referenceTimestamp = {
            timeus: event.TimeUS,
            reference: gpsToEpochMicroseconds(event.GMS, event.GWk)
          };
        }
      } else {
        console.warn("Unknown messageId " + msgid);
      }

      index = index + formats[msgid]["size"];
    }
    else {
      console.warn("Skipping a byte!");
      index = index + 1;
    }
  }

  const results = {
    messages: messages,
    referenceTimestamp: referenceTimestamp
  };
  callback(null, results);
}

function _readValue(message, dv, offset, formatChar) {
  const result = {
    value: undefined,
    bytesRead: 0,
    formatChar: formatChar
  };

  switch (formatChar) {
  case "b": //ctypes.c_int8
    result.value = dv.getInt8(offset);
    result.bytesRead = 1;
    break;
  case "B": //ctypes.c_uint8
  case "M": //ctypes.c_uint8
    result.value = dv.getUint8(offset);
    result.bytesRead = 1;
    break;
  case "h": //ctypes.c_int16
    result.value = dv.getInt16(offset, true);
    result.bytesRead = 2;
    break;
  case "H": // ctypes.c_uint16
    result.value = dv.getUint16(offset, true);
    result.bytesRead = 2;
    break;
  case "i": // ctypes.c_int32
  case "L": // ctypes.c_int32
    result.value = dv.getInt32(offset, true);
    result.bytesRead = 4;
    break;
  case "I": // ctypes.c_uint32
    result.value = dv.getUint32(offset, true);
    result.bytesRead = 4;
    break;
  case "f": // ctypes.c_float
    result.value = dv.getFloat32(offset, true);
    result.bytesRead = 4;
    break;
  case "d": //ctypes.c_double
    result.value = dv.getFloat64(offset, true);
    result.bytesRead = 8;
    break;
  case "n": // ctypes.c_char * 4
    result.value = message.slice(offset, offset + 4).toString().replace(/\0/g, "");
    result.bytesRead = 4;
    break;
  case "N": // ctypes.c_char * 16
    result.value = message.slice(offset, offset + 16).toString().replace(/\0/g, "");
    result.bytesRead = 16;
    break;
  case "Z": // ctypes.c_char * 64
    result.value = message.slice(offset, offset + 64).toString().replace(/\0/g, "");
    result.bytesRead = 64;
    break;
  case "c": // ctypes.c_int16 * 100
    result.value = dv.getInt16(offset, true) / 100;
    result.bytesRead = 2;
    break;
  case "C": // ctypes.c_uint16 * 100
    result.value = dv.getUint16(offset, true) / 100;
    result.bytesRead = 2;
    break;
  case "e": // ctypes.c_int32 * 100
    result.value = dv.getInt32(offset, true) / 100;
    result.bytesRead = 4;
    break;
  case "E": // ctypes.c_uint32 * 100
    result.value = dv.getUint32(offset, true) / 100;
    result.bytesRead = 4;
    break;
  case "q": // ctypes.c_int64
    result.value = I64.readRaw(message.slice(offset, offset + 8), 0).toNumber();
    result.bytesRead = 8;
    break;
  case "Q": // ctypes.c_uint64
    result.value = U64.readRaw(message.slice(offset, offset + 8), 0).toNumber();
    result.bytesRead = 8;
    break;
  }

  return result;
}