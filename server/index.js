// Here go all imports
import express from "express"
import path from "path"
import axios from "axios"
import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser"
import { filterViolatingDrones, checkPilot, deleteOld } from "./functions.js"

// Defining express, path, port and violators array, which will be later sent out to the api
const app = express();
const __dirname = path.resolve()
const port = process.env.PORT || 3001;
let violators = []

// Make the server send out the violators array when a request was made to /api
// The array is reversed, because I want to most recent violators be on top and the oldest on the bottom
app.get("/api", (req, res) => {
    res.send([...violators].reverse());
});

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, "ui/build")));
app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "ui/build", "index.html"));
});

// Listening to the defined port
app.listen(port, () => {
    console.log(`Server listening on ${port}`);
});

setInterval(
    () => {
        fetch("https://assignments.reaktor.com/birdnest/drones")
            .then(res => res.text())
            .then(data => {
                // Parsing information on drones from the endpoint
                let localDrones = new XMLParser({ ignoreAttributes: false }).parse(data).report.capture.drone;

                // Filtering drones that are in the NDZ, we're only interested in those
                localDrones = filterViolatingDrones(localDrones)
                let url = "https://assignments.reaktor.com/birdnest/pilots/"
                // Defining variables, promises array will be used to get information on the violators
                let promises = []
                let localPilots = []
                // Making requests on pilot information
                localDrones.forEach((item) => {
                    promises.push(axios.get(url + item.serialNumber))
                })
                // Getting information from the queries
                Promise.all(promises)
                    .then(res => {
                        res.forEach((item, i) => {
                            // Finding out how close the drone was, on x or y axis, whichever is the closest
                            // Adding the info to the pilot object and pushing it to the localPilots array
                            let x = Number(localDrones[i].positionX)
                            let y = Number(localDrones[i].positionY)
                            let distance = Math.round(Math.abs(x < y ? (250000 - x) / 1000 : (250000 - y) / 1000));
                            localPilots.push({ ...item.data, distance: distance })
                        })

                        // Deleting old violators (i. e. those that were on the list for more than 10 minutes)
                        violators = deleteOld(violators)
                        // For each new violator, we check if they're already in the list
                        localPilots.forEach(item => {
                            // If yes, then we just update their timestamp, so that they don't expire
                            if (checkPilot(item, violators)) {
                                violators.find(({ pilotId }) => pilotId === item.pilotId).timeStamp = Date.now()
                            }
                            
                            // If not, we just add them to the violators array
                            else {
                                violators.push({ ...item, timeStamp: Date.now() })
                            }
                        })
                    })
                    // Catching errors
                    .catch(e => console.log(e))
            })
            // Catching errors
            .catch(e => console.log(e))

    }
    , 2000);