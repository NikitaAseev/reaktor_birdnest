import express from "express"
import path from "path"
import axios from "axios"
import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser"
import { filterViolatingDrones, checkPilot, deleteOld } from "./functions.js"
const app = express();
const __dirname = path.resolve()
const port = process.env.PORT || 3001;
let violators = []

app.get("/api", (req, res) => {
    res.send([...violators].reverse());
});

app.use(express.static(path.resolve(__dirname, "ui/build")));

app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "ui/build", "index.html"));
});

app.listen(port, () => {
    console.log(`Server listening on ${port}`);
});

setInterval(
    () => {
        fetch("https://assignments.reaktor.com/birdnest/drones")
            .then(res => res.text())
            .then(data => {
                let localDrones = new XMLParser({ ignoreAttributes: false }).parse(data).report.capture.drone;

                localDrones = filterViolatingDrones(localDrones)
                let url = "https://assignments.reaktor.com/birdnest/pilots/"
                let promises = []
                let localPilots = []
                localDrones.forEach((item) => {
                    promises.push(axios.get(url + item.serialNumber))
                })
                Promise.all(promises)
                    .then(res => {
                        res.forEach((item, i) => {
                            let x = Number(localDrones[i].positionX)
                            let y = Number(localDrones[i].positionY)
                            let distance = Math.round(Math.abs(x > y ? (250000 - x) / 1000 : (250000 - y) / 1000));
                            localPilots.push({ ...item.data, distance: distance })
                        })

                        violators = deleteOld(violators)
                        localPilots.forEach(item => {
                            if (checkPilot(item, violators)) {
                                violators.find(({ pilotId }) => pilotId === item.pilotId).timeStamp = Date.now()
                            }

                            else {
                                violators.push({ ...item, timeStamp: Date.now() })
                            }
                        })
                    })
                    .catch(e => console.log(e))


            })
            .catch(e => console.log(e))

    }
    , 2000);