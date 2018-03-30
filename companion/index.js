// Import the weather module
import Weather from '../common/weather/phone';

// Create the weather object
// this is always needed to answer the device's requests
let weather = new Weather();

/*
// You can also fetch the weather from the companion directly 
// The api is the same as the device's one


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
  console.log("Weather error " + error);
}

weather.fetch();

*/
