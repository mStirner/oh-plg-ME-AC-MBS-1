module.exports = [{
    name: "Power On",
    alias: "POWER_ON",
    register: Buffer.from([0x00, 0x00]),
    payload: Buffer.from([0x00, 0x01]),
    icon: "fa-solid fa-power-off"
}, {
    name: "Power Off",
    alias: "POWER_OFF",
    register: Buffer.from([0x00, 0x00]),
    payload: Buffer.from([0x00, 0x00]),
    icon: "fa-solid fa-power-off"
}/*, {
    name: "Mode",
    alias: "MODE",
    register: 1,
    options: [{
        type: "number",
        key: "value",
        value: 0
    }, {
        type: "number",
        key: "value",
        value: 1
    }, {
        type: "number",
        key: "value",
        value: 2
    }, {
        type: "number",
        key: "value",
        value: 3
    }, {
        type: "number",
        key: "value",
        value: 4
    }],
    icon: "fa-solid fa-sliders"
}*/, {
    name: "Fan Speed",
    alias: "FAN_SPEED",
    register: Buffer.from([0x00, 0x02]),
    params: [{
        type: "number",
        key: "value",
        min: 0,
        max: 4
    }],
    icon: "fa-solid fa-wind"
}, {
    name: "Temperature",
    alias: "TEMPERATURE",
    register: Buffer.from([0x00, 0x04]),
    params: [{
        type: "number",
        key: "value",
        value: 22,
        min: 16,
        max: 32
    }],
    icon: "fa-solid fa-temperature-half"
}, {
    name: "Vane Position",
    alias: "VANE",
    register: Buffer.from([0x00, 0x03]),
    params: [{
        type: "number",
        key: "value",
        min: 0,
        max: 6
    }],
    icon: "fa-solid fa-bars-staggered"
}, {
    name: "Mode: Auto",
    alias: "MODE_AUTO",
    register: Buffer.from([0x00, 0x01]),
    payload: Buffer.from([0x00])
}, {
    name: "Mode: Heating",
    alias: "MODE_HEATING",
    register: Buffer.from([0x00, 0x01]),
    payload: Buffer.from([0x00, 0x01])
}, {
    name: "Mode: Dehumidifier",
    alias: "MODE_DEHUMIDIFIER",
    register: Buffer.from([0x00, 0x01]),
    payload: Buffer.from([0x00, 0x02])
}, {
    name: "Mode: Fan",
    alias: "MODE_FAN",
    register: Buffer.from([0x00, 0x01]),
    payload: Buffer.from([0x00, 0x03])
}, {
    name: "Mode: Cooling",
    alias: "MODE_COOLING",
    register: Buffer.from([0x00, 0x01]),
    payload: Buffer.from([0x00, 0x04])
}];