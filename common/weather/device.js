import { peerSocket } from "messaging";
import { WEATHER_MESSAGE_KEY } from './common.js';

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
};
