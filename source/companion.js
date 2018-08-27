import { peerSocket } from "messaging"
import { geolocation } from "geolocation"

import { Conditions, Providers } from './common'
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
      const { weather_message_id } = evt.data
      // We are receiving a request from the app
      if (weather_message_id) {
        fetchWeather(conf.provider, conf.apiKey, conf.feelsLike)
          .then(data => {
            peerSocket.send({ weather_message_id, data })
          })
          .catch((error) => {
            peerSocket.send({ weather_message_id, error })
          })
      }
    })
  }
}

let mapping_codes = {
  [Providers.yahoo] : {
    "31": Conditions.ClearSky,
    "32": Conditions.ClearSky,
    "33": Conditions.ClearSky,
    "34": Conditions.ClearSky,
    "29": Conditions.FewClouds,
    "30": Conditions.FewClouds,
    "44": Conditions.FewClouds,
    "8": Conditions.ShowerRain,
    "9": Conditions.ShowerRain,
    "6": Conditions.Rain,
    "10": Conditions.Rain,
    "11": Conditions.Rain,
    "12": Conditions.Rain,
    "35": Conditions.Rain,
    "40": Conditions.Rain,
    "1": Conditions.Thunderstorm,
    "3": Conditions.Thunderstorm,
    "4": Conditions.Thunderstorm,
    "37": Conditions.Thunderstorm,
    "38": Conditions.Thunderstorm,
    "39": Conditions.Thunderstorm,
    "47": Conditions.Thunderstorm,
    "5": Conditions.Snow,
    "7": Conditions.Snow,
    "13": Conditions.Snow,
    "14": Conditions.Snow,
    "15": Conditions.Snow,
    "16": Conditions.Snow,
    "41": Conditions.Snow,
    "42": Conditions.Snow,
    "43": Conditions.Snow,
    "20": Conditions.Mist,
    "26": Conditions.BrokenClouds,
    "27": Conditions.BrokenClouds,
    "28": Conditions.BrokenClouds
  },
  [Providers.openweathermap] : {
    200 : Conditions.Thunderstorm,
    201 : Conditions.Thunderstorm,
    202 : Conditions.Thunderstorm,
    210 : Conditions.Thunderstorm,
    211 : Conditions.Thunderstorm,
    212 : Conditions.Thunderstorm,
    221 : Conditions.Thunderstorm,
    230 : Conditions.Thunderstorm,
    231 : Conditions.Thunderstorm,
    232 : Conditions.Thunderstorm,

    300: Conditions.Snow,
    301: Conditions.Snow,
    302: Conditions.Snow,
    310: Conditions.Snow,
    311: Conditions.Snow,
    312: Conditions.Snow,
    313: Conditions.Snow,
    314: Conditions.Snow,
    321: Conditions.Snow,

    500: Conditions.Rain,
    501: Conditions.Rain,
    502: Conditions.Rain,
    503: Conditions.Rain,
    504: Conditions.Rain,
    511: Conditions.Rain,
    520: Conditions.ShowerRain,
    521: Conditions.ShowerRain,
    522: Conditions.ShowerRain,
    531: Conditions.ShowerRain,

    600: Conditions.Snow,
    601: Conditions.Snow,
    602: Conditions.Snow,
    611: Conditions.Snow,
    612: Conditions.Snow,
    615: Conditions.Snow,
    616: Conditions.Snow,
    620: Conditions.Snow,
    621: Conditions.Snow,
    622: Conditions.Snow,

    701: Conditions.Mist,
    711: Conditions.Mist,
    721: Conditions.Mist,
    731: Conditions.Mist,
    741: Conditions.Mist,
    // 751: ,
    // 761: ,
    // 762: ,
    // 771: ,
    // 781: ,

    800: Conditions.ClearSky,

    801: Conditions.FewClouds,
    802: Conditions.ScatteredClouds,
    803: Conditions.BrokenClouds,
    804: Conditions.BrokenClouds
  },
  [Providers.wunderground] : {
    'clear' : Conditions.ClearSky,
    'mostlysunny' : Conditions.FewClouds,
    'partlycloudy' : Conditions.FewClouds,
    'partlysunny' : Conditions.ScatteredClouds,
    'mostlycloudy' : Conditions.ScatteredClouds,
    'cloudy' : Conditions.BrokenClouds,
    'rain' : Conditions.Rain,
    'tstorm' : Conditions.Thunderstorm,
    'snow' : Conditions.Snow,
    'sleet' : Conditions.Snow,
    'flurries' : Conditions.Snow,
    'fog' : Conditions.Mist,
    'hazy' : Conditions.Mist
  },
  [Providers.darksky] : {
    'clear-day' : Conditions.ClearSky,
    'clear-night' : Conditions.ClearSky,
    'partly-cloudy-day' : Conditions.FewClouds,
    'partly-cloudy-night' : Conditions.FewClouds,
    'cloudy' : Conditions.BrokenClouds,
    'rain' : Conditions.Rain,
    'thunderstorm' : Conditions.Thunderstorm,
    'snow' : Conditions.Snow,
    'sleet' : Conditions.Snow,
    'fog' : Conditions.Mist
  },
  [Providers.weatherbit] : {
    "200": Conditions.Thunderstorm,
    "201": Conditions.Thunderstorm,
    "202": Conditions.Thunderstorm,
    "230": Conditions.Thunderstorm,
    "231": Conditions.Thunderstorm,
    "232": Conditions.Thunderstorm,
    "233": Conditions.Thunderstorm,
    "300": Conditions.Snow,
    "301": Conditions.Snow,
    "302": Conditions.Snow,
    "500": Conditions.Rain,
    "501": Conditions.Rain,
    "502": Conditions.Rain,
    "511": Conditions.Rain,
    "520": Conditions.ShowerRain,
    "521": Conditions.ShowerRain,
    "522": Conditions.ShowerRain,
    
    "600": Conditions.Snow,
    "601": Conditions.Snow,
    "602": Conditions.Snow,
    "603": Conditions.Snow,
    "610": Conditions.Snow,
    "611": Conditions.Snow,
    "612": Conditions.Snow,
    "621": Conditions.Snow,
    "622": Conditions.Snow,
    "623": Conditions.Snow,

    "700": Conditions.Mist,
    "711": Conditions.Mist,
    "721": Conditions.Mist,
    "731": Conditions.Mist,
    "741": Conditions.Mist,
    "751": Conditions.Mist,

    "800": Conditions.ClearSky,
    "801": Conditions.FewClouds,
    "802": Conditions.ScatteredClouds,
    "803": Conditions.BrokenClouds,
    "804": Conditions.BrokenClouds,

    "900": Conditions.Unknown
  }
}

export const setCustomCodes = (codes) => (mapping_codes = codes)


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

        let condition = data.weather[0].id
        condition = mapping_codes[Providers.openweathermap][condition]
        
        const weather = {
          temperatureC: data.main.temp - 273.15,
          temperatureF: (data.main.temp - 273.15) * 9 / 5 + 32,
          location: data.name,
          description: data.weather[0].description,
          isDay: (data.dt > data.sys.sunrise && data.dt < data.sys.sunset),
          conditionCode : condition !== undefined ? condition : Conditions.Unknown,
          realConditionCode: data.weather[0].id,
          sunrise: data.sys.sunrise * 1000,
          sunset: data.sys.sunset * 1000
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
        condition = mapping_codes[Providers.wunderground][condition]

        var temp = feelsLike ? parseFloat(data.current_observation.feelslike_c) : data.current_observation.temp_c

        const weather = {
          temperatureC: temp,
          temperatureF: (temp * 9 / 5 + 32),
          location: data.current_observation.display_location.city,
          description: data.current_observation.weather,
          isDay: data.current_observation.icon_url.indexOf("nt_") == -1,
          conditionCode : condition !== undefined ? condition : Conditions.Unknown,
          realConditionCode: data.current_observation.icon,
          sunrise: 0,
          sunset: 0
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
        condition = mapping_codes[Providers.darksky][condition]

        var temp = feelsLike ? data.currently.apparentTemperature : data.currently.temperature

        let weather = {
          temperatureC: temp,
          temperatureF: (temp * 9 / 5 + 32),
          location: "",
          description: data.currently.summary,
          isDay: data.currently.icon.indexOf("-day") > 0,
          conditionCode : condition !== undefined ? condition : Conditions.Unknown,
          realConditionCode: data.currently.icon,
          sunrise: data.daily.data[0].sunriseTime * 1000,
          sunset: data.daily.data[0].sunsetTime * 1000
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

        var condition = data.query.results.channel.item.condition.code
        condition = mapping_codes[Providers.yahoo][condition]

        const current_time = new Date()
        const sunrise_time = prv_timeParse(data.query.results.channel.astronomy.sunrise)
        const sunset_time = prv_timeParse(data.query.results.channel.astronomy.sunset)

        const weather = {
          temperatureC: parseInt(data.query.results.channel.item.condition.temp),
          temperatureF: (parseInt(data.query.results.channel.item.condition.temp) * 9 / 5 + 32),
          location: data.query.results.channel.location.city,
          description: data.query.results.channel.item.condition.text,
          isDay: current_time > sunrise_time && current_time < sunset_time,
          conditionCode : condition !== undefined ? condition : Conditions.Unknown,
          realConditionCode: data.query.results.channel.item.condition.code,
          sunrise: sunrise_time.getTime(),
          sunset: sunset_time.getTime()
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

        let condition = data.data[0].weather.code
        condition = mapping_codes[Providers.weatherbit][condition]

        const current_time = new Date()
        const temp = data.data[0].temp

        const weather = {
          temperatureC: temp,
          temperatureF: (temp * 9 / 5 + 32),
          conditionCode: data.data[0].weather.code,
          location: data.data[0].city_name,
          description: data.data[0].weather.description,
          isDay: data.data[0].weather.icon.endsWith("d"),
          conditionCode : condition !== undefined ? condition : Conditions.Unknown,
          realConditionCode: data.data[0].weather.code,
          sunrise: data.data[0].sunrise,
          sunset: data.data[0].sunset
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