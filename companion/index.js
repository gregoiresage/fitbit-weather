// Import the weather module
import Weather from '../common/weather';

// Create the weather object
let weather = new Weather();
// Set the provider : yahoo / owm / wunderground / darksky
weather.setProvider("yahoo"); 
// set your api key
weather.setApiKey("mykey");
// set the maximum age of the data
weather.setMaximumAge(25 * 1000); 

// Display the weather data received from the companion
weather.onsuccess = (data) => {
  console.log("Weather on phone " + JSON.stringify(data));
}

weather.onerror = (error) => {
  console.log("Weather error " + JSON.stringify(error));
}

weather.fetch();