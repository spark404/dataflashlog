'use strict'

const dataflashlog = require('../dataflashlog')
const chai = require('chai')
const expect = require('chai').expect
const chaiAlmost = require('chai-almost');

// INIT 
chai.use(chaiAlmost());

var testMessage = [ // Format QBIHBcLLefffB
	0xa3, 0x95, 0x82, 0x49, 0xe6, 0x21, 0x03, 0x00, 0x00, 0x00, 0x00, 0x03, 0x40, 0xef, 0x78, 0x02, 
	0xaf, 0x07, 0x0d, 0x4b, 0x00, 0x11, 0x70, 0x04, 0x1f, 0xe0, 0x2a, 0x11, 0x03, 0xb4, 0x00, 0x00, 
	0x00, 0x59, 0x39, 0x34, 0x3d, 0x00, 0x00, 0x00, 0x00, 0x25, 0x06, 0x81, 0x3d, 0x01 ]

describe('Dataflashlog module', () => {
  describe('"parse"', () => {
    it('should export a function', () => {
      expect(dataflashlog.parse).to.be.a('function')
    }),

	it('should return -1 for 0xFF and format "b"', () => {
	  const result = dataflashlog._readValue(new Buffer([0xFF]), 0, "b")
	  expect(result).to.have.property('value').to.equal(-1)
	  expect(result).to.have.property('bytesRead').to.equal(1)
	  expect(result).to.have.property('formatChar').to.equal("b")
	}),

	it('should return 255 for 0xFF and format "B"', () => {
	  const result = dataflashlog._readValue(new Buffer([0xFF]), 0, "B")
	  expect(result).to.have.property('value').to.equal(255)
	  expect(result).to.have.property('bytesRead').to.equal(1)
	  expect(result).to.have.property('formatChar').to.equal("B")
	}),

	it('should return -1 for 0xFFFF and format "h"', () => {
	  const result = dataflashlog._readValue(new Buffer([0xFF, 0xFF]), 0, "h")
	  expect(result).to.have.property('value').to.equal(-1)
	  expect(result).to.have.property('bytesRead').to.equal(2)
	  expect(result).to.have.property('formatChar').to.equal("h")
	}),

	it('should return 65535 for 0xFFFF and format "H"', () => {
	  const result = dataflashlog._readValue(new Buffer([0xFF, 0xFF]), 0, "H")
	  expect(result).to.have.property('value').to.equal(65535)
	  expect(result).to.have.property('bytesRead').to.equal(2)
	  expect(result).to.have.property('formatChar').to.equal("H")
	}),

	it('should return -1 for 0xFFFFFFFF and format "i"', () => {
	  const result = dataflashlog._readValue(new Buffer([0xFF, 0xFF, 0xFF, 0xFF]), 0, "i")
	  expect(result).to.have.property('value').to.equal(-1)
	  expect(result).to.have.property('bytesRead').to.equal(4)
	  expect(result).to.have.property('formatChar').to.equal("i")
	}),

	it('should return 4294967295 for 0xFFFFFFFF and format "I"', () => {
	  const result = dataflashlog._readValue(new Buffer([0xFF, 0xFF, 0xFF, 0xFF]), 0, "I")
	  expect(result).to.have.property('value').to.equal(4294967295)
	  expect(result).to.have.property('bytesRead').to.equal(4)
	  expect(result).to.have.property('formatChar').to.equal("I")
	}),

	it('should return -1 for 0xFFFFFFFF and format "L"', () => {
	  const result = dataflashlog._readValue(new Buffer([0xFF, 0xFF, 0xFF, 0xFF]), 0, "L")
	  expect(result).to.have.property('value').to.equal(-1)
	  expect(result).to.have.property('bytesRead').to.equal(4)
	  expect(result).to.have.property('formatChar').to.equal("L")
	}),

	it('should return 255 for 0xFF and format "M"', () => {
	  const result = dataflashlog._readValue(new Buffer([0xFF]), 0, "M")
	  expect(result).to.have.property('value').to.equal(255)
	  expect(result).to.have.property('bytesRead').to.equal(1)
	  expect(result).to.have.property('formatChar').to.equal("M")
	})

	it('should return 1.3333 for 0x93A9AA3F and format "f"', () => {
	  const result = dataflashlog._readValue(new Buffer([0x93, 0xA9, 0xAA, 0x3F]), 0, "f")
	  expect(result).to.have.property('value').to.almost.equal(1.3333)
	  expect(result).to.have.property('bytesRead').to.equal(4)
	  expect(result).to.have.property('formatChar').to.equal("f")
	})

	it('should return 1.6666 for 0xB537F8C264AAFA3F and format "d"', () => {
	  const result = dataflashlog._readValue(new Buffer([0xB5, 0x37, 0xF8, 0xC2, 0x64, 0xAA, 0xFA, 0x3F]), 0, "d")
	  expect(result).to.have.property('value').to.almost.equal(1.6666)
	  expect(result).to.have.property('bytesRead').to.equal(8)
	  expect(result).to.have.property('formatChar').to.equal("d")
	})

	it('should return "BEEF" for 0x42454546 and format "n"', () => {
	  const result = dataflashlog._readValue(new Buffer([0x42, 0x45, 0x45, 0x46]), 0, "n")
	  expect(result).to.have.property('value').to.equal("BEEF")
	  expect(result).to.have.property('bytesRead').to.equal(4)
	  expect(result).to.have.property('formatChar').to.equal("n")
	})

	it('should return "BEEFEATER" for 0x42454546454154455200000000000000 and format "N"', () => {
	  const result = dataflashlog._readValue(new Buffer([0x42, 0x45, 0x45, 0x46, 0x45, 0x41, 0x54, 0x45, 0x52, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0]), 0, "N")
	  expect(result).to.have.property('value').to.equal("BEEFEATER")
	  expect(result).to.have.property('bytesRead').to.equal(16)
	  expect(result).to.have.property('formatChar').to.equal("N")
	})

	it('should return "BEEFEATER" for 0x4245454645415445520000..0000 and format "Z"', () => {
	  const result = dataflashlog._readValue(new Buffer(
	  	[0x42, 0x45, 0x45, 0x46, 0x45, 0x41, 0x54, 0x45, 0x52, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0,
	  	0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0,
	  	0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0,
	  	0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0
	  	]), 0, "Z")
	  expect(result).to.have.property('value').to.equal("BEEFEATER")
	  expect(result).to.have.property('bytesRead').to.equal(64)
	  expect(result).to.have.property('formatChar').to.equal("Z")
	})

	it('should return -0.01 for 0xFFFF and format "c"', () => {
	  const result = dataflashlog._readValue(new Buffer([0xFF, 0xFF]), 0, "c")
	  expect(result).to.have.property('value').to.equal(-0.01)
	  expect(result).to.have.property('bytesRead').to.equal(2)
	  expect(result).to.have.property('formatChar').to.equal("c")
	})

	it('should return 655.35 for 0xFFFF and format "C"', () => {
	  const result = dataflashlog._readValue(new Buffer([0xFF, 0xFF]), 0, "C")
	  expect(result).to.have.property('value').to.equal(655.35)
	  expect(result).to.have.property('bytesRead').to.equal(2)
	  expect(result).to.have.property('formatChar').to.equal("C")
	})

	it('should return -0.1 for 0xFFFFFFFF and format "e"', () => {
	  const result = dataflashlog._readValue(new Buffer([0xFF, 0xFF, 0xFF, 0xFF]), 0, "e")
	  expect(result).to.have.property('value').to.equal(-0.01)
	  expect(result).to.have.property('bytesRead').to.equal(4)
	  expect(result).to.have.property('formatChar').to.equal("e")
	})

	it('should return 42949672.95 for 0xFFFFFFFF and format "E"', () => {
	  const result = dataflashlog._readValue(new Buffer([0xFF, 0xFF, 0xFF, 0xFF]), 0, "E")
	  expect(result).to.have.property('value').to.equal(42949672.95)
	  expect(result).to.have.property('bytesRead').to.equal(4)
	  expect(result).to.have.property('formatChar').to.equal("E")
	})

	it('should return -1 for 0xFFFFFFFFFFFFFFFF and format "q"', () => {
	  const result = dataflashlog._readValue(new Buffer([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]), 0, "q")
	  expect(result).to.have.property('value').to.equal(-1)
	  expect(result).to.have.property('bytesRead').to.equal(8)
	  expect(result).to.have.property('formatChar').to.equal("q")
	})

	it('should return 9007199254740991 for 0xFFFFFFFFFFFFFFFF and format "Q"', () => {
	  const result = dataflashlog._readValue(new Buffer([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x1F, 0x0]), 0, "Q")
	  expect(result).to.have.property('value').to.equal(9007199254740991)
	  expect(result).to.have.property('bytesRead').to.equal(8)
	  expect(result).to.have.property('formatChar').to.equal("Q")
	})

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
	it('should return 52553289 for the test message, format "Q" and offset 3', () => {
	  const result = dataflashlog._readValue(testMessage, 3, "Q")
	  expect(result).to.have.property('value').to.equal(52553289)
	  expect(result).to.have.property('bytesRead').to.equal(8)
	  expect(result).to.have.property('formatChar').to.equal("Q")
	})

	it('should return 3 for the test message, format "B" and offset 11', () => {
	  const result = dataflashlog._readValue(testMessage, 11, "B")
	  expect(result).to.have.property('value').to.equal(3)
	  expect(result).to.have.property('bytesRead').to.equal(1)
	  expect(result).to.have.property('formatChar').to.equal("B")
	})

	it('should return 41480000 for the test message, format "I" and offset 12', () => {
	  const result = dataflashlog._readValue(testMessage, 12, "I")
	  expect(result).to.have.property('value').to.equal(41480000)
	  expect(result).to.have.property('bytesRead').to.equal(4)
	  expect(result).to.have.property('formatChar').to.equal("I")
	})

	it('should return 1967 for the test message, format "H" and offset 16', () => {
	  const result = dataflashlog._readValue(testMessage, 16, "H")
	  expect(result).to.have.property('value').to.equal(1967)
	  expect(result).to.have.property('bytesRead').to.equal(2)
	  expect(result).to.have.property('formatChar').to.equal("H")
	})

	it('should return 0.75 for the test message, format "c" and offset 19', () => {
	  const result = dataflashlog._readValue(testMessage, 19, "c")
	  expect(result).to.have.property('value').to.equal(0.75)
	  expect(result).to.have.property('bytesRead').to.equal(2)
	  expect(result).to.have.property('formatChar').to.equal("c")
	})

	it('should return 520384529 for the test message, format "L" and offset 21', () => {
	  const result = dataflashlog._readValue(testMessage, 21, "L")
	  expect(result).to.have.property('value').to.equal(520384529)
	  expect(result).to.have.property('bytesRead').to.equal(4)
	  expect(result).to.have.property('formatChar').to.equal("L")
	})

	it('should return 1.8 for the test message, format "e" and offset 29', () => {
	  const result = dataflashlog._readValue(testMessage, 29, "e")
	  expect(result).to.have.property('value').to.equal(1.8)
	  expect(result).to.have.property('bytesRead').to.equal(4)
	  expect(result).to.have.property('formatChar').to.equal("e")
	})

	it('should return 0.44 for the test message, format "f" and offset 33', () => {
	  const result = dataflashlog._readValue(testMessage, 33, "f")
	  expect(result).to.have.property('value').to.almost.equal(0.044)
	  expect(result).to.have.property('bytesRead').to.equal(4)
	  expect(result).to.have.property('formatChar').to.equal("f")
	})

  })
})

