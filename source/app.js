import { peerSocket } from 'messaging'
import { readFileSync } from 'fs'
import { WEATHER_MESSAGE_KEY } from './common'
export { Conditions } from './common'

let weather = undefined

const readWeatherFile = () => {
  try {
    weather = readFileSync(WEATHER_DATA_FILE, 'cbor')
  } catch (n) {
    weather = { timestamp: 0 }
  }
}

const writeWeatherFile = () => {
  try {
    writeFileSync(WEATHER_DATA_FILE, weather, 'cbor')
  } catch (n) {
  }
}

export const fetch = (maximumAge = 0) => {

  if (weather === undefined) {
    readWeatherFile()
  }

  return new Promise((resolve, reject) => {
    const now = Date.now()

    if (weather !== undefined && weather.timestamp !== undefined && (now - weather.timestamp < maximumAge)) {
      resolve(weather)
    }
    else if (peerSocket.readyState !== peerSocket.OPEN) {
      reject('No connection with the companion')
    }
    else {
      const l = (evt) => {
        if (evt.data !== undefined && evt.data[WEATHER_MESSAGE_KEY] !== undefined) {
          peerSocket.removeEventListener('message', l)
          if (evt.data.error) {
            reject(evt.data.error)
          }
          else {
            weather = evt.data.data
            writeWeatherFile()
            resolve(weather)
          }
        }
      }
      peerSocket.addEventListener('message', l)

      // Send a command to the companion
      peerSocket.send({ [WEATHER_MESSAGE_KEY]: 0 })
    }
  })
}