# Weather module for Fitbit OS

This library permits to retrieve weather information from the device.  
You can choose your favourite weather provider between [Yahoo](https://query.yahooapis.com), [OpenWeatherMap](http://api.openweathermap.org), [DarkSky](https://api.darksky.net) and [WeatherUnderground](http://api.wunderground.com)

## Usage

Copy the files [weather.js](./common/weather.js) and [utils.js](./common/weather.js) in your *commons* folder

### Companion

Create an *index.js* file in the *companion* folder if you don't already have one.  
Add the following code in this file :

```javascript
import Weather from '../common/weather';
let weather = new Weather();
```
### App

Add the following code in your *app/index.js* file

```javascript
import Weather from '../common/weather';

let weather = new Weather();
weather.setProvider("yahoo"); 
weather.setApiKey("mykey");
weather.setMaximumAge(25 * 1000); 
weather.setFeelsLike(true);

weather.onsuccess = (data) => {
  console.log("Weather is " + JSON.stringify(data));
}

weather.onerror = (error) => {
  console.log("Weather error " + JSON.stringify(error));
}

weather.fetch();
```

## API

* **setProvider(string)** : set the weather provider (possible values are `yahoo`, `owm`, `wunderground` or `darksky`). Default is `yahoo`
* **setApiKey(string)** : set the api key for your provider. Default is ``
* **setFeelsLike(boolean)** : some providers can return the apparent temperature. Default is `true`
* **setMaximumAge(int)** : set the maximum age in milliseconds of a possible cached weather data that is acceptable to return. Default is `0`
* **onsuccess(data)** : it is the event handler when the weather data arrives
* **onserror(error)** : it is the event handler when the library fails
* **fetch()** : retrieve the weather

## Example of result
```json
{
  "temperatureC":17,
  "temperatureF":62.6,
  "location":"Castelnau-D'Estretefonds",
  "description":"Mostly Clear",
  "isDay":false,
  "conditionCode":0,
  "sunrise":"7:57 am",
  "sunset":"7:27 pm",
  "timestamp":1507236297786
}
```

## Condition codes
```javascript
let Conditions = {
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
```
