import { peerSocket } from "messaging"
import { geolocation } from "geolocation"

import { WEATHER_MESSAGE_KEY, Conditions, Providers } from './common'
export { Conditions, Providers } from './common'

const conf = {
  provider: Providers.yahoo,
  apiKey: '',
  feelsLike: false,
  init: false
}

export const setup = ({ provider = Providers.yahoo, apiKey = '', feelsLike = false }) => {

  conf.provider  = provider
  conf.apiKey    = apiKey
  conf.feelsLike = feelsLike

  if (conf.init === false) {
    peerSocket.addEventListener('message', (evt) => {
      // We are receiving a request from the app
      if (evt.data !== undefined && evt.data[WEATHER_MESSAGE_KEY] !== undefined) {
        fetchWeather(conf.provider, conf.apiKey, conf.feelsLike)
          .then(data => {
            peerSocket.send({ [WEATHER_MESSAGE_KEY]: 0, data })
          })
          .catch((error) => {
            peerSocket.send({ [WEATHER_MESSAGE_KEY]: 0, error })
          })
      }
    })
  }
}

const fetchOWMWeather = (apiKey, feelsLike, latitude, longitude) => {
  return new Promise((resolve, reject) => {
    const url = 'https://api.openweathermap.org/data/2.5/weather?appid=' + apiKey + '&lat=' + latitude + '&lon=' + longitude

    console.log(url)

    fetch(encodeURI(url))
      .then(response => response.json())
      .then(data => {

        if (data.weather === undefined) {
          reject(data.message)
          return
        }

        let condition = parseInt(data.weather[0].icon.substring(0, 2), 10)
        switch (condition) {
          case 1: condition = Conditions.ClearSky; break;
          case 2: condition = Conditions.FewClouds; break;
          case 3: condition = Conditions.ScatteredClouds; break;
          case 4: condition = Conditions.BrokenClouds; break;
          case 9: condition = Conditions.ShowerRain; break;
          case 10: condition = Conditions.Rain; break;
          case 11: condition = Conditions.Thunderstorm; break;
          case 13: condition = Conditions.Snow; break;
          case 50: condition = Conditions.Mist; break;
          default: condition = Conditions.Unknown; break;
        }

        const weather = {
          //temperatureK : data.main.temp.toFixed(1),
          temperatureC: data.main.temp - 273.15,
          temperatureF: (data.main.temp - 273.15) * 9 / 5 + 32,
          location: data.name,
          description: data.weather[0].description,
          isDay: (data.dt > data.sys.sunrise && data.dt < data.sys.sunset),
          conditionCode: condition,
          realConditionCode: data.weather[0].id,
          sunrise: data.sys.sunrise * 1000,
          sunset: data.sys.sunset * 1000,
          timestamp: new Date().getTime()
        }

        // Send the weather data to the device
        resolve(weather)
      })
      .catch(e => reject(e.message))
  })
}

const fetchWUWeather = (apiKey, feelsLike, latitude, longitude) => {
  return new Promise((resolve, reject) => {
    const url = 'https://api.wunderground.com/api/' + apiKey + '/conditions/q/' + latitude + ',' + longitude + '.json'

    console.log(encodeURI(url))

    fetch(encodeURI(url))
      .then(response => response.json())
      .then(data => {
        if (data.current_observation === undefined) {
          reject(data.response.error.description)
          return
        }

        let condition = data.current_observation.icon
        if (condition === 'clear') {
          condition = Conditions.ClearSky
        }
        else if (condition === 'mostlysunny' || condition === 'partlycloudy') {
          condition = Conditions.FewClouds
        }
        else if (condition === 'partlysunny' || condition === 'mostlycloudy') {
          condition = Conditions.ScatteredClouds
        }
        else if (condition === 'cloudy') {
          condition = Conditions.BrokenClouds
        }
        else if (condition === 'rain') {
          condition = Conditions.Rain
        }
        else if (condition === 'tstorm') {
          condition = Conditions.Thunderstorm
        }
        else if (condition === 'snow' || condition === 'sleet' || condition === 'flurries') {
          condition = Conditions.Snow
        }
        else if (condition === 'fog' || condition === 'hazy') {
          condition = Conditions.Mist
        }
        else {
          condition = Conditions.Unknown
        }

        var temp = feelsLike ? parseFloat(data.current_observation.feelslike_c) : data.current_observation.temp_c

        const weather = {
          //temperatureK : (temp + 273.15).toFixed(1),
          temperatureC: temp,
          temperatureF: (temp * 9 / 5 + 32),
          location: data.current_observation.display_location.city,
          description: data.current_observation.weather,
          isDay: data.current_observation.icon_url.indexOf("nt_") == -1,
          conditionCode: condition,
          realConditionCode: data.current_observation.icon,
          sunrise: 0,
          sunset: 0,
          timestamp: new Date().getTime()
        }

        // Send the weather data to the device
        resolve(weather);
      })
      .catch(e => reject(e.message))
  })
}

const fetchDarkskyWeather = (apiKey, feelsLike, latitude, longitude) => {
  return new Promise((resolve, reject) => {
    const url = 'https://api.darksky.net/forecast/' + apiKey + '/' + latitude + ',' + longitude + '?exclude=minutely,hourly,alerts,flags&units=si'

    console.log(url)

    fetch(encodeURI(url))
      .then(response => response.json())
      .then(data => {

        if (data.currently === undefined) {
          reject(data)
          return
        }

        let condition = data.currently.icon
        if (condition === 'clear-day' || condition === 'clear-night') {
          condition = Conditions.ClearSky
        }
        else if (condition === 'partly-cloudy-day' || condition === 'partly-cloudy-night') {
          condition = Conditions.FewClouds
        }
        else if (condition === 'cloudy') {
          condition = Conditions.BrokenClouds
        }
        else if (condition === 'rain') {
          condition = Conditions.Rain
        }
        else if (condition === 'thunderstorm') {
          condition = Conditions.Thunderstorm
        }
        else if (condition === 'snow' || condition === 'sleet') {
          condition = Conditions.Snow
        }
        else if (condition === 'fog') {
          condition = Conditions.Mist
        }
        else {
          condition = Conditions.Unknown
        }

        var temp = feelsLike ? data.currently.apparentTemperature : data.currently.temperature

        let weather = {
          //temperatureK : (temp + 273.15).toFixed(1),
          temperatureC: temp,
          temperatureF: (temp * 9 / 5 + 32),
          location: "",
          description: data.currently.summary,
          isDay: data.currently.icon.indexOf("-day") > 0,
          conditionCode: condition,
          realConditionCode: data.currently.icon,
          sunrise: data.daily.data[0].sunriseTime * 1000,
          sunset: data.daily.data[0].sunsetTime * 1000,
          timestamp: new Date().getTime()
        }

        // retreiving location name from Open Street Map
        let url = 'https://nominatim.openstreetmap.org/reverse?lat=' + latitude + '&lon=' + longitude + '&format=json&accept-language=en-US'

        fetch(url)
          .then(response => response.json())
          .then(data => {

            if (data.address.hamlet != undefined) weather.location = data.address.hamlet
            else if (data.address.village != undefined) weather.location = data.address.village
            else if (data.address.town != undefined) weather.location = data.address.town
            else if (data.address.city != undefined) weather.location = data.address.city

            // Send the weather data to the device
            resolve(weather)
          })
          .catch(() => {
            resolve(weather) // if location name not found - sending weather without location
          })
      })
      .catch(e => reject(e.message))
  })
}

const fetchYahooWeather = (apiKey, feelsLike, latitude, longitude) => {
  return new Promise((resolve, reject) => {
    const url = 'https://query.yahooapis.com/v1/public/yql?q=select astronomy, location.city, item.condition from weather.forecast where woeid in ' +
      '(select woeid from geo.places(1) where text=\'(' + latitude + ',' + longitude + ')\') and u=\'c\'&format=json'

    console.log(url)

    fetch(encodeURI(url))
      .then(response => response.json())
      .then(data => {

        if (data.query === undefined || data.query.results === undefined || data.query.results.channel === undefined) {
          reject(data)
          return
        }

        var condition = parseInt(data.query.results.channel.item.condition.code)
        switch (condition) {
          case 31:
          case 32:
          case 33:
          case 34:
            condition = Conditions.ClearSky; break;
          case 29:
          case 30:
          case 44:
            condition = Conditions.FewClouds; break;
          case 8:
          case 9:
            condition = Conditions.ShowerRain; break;
          case 6:
          case 10:
          case 11:
          case 12:
          case 35:
          case 40:
            condition = Conditions.Rain; break;
          case 1:
          case 3:
          case 4:
          case 37:
          case 38:
          case 39:
          case 47:
            condition = Conditions.Thunderstorm; break;
          case 5:
          case 7:
          case 13:
          case 14:
          case 15:
          case 16:
          case 41:
          case 42:
          case 43:
            condition = Conditions.Snow; break;
          case 20:
            condition = Conditions.Mist; break;
          case 26:
          case 27:
          case 28:
            condition = Conditions.BrokenClouds; break;
          default: condition = Conditions.Unknown; break;
        }

        const current_time = new Date()
        const sunrise_time = prv_timeParse(data.query.results.channel.astronomy.sunrise)
        const sunset_time = prv_timeParse(data.query.results.channel.astronomy.sunset)

        const weather = {
          //temperatureK : (parseInt(data.query.results.channel.item.condition.temp) + 273.15),
          temperatureC: parseInt(data.query.results.channel.item.condition.temp),
          temperatureF: (parseInt(data.query.results.channel.item.condition.temp) * 9 / 5 + 32),
          location: data.query.results.channel.location.city,
          description: data.query.results.channel.item.condition.text,
          isDay: current_time > sunrise_time && current_time < sunset_time,
          conditionCode: condition,
          realConditionCode: data.query.results.channel.item.condition.code,
          sunrise: sunrise_time.getTime(),
          sunset: sunset_time.getTime(),
          timestamp: current_time.getTime()
        }

        // Send the weather data to the device
        resolve(weather)
      })
      .catch(e => reject(e.message))
  })
}

const fetchWeatherbit = (apiKey, feelsLike, latitude, longitude) => {
  return new Promise((resolve, reject) => {
    const url = 'https://api.weatherbit.io/v2.0/current?key=' + apiKey + '&lat=' + latitude + '&lon=' + longitude

    fetch(encodeURI(url))
      .then((response) => { return response.json() })
      .then(data => {

        if (data.data === undefined || data.count !== 1) {
          reject(data.error);
          return;
        }

        let condition = parseInt(data.data[0].weather.code)
        switch (condition) {
          case 200:
          case 201:
          case 202:
          case 230:
          case 231:
          case 232:
          case 233:
            condition = Conditions.Thunderstorm; break;
          case 520:
          case 521:
          case 522:
            condition = Conditions.ShowerRain; break;
          case 500:
          case 501:
          case 502:
          case 511:
            condition = Conditions.Rain; break;
          case 300:
          case 301:
          case 302:
          case 600:
          case 601:
          case 602:
          case 603:
          case 610:
          case 611:
          case 612:
          case 621:
          case 622:
          case 623:
            condition = Conditions.Snow; break;
          case 700:
          case 711:
          case 721:
          case 731:
          case 741:
          case 751:
            condition = Conditions.Mist; break;
          case 800:
            condition = Conditions.ClearSky; break;
          case 801:
            condition = Conditions.FewClouds; break;
          case 802:
            condition = Conditions.ScatteredClouds; break;
          case 803:
          case 804:
            condition = Conditions.BrokenClouds; break;
          default: condition = Conditions.Unknown; break;
        }

        const current_time = new Date()
        const temp = data.data[0].temp

        const weather = {
          temperatureC: temp,
          temperatureF: (temp * 9 / 5 + 32),
          conditionCode: data.data[0].weather.code,
          location: data.data[0].city_name,
          description: data.data[0].weather.description,
          isDay: data.data[0].weather.icon.endsWith("d"),
          conditionCode: condition,
          realConditionCode: data.data[0].weather.code,
          sunrise: data.data[0].sunrise,
          sunset: data.data[0].sunset,
          timestamp: current_time.getTime()
        }
        
        // Send the weather data to the device
        resolve(weather)
      })
      .catch(e => reject(e.message))
  })
}

const prv_timeParse = (str) => {
  const buff = str.split(" ");
  if (buff.length === 2) {
    var time = buff[0].split(":");
    if (buff[1].toLowerCase() === "pm" && parseInt(time[0]) !== 12) {
      time[0] = (parseInt(time[0]) + 12) + ""
    }
  }

  var date = new Date()
  date.setHours(parseInt(time[0]))
  date.setMinutes(parseInt(time[1]))

  return date;
}

const fetchFuncs = {
  [Providers.yahoo]           : fetchYahooWeather,
  [Providers.openweathermap]  : fetchOWMWeather,
  [Providers.wunderground]    : fetchWUWeather,
  [Providers.darksky]         : fetchDarkskyWeather,
  [Providers.weatherbit]      : fetchWeatherbit
}

const fetchWeather = (provider, apiKey, feelsLike) => {
  return new Promise((resolve, reject) => {
    const fetchFunc = fetchFuncs[provider]
    if(fetchFunc === undefined) {
      reject('Unsupported provider')
    }
    else {
      geolocation.getCurrentPosition(
        (position) => {
          fetchFunc(apiKey, feelsLike, position.coords.latitude, position.coords.longitude)
            .then(resolve)
            .catch(reject)
        },
        reject, 
        { "enableHighAccuracy": false, "maximumAge": 1000 * 1800 }
      )
    }
  })
}