import document from "document"
import * as messaging from "messaging"

// Import the weather module
import Weather from '../common/weather/device'

let provider = 0
// Enter your own api keys below
const PROVIDERS = [
  { name : 'yahoo', key : '' },
  { name : 'owm', key : '' },
  { name : 'wunderground', key : '' },
  { name : 'darksky', key : '' },
  { name : 'weatherbit', key : '' }
]

// Create the weather object
let weather = new Weather()

let showWeather = function(data){
  if (data) {
    document.getElementById("temperature").text = data.temperatureC.toFixed(1) + "°C"
    document.getElementById("description").text = data.description
    document.getElementById("location").text = data.location
    document.getElementById("provider").text = data.provider.toUpperCase()
  }
}

// Display the weather data received from the companion
weather.onsuccess = showWeather

weather.onerror = (error) => {
  console.log("Weather error " + JSON.stringify(error))
  
  document.getElementById("location").text = JSON.stringify(error)
}

let fetchWeather = function(){
  // Set the provider : yahoo / owm / wunderground / darksky / weatherbit
  weather.setProvider(PROVIDERS[provider].name)
  // set your api key
  weather.setApiKey(PROVIDERS[provider].key)
  
  document.getElementById("temperature").text = ""
  document.getElementById("description").text = ""
  document.getElementById("location").text = "Fetching..."
  document.getElementById("provider").text = PROVIDERS[provider].name.toUpperCase()
  
  weather.fetch()
}

showWeather( weather.getData() )

// Listen for the onopen event
messaging.peerSocket.onopen = function() {
  fetchWeather()
}

document.getElementById("change_provider").onclick = function(e) {
  provider = (++provider) % PROVIDERS.length
  fetchWeather()
}

function refresh_weather () {
 featchWeather()
  console.log("Fetching New Weather")
}
setInterval(refresh_weather, 29 * 60 * 1000)
