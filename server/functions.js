export function isInNDZ(x, y) {
  x = Number(x)
  y = Number(y)
  let isXInNDZ = x >= 150000 && x <= 350000;
  let isYInNDZ = y >= 150000 && y <= 350000;
  if (isXInNDZ && isYInNDZ) return true
  else return false
}

export function filterViolatingDrones(drones) {
  if (drones.length === 0) return []
  let violatingDrones = []

  for (let i = 0; i < drones.length; i++) {
    if (isInNDZ(drones[i].positionX, drones[i].positionY)) violatingDrones.push(drones[i])
  }
  return violatingDrones
}

export function findPilots(drones) {
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
      // setPilots([...localPilots])
    })
}
export function checkPilot(pilot, arr) {
  if (arr.find(({ pilotId }) => pilotId === pilot.pilotId)) return true
  else return false
}

export function deleteOld(arr) {
  if (!arr) return []
  let curTime = Date.now()
  let filteredArr = arr.filter(item => {
    return curTime - item.timeStamp < 600000
  })
  return filteredArr
}