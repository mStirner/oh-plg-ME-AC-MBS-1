# Introduction
This plugin integrates the Mitsubishi/Intensis ME-AC-MBS-1 modbus module into OpenHaus.
It needs [mbusd](https://github.com/3cky/mbusd) to expose/forward the traffic between the USB/RS485 Adapter over Ethernet.

# Links
- https://www.hms-networks.com/p/inmbsmit001i000-mitsubishi-electric-domestic-mr-slim-and-city-multi-to-modbus-rtu-interface
- https://www.mitsubishi-les.info/database/servicemanual/files/BA_ME_AC_MBS_1.pdf
- https://www.breeze24.com/zubehoer/zubehoer-klimaanlagen/geraetesteuerung/sonstiges-steuerungszubehoer/mitsubishi-electric-me-ac-mbs1-modbus-interface-fuer-innengeraete

# Installation
1) Create a new plugin over the OpenHaus backend HTTP API
2) Mount the plugin source code folder into the backend
3) run `npm install`

# Development
Add plugin item via HTTP API:<br />
[PUT] `http://{{HOST}}:{{PORT}}/api/plugins/`
```json
{
   "name":"ME-AC-MBS-1 integration",
   "version": "1.0.0",
   "intents":[
      "devices",
      "endpoints"
   ],
   "uuid": "4cbf7b71-4fe6-48aa-a25d-9373bbdf9491"
}
```

Mount the source code into the backend plugins folder
```sh
sudo mount --bind ~/projects/OpenHaus/plugins/oh-plg-me-ac-mbs-1/ ~/projects/OpenHaus/backend/plugins/4cbf7b71-4fe6-48aa-a25d-9373bbdf9491/
```
