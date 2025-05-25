module.exports = function crc16Modbus(buffer) {
    let crc = 0xFFFF;

    for (let pos = 0; pos < buffer.length; pos++) {
        crc ^= buffer[pos]; // XOR byte into least significant byte of crc

        for (let i = 8; i !== 0; i--) { // Loop over each bit
            if ((crc & 0x0001) !== 0) { // If the LSB is set
                crc >>= 1;              // Shift right
                crc ^= 0xA001;          // Apply XOR with polynomial
            } else {
                crc >>= 1;              // Just shift right
            }
        }
    }

    // CRC is usually appended in little-endian, so swap the bytes
    return Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF]);
}