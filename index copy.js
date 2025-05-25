const commands = require("./commands.js");
const checksum = require("./checksum.js");

module.exports = (info, logger, init) => {
    return init([
        "devices",
        "endpoints",
    ], (scope, [
        C_DEVICES,
        C_ENDPOINTS,
    ]) => {


        C_DEVICES.found({
            labels: [
                "mitubishi=true",
                "climate=true",
                "modbus=true",
                "module=me-ac-mbs-1"
            ],
        }, (device) => {

            C_ENDPOINTS.found({
                labels: [
                    `device=${device._id}`,
                    ...device.labels
                ]
            }, (endpoint) => {

                // fetch salve id
                // fetch device

                let iface = device.interfaces[0];
                let { host, port } = iface.settings;

                setTimeout(() => {



                    let stream = iface.bridge();

                    stream.once("open", () => {
                        console.log(`connected to tcp://${host}:${port}`);
                    });

                    stream.once("error", (err) => {
                        console.log("Error", err);
                    });

                    let rtu = Buffer.from([
                        0x01,   // slave address
                        0x06,   // function code
                        0x00,   // register
                        0x00,
                        0x00,   // value
                        0x00,
                    ]);

                    // modbus ip header
                    let header = Buffer.from([
                        0x00,
                        0x01,
                        0x00,
                        0x00,
                        0x00,
                        0x06
                    ]);

                    endpoint.commands.forEach((cmd) => {
                        cmd.setHandler((cmd, iface, params, done) => {

                            console.log("CMD", cmd)

                            //let { value } = params.lean();
                            let { register = null, payload = null } = commands.find(({ alias }) => {
                                console.log("find", alias, cmd.alias)
                                return cmd.alias === alias;
                            });

                            // abort early, command not found
                            if (register === null || payload === null) {
                                console.log("command value/register not found", value, register);
                                return done(false);
                            }

                            // handle power command
                            rtu.writeInt16BE(register, 2);
                            rtu.writeInt16BE(payload, 4);


                            console.log("payload", payload);
                            console.log("register", register);


                            logger.debug(`Send rtu:`, rtu);
                            //let payload = checksum(rtu);

                            let data = Buffer.concat([header, rtu]);

                            console.log(data)

                            stream.write(data, (err) => {
                                if (err) {

                                    done(err);

                                } else {

                                    stream.once("data", (resp) => {

                                        console.log("response", resp);

                                        done(null, true);

                                    });

                                }
                            });

                        });
                    });

                }, 3000);

            }, async (filter) => {

                logger.debug("No endpoint found, add one", filter);

                let endpoint = await C_ENDPOINTS.add({
                    name: device.name,
                    device: device._id,
                    icon: "fa-solid fa-temperature-arrow-down",
                    labels: [
                        `device=${device._id}`,
                        ...filter.labels
                    ],
                    commands: commands.map((cmd) => {

                        cmd.interface = device.interfaces[0]._id;

                        delete cmd.register;
                        //delete cmd.payload;?

                        return cmd;

                    })
                });

                logger.info("Endpoint added", endpoint);

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