import { peerSocket } from "messaging";
import { geolocation } from "geolocation";
import * as utils from "./utils.js";

export const Conditions = {
  ClearSky        : 0,
  FewClouds       : 1,
  ScatteredClouds : 2,
  BrokenClouds    : 3,
  ShowerRain      : 4,
  Rain            : 5,
  Thunderstorm    : 6,
  Snow            : 7,
  Mist            : 8,
  Unknown         : 1000,
};

var WEATHER_MESSAGE_KEY = "my_awesome_weather_message";

export default class Weather {
  
  constructor() {
    this._apiKey = '';
    this._provider = 'yahoo';
    this._feelsLike = true;
    this._weather = undefined;
    this._maximumAge = 0;

    this.onerror = undefined;
    this.onsuccess = undefined;
    
    peerSocket.addEventListener("message", (evt) => {
      if(utils.isRunningOnDevice()) {
        if (evt.data !== undefined && evt.data[WEATHER_MESSAGE_KEY] !== undefined) {
          // We are receiving the answer from the companion
          if(evt.data[WEATHER_MESSAGE_KEY].error !== undefined){
            if(this.onerror) this.onerror(evt.data[WEATHER_MESSAGE_KEY].error);
          }
          else {
            this._weather = evt.data[WEATHER_MESSAGE_KEY];
            if(this.onsuccess) this.onsuccess(evt.data[WEATHER_MESSAGE_KEY]);
          }
        }
      }
      else {
        // We are receiving a request from the app
        if (evt.data !== undefined && evt.data[WEATHER_MESSAGE_KEY] !== undefined) {
          let message = evt.data[WEATHER_MESSAGE_KEY];
          prv_fetchRemote(message.provider, message.apiKey, message.feelsLike);
        }
      }
    });
  }
  
  setApiKey(apiKey) {
    this._apiKey = apiKey;
  }
  
  setProvider(provider) {
    this._provider = provider;
  }
  
  setFeelsLike(feelsLike) {
    this._feelsLike = feelsLike;
  }
  
  setMaximumAge(maximumAge) {
    this._maximumAge = maximumAge;
  }
  
  fetch() {
    let now = new Date().getTime();
    if(this._weather !== undefined && this._weather.timestamp !== undefined && (now - this._weather.timestamp < this._maximumAge)) {
      // return previous weather if the maximu age is not reached
      if(this.onsuccess) this.onsuccess(this._weather);
      return;
    }
    
    if(utils.isRunningOnDevice()){
      if (peerSocket.readyState === peerSocket.OPEN) {
        // Send a command to the companion
        let message = {};
        message[WEATHER_MESSAGE_KEY] = {};
        message[WEATHER_MESSAGE_KEY].apiKey    = this._apiKey;
        message[WEATHER_MESSAGE_KEY].provider  = this._provider;
        message[WEATHER_MESSAGE_KEY].feelsLike = this._feelsLike;
        peerSocket.send(message);
      }
      else {
        if(this.onerror) this.onerror("No connection with the companion");
      }
    }
    else {
      geolocation.getCurrentPosition(
        (position) => {
          //console.log("Latitude: " + position.coords.latitude + " Longitude: " + position.coords.longitude);
          prv_fetch(this._provider, this._apiKey, this._feelsLike, position.coords.latitude, position.coords.longitude, 
                (data) => {
                  this._weather = data;
                  if(this.onsuccess) this.onsuccess(data);
                }, 
                this.onerror);
        }, 
        (error) => {
          if(this.onerror) this.onerror(error);
        }, 
        {"enableHighAccuracy" : false, "maximumAge" : 1000 * 1800});
    }
  }
};

/*******************************************/
/*********** PRIVATE FUNCTIONS  ************/
/*******************************************/

function prv_fetchRemote(provider, apiKey, feelsLike) {
  geolocation.getCurrentPosition(
    (position) => {
      prv_fetch(provider, apiKey, feelsLike, position.coords.latitude, position.coords.longitude,
          (data) => {
            if (peerSocket.readyState === peerSocket.OPEN) {
              let answer = {};
              answer[WEATHER_MESSAGE_KEY] = data;
              peerSocket.send( answer );
            } else {
              console.log("Error: Connection is not open with the device");
            }
          },
          (error) => { 
            if (peerSocket.readyState === peerSocket.OPEN) {
              let answer = {};
              answer[WEATHER_MESSAGE_KEY] = { error : error };  
              peerSocket.send( answer );
            }
            else {
              console.log("Error : " + JSON.stringify(error) + " " + error); 
            }
          }
      );
    }, 
    (error) => {
      if (peerSocket.readyState === peerSocket.OPEN) {
        let answer = {};
        answer[WEATHER_MESSAGE_KEY] = { error : error };  
        peerSocket.send( answer );
      }
      else {
        console.log("Location Error : " + error.message); 
      }
    }, 
    {"enableHighAccuracy" : false, "maximumAge" : 1000 * 1800});
}

function prv_fetch(provider, apiKey, feelsLike, latitude, longitude, success, error) {
  // console.log("Latitude: " + latitude + " Longitude: " + longitude);
  if( provider === "owm" ) {
    prv_queryOWMWeather(apiKey, latitude, longitude, success, error);
  }
  else if( provider === "wunderground" ) {
    prv_queryWUWeather(apiKey, feelsLike, latitude, longitude, success, error);
  }
  else if( provider === "darksky" ) {
    prv_queryDarkskyWeather(apiKey, feelsLike, latitude, longitude, success, error);
  }
  else 
  {
    prv_queryYahooWeather(latitude, longitude, success, error);
  }
}

function prv_queryOWMWeather(apiKey, latitude, longitude, success, error) {
  var url = 'http://api.openweathermap.org/data/2.5/weather?appid=' + apiKey + '&lat=' + latitude + '&lon=' + longitude;

  fetch(url)
  .then((response) => {return response.json()})
  .then((data) => { 
      
      if(data.weather === undefined){
        if(error) error(data);
        return;
      }

      var condition = parseInt(data.weather[0].icon.substring(0,2), 10);
      switch(condition){
        case 1 :  condition = Conditions.ClearSky; break;
        case 2 :  condition = Conditions.FewClouds;  break;
        case 3 :  condition = Conditions.ScatteredClouds;  break;
        case 4 :  condition = Conditions.BrokenClouds;  break;
        case 9 :  condition = Conditions.ShowerRain;  break;
        case 10 : condition = Conditions.Rain; break;
        case 11 : condition = Conditions.Thunderstorm; break;
        case 13 : condition = Conditions.Snow; break;
        case 50 : condition = Conditions.Mist; break;
        default : condition = Conditions.Unknown; break;
      }
      let weather = {
        //temperatureK : data.main.temp.toFixed(1),
        temperatureC : data.main.temp - 273.15,
        temperatureF : (data.main.temp - 273.15)*9/5 + 32,
        location : data.name,
        description : data.weather[0].description,
        isDay : (data.dt > data.sys.sunrise && data.dt < data.sys.sunset),
        conditionCode : condition,
        sunrise : data.sys.sunrise,
        sunset : data.sys.sunset,
        timestamp : new Date().getTime()
      };
      // Send the weather data to the device
      if(success) success(weather);
  })
  .catch((err) => { if(error) error(err); });
};

function prv_queryWUWeather(apiKey, feelsLike, latitude, longitude, success, error) {
  var url = 'http://api.wunderground.com/api/' + apiKey + '/Conditions/q/' + latitude + ',' + longitude + '.json';

  fetch(url)
  .then((response) => {return response.json()})
  .then((data) => { 
      
      if(data.current_observation === undefined){
        if(error) error(data);
        return;
      }

      var condition = data.current_observation.icon;
      if(condition === 'clear'){
        condition = Conditions.ClearSky;
      }
      else if(condition === 'mostlyysunny' || condition === 'partlycloudy'){
        condition = Conditions.FewClouds;
      }
      else if(condition === 'partlysunny' || condition === 'mostlycloudy'){
        condition = Conditions.ScatteredClouds;
      }
      else if(condition === 'cloudy'){
        condition = Conditions.BrokenClouds;
      }
      else if(condition === 'rain'){
        condition = Conditions.Rain;
      }
      else if(condition === 'tstorm'){
        condition = Conditions.Thunderstorm;
      }
      else if(condition === 'snow' || condition === 'sleet' || condition === 'flurries'){
        condition = Conditions.Thunderstorm;
      }
      else if(condition === 'fog' || condition === 'hazy'){
        condition = Conditions.Mist;
      }
      else {
        condition = Conditions.Unknown;
      }

      var temp = feelsLike ? parseFloat(data.current_observation.feelslike_c) : data.current_observation.temp_c;

      let weather = {
        //temperatureK : (temp + 273.15).toFixed(1),
        temperatureC : temp,
        temperatureF : (temp*9/5 + 32),
        location : data.current_observation.display_location.city,
        description : data.current_observation.weather,
        isDay : data.current_observation.icon_url.indexOf("nt_") == -1,
        conditionCode :condition,
        sunrise : '0',
        sunset : '0',
        timestamp : new Date().getTime()
      };
      // Send the weather data to the device
      if(success) success(weather);
  })
  .catch((err) => { if(error) error(err); });
};

function prv_queryDarkskyWeather(apiKey, feelsLike, latitude, longitude, success, error) {
  var url = 'https://api.darksky.net/forecast/' + apiKey + '/' + latitude + ',' + longitude + '?exclude=minutely,hourly,alerts,flags&units=si';

  fetch(url)
  .then((response) => {return response.json()})
  .then((data) => {        
    
      if(data.currently === undefined){
        if(error) error(data);
        return;
      }

      var condition = data.currently.icon;
      if(condition === 'clear-day' || condition === 'clear-night'){
        condition = Conditions.ClearSky;
      }
      else if(condition === 'partly-cloudy-day' || condition === 'partly-cloudy-night'){
        condition = Conditions.FewClouds;
      }
      else if(condition === 'cloudy'){
        condition = Conditions.BrokenClouds;
      }
      else if(condition === 'rain'){
        condition = Conditions.Rain;
      }
      else if(condition === 'thunderstorm'){
        condition = Conditions.Thunderstorm;
      }
      else if(condition === 'snow' || condition === 'sleet'){
        condition = Conditions.Thunderstorm;
      }
      else if(condition === 'fog'){
        condition = Conditions.Mist;
      }
      else {
        condition = Conditions.Unknown;
      }

      var temp = feelsLike ? data.currently.apparentTemperature : data.currently.temperature;

      let weather = {
        //temperatureK : (temp + 273.15).toFixed(1),
        temperatureC : temp,
        temperatureF : (temp*9/5 + 32),
        location : "",
        description : data.currently.summary,
        isDay : data.currently.icon.indexOf("-day") > 0,
        conditionCode :condition,
        sunrise : data.daily.data[0].sunriseTime,
        sunset : data.daily.data[0].sunsetTime,
        timestamp : new Date().getTime()
      };
      // Send the weather data to the device
      if(success) success(weather);
  })
  .catch((err) => { if(error) error(err); });
};

function prv_queryYahooWeather(latitude, longitude, success, error) {
  var url = 'https://query.yahooapis.com/v1/public/yql?q=select astronomy, location.city, item.condition from weather.forecast where woeid in '+
          '(select woeid from geo.places(1) where text=\'(' + latitude+','+longitude+')\') and u=\'c\'&format=json';

  fetch(encodeURI(url))
  .then((response) => {
    response.json()
    .then((data) => {
      
      if(data.query === undefined || data.query.results === undefined || data.query.results.channel === undefined) {
        if(error) error(data);
        return;
      }

      var condition = parseInt(data.query.results.channel.item.condition.code);
      switch(condition){
        case 31 :
        case 32 :
        case 33 :
        case 34 :
          condition = Conditions.ClearSky;  break;
        case 29 :
        case 30 :
        case 44 :
          condition = Conditions.FewClouds;  break;
        case 8 :
        case 9 :
          condition = Conditions.ShowerRain;  break;
        case 6 :
        case 10 :
        case 11 :
        case 12 :
        case 35 :
        case 40 :
          condition = Conditions.Rain; break;
        case 1 :
        case 3 :
        case 4 :
        case 37 :
        case 38 :
        case 39 :
        case 47 :
          condition = Conditions.Thunderstorm; break;
        case 5 :
        case 7 :
        case 13 :
        case 14 :
        case 15 :
        case 41 :
        case 42 :
        case 43 :
          condition = Conditions.Snow; break;
        case 20 :
          condition = Conditions.Mist; break;
        default : condition = Conditions.Unknown; break;
      }

      var current_time = new Date();
      var sunrise_time = prv_timeParse(data.query.results.channel.astronomy.sunrise);
      var sunset_time  = prv_timeParse(data.query.results.channel.astronomy.sunset);
      let weather = {
        //temperatureK : (parseInt(data.query.results.channel.item.condition.temp) + 273.15),
        temperatureC : parseInt(data.query.results.channel.item.condition.temp),
        temperatureF : (parseInt(data.query.results.channel.item.condition.temp) * 9/5 + 32),
        location : data.query.results.channel.location.city,
        description : data.query.results.channel.item.condition.text,
        isDay : current_time >  sunrise_time && current_time < sunset_time,
        conditionCode : condition,
        sunrise : data.query.results.channel.astronomy.sunrise,
        sunset : data.query.results.channel.astronomy.sunset,
        timestamp : new Date().getTime()
      };
      // Send the weather data to the device
      if(success) success(weather);
    });
  })
  .catch((err) => {
    if(error) error(err);
  });
};

function prv_timeParse(str) {
  var buff = str.split(" ");
  if(buff.length === 2) {
    var time = buff[0].split(":");
    if(buff[1].toLowerCase() === "pm" && parseInt(time[0]) !== 12) {
      time[0] = (parseInt(time[0]) + 12) + "";
    }
  }

  var date = new Date();
  date.setHours(parseInt(time[0]));
  date.setMinutes(parseInt(time[1]));

  return date;
}