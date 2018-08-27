import { peerSocket } from 'messaging'
import { readFileSync, writeFileSync } from 'fs'
export { Conditions } from './common'

let weather = undefined

const WEATHER_DATA_FILE = "276e3d15-ffae-4a07-bda5-f1851e68cc77" // should be a unique name

const promises = {}
const requests = []

const readWeatherFile = () => {
  try {
    weather = readFileSync(WEATHER_DATA_FILE, 'cbor')
  } catch (n) {
    weather = undefined
  }
}

const writeWeatherFile = () => {
  try {
    writeFileSync(WEATHER_DATA_FILE, weather, 'cbor')
  } catch (n) {
  }
}

const sendRequest = (r) => {
  if (peerSocket.readyState === peerSocket.OPEN) {
    peerSocket.send(r);
  } else {
    requests.push(r);
  }
}

peerSocket.addEventListener('message', (evt) => {
  const { weather_message_id, data, error } = evt.data
  if (weather_message_id) {
    const promise = promises[weather_message_id]
    if (error) {
      promise.reject(error)
    }
    else {
      weather = data
      weather.timestamp = Date.now()
      writeWeatherFile()
      promise.resolve(weather)
    }
    delete promises[weather_message_id]
  }
})

peerSocket.addEventListener('open', (evt) => {
  setTimeout(() => {
    requests.forEach(r => sendRequest(r))
    requests.length = 0
  }, 500);
})

peerSocket.addEventListener('error', (err) => {
  console.log("Connection error: " + err.message)
  // I don't know what to do in this case yet... Notify every promises object ?
})

export const fetch = (maximumAge = 0) => {

  if (weather === undefined) {
    readWeatherFile()
  }

  return new Promise((resolve, reject) => {
    const now = Date.now()
    if (weather && (now - weather.timestamp < maximumAge)) {
      resolve(weather)
    }
    else {
      promises[now] = { resolve, reject }
      sendRequest({ weather_message_id : now })
    }
  })
}

export const get = () => {
  if(weather === undefined) {
    readWeatherFile()
  }
  return weather
}