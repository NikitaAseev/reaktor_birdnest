import React, { useEffect, useState } from 'react'
import axios from 'axios'
import logo from './logo.svg';
import './App.css';
import XMLParser from 'react-xml-parser';


function App() {

  const [pilots, setPilots] = useState([])
  const [violators, setViolators] = useState([])


  function isInNDZ(x, y) {
    x = Number(x)
    y = Number(y)
    let isXInNDZ = x >= 150000 && x <= 350000;
    let isYInNDZ = y >= 150000 && y <= 350000;
    if (isXInNDZ && isYInNDZ) return true
    else return false
  }

  function filterViolatingDrones(drones) {
    if (drones.length === 0) return []
    let violatingDrones = []

    for (let i = 0; i < drones.length; i++) {
      if (isInNDZ(drones[i].positionX, drones[i].positionY)) violatingDrones.push(drones[i])
    }
    return violatingDrones
  }

  function findPilots(drones) {
    let url = "https://assignments.reaktor.com/birdnest/pilots/"
    let promises = []
    let localPilots = []
    drones.forEach((item) => {
      promises.push(axios.get(url + item.serialNumber))
    })
    Promise.all(promises)
      .then(res => {
        res.forEach((item, i) => {
          let x = Number(drones[i].positionX)
          let y = Number(drones[i].positionY)
          let distance = Math.round(Math.abs(x > y ? (250000 - x) / 1000 : (250000 - y) / 1000));
          localPilots.push({ ...item.data, distance: distance })
        })
        setPilots([...localPilots])
      })
  }
  function checkPilot(pilot, arr) {
    if (arr.find(({ pilotId }) => pilotId === pilot.pilotId)) return true
    else return false
  }

  function deleteOld(arr) {
    if (!arr) return []
    let curTime = Date.now()
    let filteredArr = arr.filter(item => {
      return curTime - item.timeStamp < 600000
    })
    return filteredArr
  }

  useEffect(() => {
    let interval = setInterval(() => {

      async function run() {

        let localPilots = deleteOld()
        let localDrones = []
        await fetch("https://assignments.reaktor.com/birdnest/drones")
          .then(res => res.text())
          .then(async (data) => {
            let json = new XMLParser().parseFromString(data);

            localDrones = json.children[1].children.map((item, i) => {
              let drone = {
                serialNumber: "",
                model: "",
                manufacturer: "",
                mac: "",
                ipv4: "",
                ipv6: "",
                firmware: "",
                positionY: "",
                positionX: "",
                altitude: "",
              };

              drone.serialNumber = item.children[0].value
              drone.model = item.children[1].value
              drone.manufacturer = item.children[2].value
              drone.mac = item.children[3].value
              drone.ipv4 = item.children[4].value
              drone.ipv6 = item.children[5].value
              drone.firmware = item.children[6].value
              drone.positionY = item.children[7].value
              drone.positionX = item.children[8].value
              drone.altitude = item.children[9].value

              return drone
            })
            localDrones = filterViolatingDrones(localDrones)

            findPilots(localDrones)

          })
          .catch(err => console.log(err));
      }
      run()
    }, 2000);
    return () => {
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    let violatorsCopy = [...violators]
    violatorsCopy = deleteOld(violatorsCopy)
    pilots.forEach(item => {
      if (checkPilot(item, violatorsCopy)) {
        violatorsCopy.find(({ pilotId }) => pilotId === item.pilotId).timeStamp = Date.now()
      }

      else {
        violatorsCopy.push({ ...item, timeStamp: Date.now() })
      }
    })
    setViolators([...violatorsCopy])
  }, [pilots])

  useEffect(() => {
    console.log(violators)
  })

  function renderViolators() {
    return violators.map((item, i) => {
      return (
        <div key={i} className="violator">
          <div className="violator_title">{item.firstName + " " + item.lastName}</div>
          <div className="violator_text">{item.email}</div>
          <div className="violator_text">{item.phoneNumber}</div>
          <div className="violator_text">Closest confirmed distance: {item.distance}m</div>
        </div>
      )
    })
  }

  return (
    <div className="container">

      <div className="title">All recent violators of NDZ</div>

      <div className="violators_container">
        {renderViolators()}
      </div>

    </div>
  );
}

export default App;
