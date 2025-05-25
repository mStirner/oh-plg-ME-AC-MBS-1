module.exports = [{
    name: "Power",
    alias: "POWER",
    register: 0,
    params: [{
        type: "number",
        key: "value",
        min: 0,
        max: 1
    }],
    //icon: "fa-solid fa-power-off"
}, {
    name: "Mode",
    alias: "MODE",
    register: 1,
    params: [{
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
    //icon: "fa-solid fa-sliders"
}, {
    name: "Fan Speed",
    alias: "FAN_SPEED",
    register: 2,
    params: [{
        type: "number",
        key: "value",
        min: 0,
        max: 4
    }],
    //icon: "fa-solid fa-wind"
}, {
    name: "Temperature",
    alias: "TEMPERATURE",
    register: 4,
    params: [{
        type: "number",
        key: "value",
        min: 16,
        max: 32
    }],
    //icon: "fa-solid fa-temperature-half"
}, {
    name: "Vane",
    alias: "VANE",
    register: 3,
    params: [{
        type: "number",
        key: "value",
        min: 0,
        max: 6
    }],
    //icon: "fa-solid fa-bars-staggered"
}];