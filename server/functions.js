// Function that checks if a drone is in NDZ or not, according to it's coordinates
export function isInNDZ(x, y) {
  x = Number(x)
  y = Number(y)
  let isXInNDZ = x >= 150000 && x <= 350000;
  let isYInNDZ = y >= 150000 && y <= 350000;
  if (isXInNDZ && isYInNDZ) return true
  else return false
}

// Function, that checks each drone in an array if it's in the NDZ 
// with isInNDZ function and returns new array with only the ones that are
export function filterViolatingDrones(drones) {
  if (drones.length === 0) return []
  let violatingDrones = []

  for (let i = 0; i < drones.length; i++) {
    if (isInNDZ(drones[i].positionX, drones[i].positionY)) violatingDrones.push(drones[i])
  }
  return violatingDrones
}

// Function that checks if a pilot is in arr
export function checkPilot(pilot, arr) {
  if (arr.find(({ pilotId }) => pilotId === pilot.pilotId)) return true
  else return false
}


// A function that checks each arr's element's timestamp and deletes all that are older than 10 minutes. 
// Returns new array with only the fresh ones
export function deleteOld(arr) {
  if (!arr) return []
  let curTime = Date.now()
  let filteredArr = arr.filter(item => {
    return curTime - item.timeStamp < 600000
  })
  return filteredArr
}