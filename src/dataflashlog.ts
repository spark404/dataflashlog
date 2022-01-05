import {U64, I64} from "n64";

// These are needed for the timestamp calculation
const gpsEpochSeconds = 315964800;
const weekSeconds = 60 * 60 * 24 * 7;

interface ReferenceTimestamp {
    timeUs: number;
    reference: number;
}

interface LogEvent {
    name: string;
    TimeUS: number
    [key: string]: unknown;
}

interface EventLog {
    messages: LogEvent[]
    referenceTimestamp?: ReferenceTimestamp
}

function gpsToEpochMicroseconds(gms, gwk) {
    // gms Time of Week
    // gwk Week number
    return (gpsEpochSeconds + weekSeconds * gwk) * 1000 + gms;
}

async function parseBuffer(buffer: Buffer): Promise<EventLog> {

    let index = 0;
    const formats = {};
    const eventLog: EventLog = {
        messages: []
    };

    const binaryDataArray = new Uint8Array(buffer);
    const binaryDataView = new DataView(binaryDataArray.buffer);

    while (index + 4 < buffer.length) {

        if (buffer[index] !== 0xff && buffer[index + 1] !== 0xff) {
            // We have a valid message
            // third byte is the message id
            const msgId = binaryDataView.getUint8(index + 2);

            /* Parse a format message and add the results toi the format list
             */
            if (msgId === 0x80) { // FMT
                const msgType = binaryDataView.getUint8(index + 3);
                const length = binaryDataView.getUint8(index + 4);
                const name = buffer.slice(index + 5, index + 5 + 4);
                const types = buffer.slice(index + 9, index + 9 + 16);
                const labels = buffer.slice(index + 25, index + 25 + 64);

                formats[msgType] = {
                    size: length,
                    name: name.toString().replace(/\0/g, ""),
                    format: types.toString().replace(/\0/g, ""),
                    labels: labels.toString().replace(/\0/g, "").split(",")
                };
            }

            if (msgId in formats) {
                const format = formats[msgId]["format"];
                let offset = 3; // Start after the header

                const event: LogEvent = {
                    name: formats[msgId]["name"],
                    TimeUS: 0
                };

                if ((index + formats[msgId]["size"]) > buffer.length) {
                    console.log("Skipping incomplete message at file end");
                    index = buffer.length
                    continue
                }

                for (let x = 0; x < format.length; x++)
                {
                    const formatChar = format.charAt(x);
                    const result = _readValue(buffer, binaryDataView, index + offset, formatChar);
                    event[formats[msgId]["labels"][x]] = result.value;
                    offset = offset + result.sizeInBytes;
                }

                eventLog.messages.push(event);

                if (event.name === "GPS" && eventLog.referenceTimestamp == null) {
                    // We have our first GPS event, so we can calculate the time of day
                    eventLog.referenceTimestamp = {
                        timeUs: event.TimeUS,
                        reference: gpsToEpochMicroseconds(event.GMS, event.GWk)
                    };
                }
            } else {
                console.warn("Unknown messageId " + msgId);
            }

            index = index + formats[msgId]["size"];
        }
        else {
            console.warn("Skipping a byte!");
            index = index + 1;
        }
    }

    return eventLog
}

interface valueType {
    value: unknown,
    sizeInBytes: number
}

function _readValue(message: Buffer, dv: DataView, offset: number, formatChar: string): valueType {
    const result: valueType = {
        value: undefined,
        sizeInBytes: 0
    };

    switch (formatChar) {
        case "b": //ctypes.c_int8
            result.value = dv.getInt8(offset);
            result.sizeInBytes = 1;
            break;
        case "B": //ctypes.c_uint8
        case "M": //ctypes.c_uint8
            result.value = dv.getUint8(offset);
            result.sizeInBytes = 1;
            break;
        case "h": //ctypes.c_int16
            result.value = dv.getInt16(offset, true);
            result.sizeInBytes = 2;
            break;
        case "H": // ctypes.c_uint16
            result.value = dv.getUint16(offset, true);
            result.sizeInBytes = 2;
            break;
        case "i": // ctypes.c_int32
        case "L": // ctypes.c_int32
            result.value = dv.getInt32(offset, true);
            result.sizeInBytes = 4;
            break;
        case "I": // ctypes.c_uint32
            result.value = dv.getUint32(offset, true);
            result.sizeInBytes = 4;
            break;
        case "f": // ctypes.c_float
            result.value = dv.getFloat32(offset, true);
            result.sizeInBytes = 4;
            break;
        case "d": //ctypes.c_double
            result.value = dv.getFloat64(offset, true);
            result.sizeInBytes = 8;
            break;
        case "n": // ctypes.c_char * 4
            result.value = message.slice(offset, offset + 4).toString().replace(/\0/g, "");
            result.sizeInBytes = 4;
            break;
        case "N": // ctypes.c_char * 16
            result.value = message.slice(offset, offset + 16).toString().replace(/\0/g, "");
            result.sizeInBytes = 16;
            break;
        case "Z": // ctypes.c_char * 64
            result.value = message.slice(offset, offset + 64).toString().replace(/\0/g, "");
            result.sizeInBytes = 64;
            break;
        case "c": // ctypes.c_int16 * 100
            result.value = dv.getInt16(offset, true) / 100;
            result.sizeInBytes = 2;
            break;
        case "C": // ctypes.c_uint16 * 100
            result.value = dv.getUint16(offset, true) / 100;
            result.sizeInBytes = 2;
            break;
        case "e": // ctypes.c_int32 * 100
            result.value = dv.getInt32(offset, true) / 100;
            result.sizeInBytes = 4;
            break;
        case "E": // ctypes.c_uint32 * 100
            result.value = dv.getUint32(offset, true) / 100;
            result.sizeInBytes = 4;
            break;
        case "q": // ctypes.c_int64
            result.value = I64.readRaw(message.slice(offset, offset + 8), 0).toNumber();
            result.sizeInBytes = 8;
            break;
        case "Q": // ctypes.c_uint64
            result.value = U64.readRaw(message.slice(offset, offset + 8), 0).toNumber();
            result.sizeInBytes = 8;
            break;
    }

    return result;
}

export {
    EventLog,
    parseBuffer
}

export const exportedForTesting = {
    _readValue
}
