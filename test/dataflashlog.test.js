"use strict";

const fs = require("fs");
const util = require("util");

const testMessage = [ // Format QBIHBcLLefffB
  0xa3, 0x95, 0x82, 0x49, 0xe6, 0x21, 0x03, 0x00, 0x00, 0x00, 0x00, 0x03, 0x40, 0xef, 0x78, 0x02,
  0xaf, 0x07, 0x0d, 0x4b, 0x00, 0x11, 0x70, 0x04, 0x1f, 0xe0, 0x2a, 0x11, 0x03, 0xb4, 0x00, 0x00,
  0x00, 0x59, 0x39, 0x34, 0x3d, 0x00, 0x00, 0x00, 0x00, 0x25, 0x06, 0x81, 0x3d, 0x01];
const testDataView = new DataView(new Uint8Array(testMessage).buffer);

describe("Dataflashlog module", () => {
  const dataflashlog = require("../dataflashlog");

  describe("_readValue", () => {

    it("should export a function", () => {
      expect(dataflashlog._readValue).toBeInstanceOf(Function);
    });

    it("should return -1 for 0xFF and format \"b\"", () => {
      const buffer = Buffer.from([0xFF]);
      const dataView = new DataView(new Uint8Array(buffer).buffer);
      const result = dataflashlog._readValue(buffer, dataView, 0, "b");
      expect(result).toHaveProperty("value",-1);
      expect(result).toHaveProperty("bytesRead",1);
      expect(result).toHaveProperty("formatChar","b");
    });

    it("should return 255 for 0xFF and format \"B\"", () => {
      const buffer = Buffer.from([0xFF]);
      const dataView = new DataView(new Uint8Array(buffer).buffer);
      const result = dataflashlog._readValue(buffer, dataView, 0, "B");
      expect(result).toHaveProperty("value",255);
      expect(result).toHaveProperty("bytesRead",1);
      expect(result).toHaveProperty("formatChar","B");
    });

    it("should return -1 for 0xFFFF and format \"h\"", () => {
      const buffer = Buffer.from([0xFF, 0xFF]);
      const dataView = new DataView(new Uint8Array(buffer).buffer);
      const result = dataflashlog._readValue(buffer, dataView, 0, "h");
      expect(result).toHaveProperty("value",-1);
      expect(result).toHaveProperty("bytesRead",2);
      expect(result).toHaveProperty("formatChar","h");
    });

    it("should return 65535 for 0xFFFF and format \"H\"", () => {
      const buffer = Buffer.from([0xFF, 0xFF]);
      const dataView = new DataView(new Uint8Array(buffer).buffer);
      const result = dataflashlog._readValue(buffer, dataView, 0, "H");
      expect(result).toHaveProperty("value",65535);
      expect(result).toHaveProperty("bytesRead",2);
      expect(result).toHaveProperty("formatChar","H");
    });

    it("should return -1 for 0xFFFFFFFF and format \"i\"", () => {
      const buffer = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF]);
      const dataView = new DataView(new Uint8Array(buffer).buffer);
      const result = dataflashlog._readValue(buffer, dataView, 0, "i");
      expect(result).toHaveProperty("value",-1);
      expect(result).toHaveProperty("bytesRead",4);
      expect(result).toHaveProperty("formatChar","i");
    });

    it("should return 4294967295 for 0xFFFFFFFF and format \"I\"", () => {
      const buffer = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF]);
      const dataView = new DataView(new Uint8Array(buffer).buffer);
      const result = dataflashlog._readValue(buffer, dataView, 0, "I");
      expect(result).toHaveProperty("value",4294967295);
      expect(result).toHaveProperty("bytesRead",4);
      expect(result).toHaveProperty("formatChar","I");
    });

    it("should return -1 for 0xFFFFFFFF and format \"L\"", () => {
      const buffer = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF]);
      const dataView = new DataView(new Uint8Array(buffer).buffer);
      const result = dataflashlog._readValue(buffer, dataView, 0, "L");
      expect(result).toHaveProperty("value",-1);
      expect(result).toHaveProperty("bytesRead",4);
      expect(result).toHaveProperty("formatChar","L");
    });

    it("should return 255 for 0xFF and format \"M\"", () => {
      const buffer = Buffer.from([0xFF]);
      const dataView = new DataView(new Uint8Array(buffer).buffer);
      const result = dataflashlog._readValue(buffer, dataView, 0, "M");
      expect(result).toHaveProperty("value",255);
      expect(result).toHaveProperty("bytesRead",1);
      expect(result).toHaveProperty("formatChar","M");
    });

    it("should return 1.3333 for 0x93A9AA3F and format \"f\"", () => {
      const buffer = Buffer.from([0x93, 0xA9, 0xAA, 0x3F]);
      const dataView = new DataView(new Uint8Array(buffer).buffer);
      const result = dataflashlog._readValue(buffer, dataView, 0, "f");
      expect(result).toHaveProperty("value")
      expect(result.value).toBeCloseTo(1.3333, 4);
      expect(result).toHaveProperty("bytesRead",4);
      expect(result).toHaveProperty("formatChar","f");
    });

    it("should return 1.6666 for 0xB537F8C264AAFA3F and format \"d\"", () => {
      const buffer = Buffer.from([0xB5, 0x37, 0xF8, 0xC2, 0x64, 0xAA, 0xFA, 0x3F]);
      const dataView = new DataView(new Uint8Array(buffer).buffer);
      const result = dataflashlog._readValue(buffer, dataView, 0, "d");
      expect(result).toHaveProperty("value",1.6666);
      expect(result).toHaveProperty("bytesRead",8);
      expect(result).toHaveProperty("formatChar","d");
    });

    it("should return \"BEEF\" for 0x42454546 and format \"n\"", () => {
      const buffer = Buffer.from([0x42, 0x45, 0x45, 0x46]);
      const dataView = new DataView(new Uint8Array(buffer).buffer);
      const result = dataflashlog._readValue(buffer, dataView, 0, "n");
      expect(result).toHaveProperty("value","BEEF");
      expect(result).toHaveProperty("bytesRead",4);
      expect(result).toHaveProperty("formatChar","n");
    });

    it(
      "should return \"BEEFEATER\" for 0x42454546454154455200000000000000 and format \"N\"",
      () => {
        const buffer = Buffer.from([0x42, 0x45, 0x45, 0x46, 0x45, 0x41, 0x54, 0x45, 0x52, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0]);
        const dataView = new DataView(new Uint8Array(buffer).buffer);
        const result = dataflashlog._readValue(buffer, dataView, 0, "N");
        expect(result).toHaveProperty("value","BEEFEATER");
        expect(result).toHaveProperty("bytesRead",16);
        expect(result).toHaveProperty("formatChar","N");
      }
    );

    it(
      "should return \"BEEFEATER\" for 0x4245454645415445520000..0000 and format \"Z\"",
      () => {
        const buffer = Buffer.from(
          [0x42, 0x45, 0x45, 0x46, 0x45, 0x41, 0x54, 0x45, 0x52, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0,
            0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0,
            0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0,
            0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0
          ]);
        const dataView = new DataView(new Uint8Array(buffer).buffer);
        const result = dataflashlog._readValue(buffer, dataView, 0, "Z");
        expect(result).toHaveProperty("value","BEEFEATER");
        expect(result).toHaveProperty("bytesRead",64);
        expect(result).toHaveProperty("formatChar","Z");
      }
    );

    it("should return -0.01 for 0xFFFF and format \"c\"", () => {
      const buffer = Buffer.from([0xFF, 0xFF]);
      const dataView = new DataView(new Uint8Array(buffer).buffer);
      const result = dataflashlog._readValue(buffer, dataView, 0, "c");
      expect(result).toHaveProperty("value",-0.01);
      expect(result).toHaveProperty("bytesRead",2);
      expect(result).toHaveProperty("formatChar","c");
    });

    it("should return 655.35 for 0xFFFF and format \"C\"", () => {
      const buffer = Buffer.from([0xFF, 0xFF]);
      const dataView = new DataView(new Uint8Array(buffer).buffer);
      const result = dataflashlog._readValue(buffer, dataView, 0, "C");
      expect(result).toHaveProperty("value",655.35);
      expect(result).toHaveProperty("bytesRead",2);
      expect(result).toHaveProperty("formatChar","C");
    });

    it("should return -0.1 for 0xFFFFFFFF and format \"e\"", () => {
      const buffer = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF]);
      const dataView = new DataView(new Uint8Array(buffer).buffer);
      const result = dataflashlog._readValue(buffer, dataView, 0, "e");
      expect(result).toHaveProperty("value",-0.01);
      expect(result).toHaveProperty("bytesRead",4);
      expect(result).toHaveProperty("formatChar","e");
    });

    it("should return 42949672.95 for 0xFFFFFFFF and format \"E\"", () => {
      const buffer = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF]);
      const dataView = new DataView(new Uint8Array(buffer).buffer);
      const result = dataflashlog._readValue(buffer, dataView, 0, "E");
      expect(result).toHaveProperty("value",42949672.95);
      expect(result).toHaveProperty("bytesRead",4);
      expect(result).toHaveProperty("formatChar","E");
    });

    it("should return -1 for 0xFFFFFFFFFFFFFFFF and format \"q\"", () => {
      const buffer = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
      const dataView = new DataView(new Uint8Array(buffer).buffer);
      const result = dataflashlog._readValue(buffer, dataView, 0, "q");
      expect(result).toHaveProperty("value",-1);
      expect(result).toHaveProperty("bytesRead",8);
      expect(result).toHaveProperty("formatChar","q");
    });

    it(
      "should return 9007199254740991 for 0xFFFFFFFFFFFFFFFF and format \"Q\"",
      () => {
        const buffer = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x1F, 0x00]);
        const dataView = new DataView(new Uint8Array(buffer).buffer);
        const result = dataflashlog._readValue(buffer, dataView, 0, "Q");
        expect(result).toHaveProperty("value",9007199254740991);
        expect(result).toHaveProperty("bytesRead",8);
        expect(result).toHaveProperty("formatChar","Q");
      }
    );

    /*
      format : QBIHBcLLefffB
      gms=41480000, gwk=1967 => 1547086400
      { name: 'GPS',
        TimeUS: 52553289,
        Status: 3,
        GMS: 41480000,
        GWk: 1967,
        NSats: 13,
        HDop: 0.75,
        Lat: 520384529,
        Lng: 51456736,
        Alt: 1.8,
        Spd: 0.04400000348687172,
        GCrs: 0,
        VZ: 0.06300000101327896,
        U: 1 }
      { timeus: 52553289, reference: 1505647880000 }
    */
    it(
      "should return 52553289 for the test message, format \"Q\" and offset 3",
      () => {
        const result = dataflashlog._readValue(testMessage, testDataView, 3, "Q");
        expect(result).toHaveProperty("value",52553289);
        expect(result).toHaveProperty("bytesRead",8);
        expect(result).toHaveProperty("formatChar","Q");
      }
    );

    it(
      "should return 3 for the test message, format \"B\" and offset 11",
      () => {
        const result = dataflashlog._readValue(testMessage, testDataView, 11, "B");
        expect(result).toHaveProperty("value",3);
        expect(result).toHaveProperty("bytesRead",1);
        expect(result).toHaveProperty("formatChar","B");
      }
    );

    it(
      "should return 41480000 for the test message, format \"I\" and offset 12",
      () => {
        const result = dataflashlog._readValue(testMessage, testDataView, 12, "I");
        expect(result).toHaveProperty("value",41480000);
        expect(result).toHaveProperty("bytesRead",4);
        expect(result).toHaveProperty("formatChar","I");
      }
    );

    it(
      "should return 1967 for the test message, format \"H\" and offset 16",
      () => {
        const result = dataflashlog._readValue(testMessage, testDataView, 16, "H");
        expect(result).toHaveProperty("value",1967);
        expect(result).toHaveProperty("bytesRead",2);
        expect(result).toHaveProperty("formatChar","H");
      }
    );

    it(
      "should return 0.75 for the test message, format \"c\" and offset 19",
      () => {
        const result = dataflashlog._readValue(testMessage, testDataView, 19, "c");
        expect(result).toHaveProperty("value",0.75);
        expect(result).toHaveProperty("bytesRead",2);
        expect(result).toHaveProperty("formatChar","c");
      }
    );

    it(
      "should return 520384529 for the test message, format \"L\" and offset 21",
      () => {
        const result = dataflashlog._readValue(testMessage, testDataView, 21, "L");
        expect(result).toHaveProperty("value",520384529);
        expect(result).toHaveProperty("bytesRead",4);
        expect(result).toHaveProperty("formatChar","L");
      }
    );

    it(
      "should return 1.8 for the test message, format \"e\" and offset 29",
      () => {
        const result = dataflashlog._readValue(testMessage, testDataView, 29, "e");
        expect(result).toHaveProperty("value",1.8);
        expect(result).toHaveProperty("bytesRead",4);
        expect(result).toHaveProperty("formatChar","e");
      }
    );

    it(
      "should return 0.44 for the test message, format \"f\" and offset 33",
      () => {
        const result = dataflashlog._readValue(testMessage, testDataView, 33, "f");
        expect(result).toHaveProperty("value")
        expect(result.value).toBeCloseTo(0.044, 3);
        expect(result).toHaveProperty("bytesRead",4);
        expect(result).toHaveProperty("formatChar","f");
      }
    );

  });

  describe("parse", () => {

    it("should export a function", async () => {
      expect(dataflashlog.parse).toBeInstanceOf(Function);
    });

    it("should parse messages from log.bin", async () => {
      const buffer = fs.readFileSync(__dirname + "/log.bin");

      let parseAsync = util.promisify(dataflashlog.parse);
      const data = await parseAsync(buffer);

      expect(data).toHaveProperty("messages");
      expect(data).toHaveProperty("referenceTimestamp");
      expect(data.referenceTimestamp).toHaveProperty("timeus", 402735374);
      expect(data.referenceTimestamp).toHaveProperty("reference", 1505040580800);
    });

  });

});
