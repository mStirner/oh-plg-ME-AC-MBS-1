const commands = require("./commands.js");
const checksum = require("./checksum.js");

const infinity = require("../../helper/infinity.js");
const debounce = require("../../helper/debounce.js");

module.exports = (info, logger, init) => {
    return init([
        "devices",
        "endpoints",
        "store"
    ], (scope, [
        C_DEVICES,
        C_ENDPOINTS,
        C_STORE
    ]) => {


        C_DEVICES.found({
            labels: [
                "mitubishi=true",
                "climate=true",
                "modbus=true",
                "module=me-ac-mbs-1"
            ],
        }, async (device) => {


            const store = await new Promise((resolve) => {
                C_STORE.found({
                    name: `${device.name} (${device._id})`,
                    labels: [
                        ...device.labels,
                        `device=${device._id}`
                    ]
                }, (store) => {

                    // feedback
                    logger.debug("Store found", store);

                    resolve(store);

                }, async (filter) => {

                    logger.debug("Store not found, add one");

                    let store = await C_STORE.add({
                        name: device.name,
                        config: [{
                            name: "Device ID",
                            description: "Modbus slave id",
                            type: "number",
                            key: "id",
                            value: 1
                        }],
                        ...filter
                    });

                    logger.info("Store added", store);

                });
            });


            const endpoint = await new Promise((resolve) => {
                C_ENDPOINTS.found({
                    labels: [
                        `device=${device._id}`,
                        ...device.labels
                    ]
                }, (endpoint) => {

                    resolve(endpoint);

                }, async (filter) => {
                    try {

                        logger.debug("No endpoint found, add one", filter);

                        let obj = {
                            name: device.name,
                            device: device._id,
                            icon: "fa-solid fa-temperature-arrow-down",
                            labels: [
                                `device=${device._id}`,
                                ...filter.labels
                            ],
                            commands: commands.map((cmd) => {

                                // "copy" command
                                let copy = { ...cmd };

                                // monkey patch interface
                                copy.interface = device.interfaces[0]._id;

                                // delete not allowed properties
                                delete copy.register;
                                delete copy.payload;

                                return copy;

                            })
                        };

                        let endpoint = await C_ENDPOINTS.add(obj);

                        logger.info("Endpoint added", endpoint);

                    } catch (err) {

                        console.error(err, "Could not add device");

                    }
                });
            });


            Promise.all([store, endpoint]).then(() => {

                logger.debug(`Init device handling device=${device._id}, endpoint=${endpoint._id}, store=${store._id}`);

                let stream = null;
                let init = null;
                let transactionId = 1;

                let iface = device.interfaces[0];
                let { host, port } = iface.settings;

                store.changes().once("changed", (key, value) => {

                    logger.debug(`store variable changed ${key}=${value}`);

                    stream?.end();

                    init();

                });

                C_DEVICES.events.on("update", ({ _id }) => {
                    if (_id === device._id) {

                        logger.debug("Device updated, re-init");

                        stream?.end();

                        init();

                    }
                });

                let worker = debounce((redo) => {

                    // safe outside for
                    // device updates & store changes
                    init = redo;

                    if (stream !== null) {
                        return;
                    }

                    stream = iface.bridge();

                    stream.on("error", (err) => {

                        // feedback
                        logger.error(err, `Could not connect to device tcp://${host}:${port}`);

                        stream = null;
                        redo();

                    });

                    stream.once("open", () => {

                        // feedback
                        logger.info(`Connected to tcp://${host}:${port}`);

                    });

                    stream.once("close", () => {

                        // feedback
                        logger.warn(`Disconnected from tcp://${host}:${port}`);

                        stream = null;
                        redo();

                    });



                    // modbus ip header
                    const header = Buffer.from([
                        0x00, // [0] transaction id, byte 1
                        0x01, // [1] transaction id, byte 2

                        0x00, // [2] protocol id, byte 1
                        0x00, // [3] protocol id, byte 2

                        0x00, // [4] length, byte 1
                        0x06, // [5] length, byte 2

                        0x01, // slave id
                    ]);

                    header.writeUInt16BE(transactionId, 0);
                    header.writeUInt8(store.lean()?.id || 1, 6);

                    //	Gebläse:
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x02,0x00,0x00' | nc -q 1 climate.lan 502	=	Auto
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x02,0x00,0x01' | nc -q 1 climate.lan 502	=	Niedrig
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x02,0x00,0x02' | nc -q 1 climate.lan 502	=	Medium 1
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x02,0x00,0x03' | nc -q 1 climate.lan 502	=	Medium 2
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x02,0x00,0x04' | nc -q 1 climate.lan 502	=	Hoch
                    //
                    //	Ein/Aus:
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x00,0x00,0x00' | nc -q 1 climate.lan 502	=	Aus
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x00,0x00,0x01' | nc -q 1 climate.lan 502	= 	Ein
                    // 
                    //  Vane Position:
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x03,0x00,0x00' | nc -q 1 climate.lan 502	=	Auto
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x03,0x00,0x01' | nc -q 1 climate.lan 502	=	Horizontal
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x03,0x00,0x02' | nc -q 1 climate.lan 502	=	Position 2
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x03,0x00,0x03' | nc -q 1 climate.lan 502	=	Position 3
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x03,0x00,0x04' | nc -q 1 climate.lan 502	=	Position 4
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x03,0x00,0x05' | nc -q 1 climate.lan 502	=	Vertical
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x03,0x00,0x06' | nc -q 1 climate.lan 502	=	Swing
                    //
                    //	Betriebsart:
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x01,0x00,0x00' | nc -q 1 climate.lan 502	=	Auto
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x01,0x00,0x01' | nc -q 1 climate.lan 502	=	Heizen
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x01,0x00,0x02' | nc -q 1 climate.lan 502	=	Trocknen/Luftentfeuchter
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x01,0x00,0x03' | nc -q 1 climate.lan 502	=	Gebläse
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x01,0x00,0x04' | nc -q 1 climate.lan 502	=	Kühlen
                    //
                    //	Temepratur:
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x04,0x00,0x10' | nc -q 1 climate.lan 502	=	16°C
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x04,0x00,0x12' | nc -q 1 climate.lan 502	=	18°C
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x04,0x00,0x14' | nc -q 1 climate.lan 502	=	20°C
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x04,0x00,0x17' | nc -q 1 climate.lan 502	=	23°C
                    //	- echo -n -e ',0x00,0x01,0x00,0x00,0x00,0x06,0x01,0x06,0x00,0x04,0x00,0x19' | nc -q 1 climate.lan 502	=	25°C


                    endpoint.commands.forEach((cmd) => {
                        cmd.setHandler((cmd, iface, params, done) => {

                            // capture value from parameter
                            let value = params.lean()?.value || null;

                            let { register = null, payload = null } = commands.find(({ alias }) => {
                                return cmd.alias === alias;
                            });

                            // abort early, command not found
                            if (register === null) {

                                logger.warn("command/register not found", cmd, register);
                                return done(null, false);

                            }

                            if (payload === null && value === null) {

                                logger.warn("payload/value = null, abort", payload, value);
                                return done(null, false);

                            }


                            // handle parameter value
                            if (["TEMPERATURE", "FAN_SPEED", "VANE"].includes(cmd.alias)) {
                                payload = Buffer.from([
                                    0x00,
                                    value
                                ]);
                            }

                            // PDU
                            // 0x01 // slave id
                            // 0x06, // function code
                            // 0x00, // register, byte 1
                            // 0x00, // register, byte 2
                            // 0x00, // payload, byte 1
                            // 0x01  // payload, byte 2
                            const pdu = Buffer.from([
                                0x06, // function code
                                ...register,
                                ...payload
                            ]);


                            let data = Buffer.concat([
                                header,
                                pdu
                            ]);

                            logger.debug("request:", data);

                            stream.write(data, (err) => {

                                // increment transaction id with overflow
                                transactionId = (transactionId + 1) & 0xFFFF;

                                if (err) {

                                    done(err);

                                } else {

                                    let timeout = setTimeout(() => {
                                        done(null, false);
                                    }, 3000);

                                    stream.once("data", (resp) => {

                                        logger.debug("response:", resp);

                                        clearTimeout(timeout);

                                        done(null, true);

                                    });

                                }

                            });

                        });
                    });

                });

                infinity(worker, 5000);

            }).catch((err) => {

                logger.error(err, "Could not init device handling");

            });

        }, async (filter) => {

            logger.debug("No device found, add one", filter);

            let device = await C_DEVICES.add({
                name: "Mitsubishi Climate",
                icon: "fa-solid fa-temperature-arrow-down",
                interfaces: [{
                    settings: {
                        host: "climate.lan",
                        port: 502
                    }
                }],
                ...filter
            });

            logger.info("Device added", device);

        });


    });
};