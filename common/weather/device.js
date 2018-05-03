import { peerSocket } from "messaging";
import { WEATHER_MESSAGE_KEY, WEATHER_DATA_FILE, WEATHER_ERROR_FILE } from './common.js';
import { inbox } from "file-transfer";
import { readFileSync } from "fs";

const MY_FILE_NAMES = [WEATHER_DATA_FILE,WEATHER_ERROR_FILE]

let otherFiles = []
let myFiles    = []

const prevNextFile = inbox.nextFile;

inbox.nextFile = function() {
  if(otherFiles.length > 0) {
    return otherFiles.pop()
  }
  
  var fileName
  while (fileName = prevNextFile()) {
    if (MY_FILE_NAMES.indexOf(fileName) > -1) {
      myFiles.push(fileName)
    }
    else {
      return fileName
    }
  }
  return undefined
}

const getCustomFile = function() {
  if(myFiles.length > 0) {
    return myFiles.pop()
  }
  
  var fileName
  while (fileName = prevNextFile()) {
    if (MY_FILE_NAMES.indexOf(fileName) > -1) {
      return fileName
    }
    otherFiles.push(fileName)
  }
  return undefined
}


export default class Weather {
  
  constructor() {
    this._apiKey = '';
    this._provider = 'yahoo';
    this._feelsLike = true;
    this._maximumAge = 0;
    
    try {
      this._weather = readFileSync(WEATHER_DATA_FILE, "cbor");
    } catch (n) {
      this._weather = undefined;
    }

    this.onerror = undefined;
    this.onsuccess = undefined;
    
    // Event occurs when new file(s) are received
    inbox.addEventListener("newfile", (event) => {
      var fileName = getCustomFile();
      if (fileName === WEATHER_DATA_FILE) {
        this._weather = readFileSync(fileName, "cbor");
        if(this.onsuccess) this.onsuccess(this._weather);
      }
      else if (fileName === WEATHER_ERROR_FILE) {
        if(this.onerror) this.onerror(readFileSync(fileName, "cbor").error);
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
  
  getData() {
    return this._weather;
  }
  
  fetch() {
    let now = new Date().getTime();
    if(this._weather !== undefined && this._weather.timestamp !== undefined && (now - this._weather.timestamp < this._maximumAge)) {
      // return previous weather if the maximum age is not reached
      if(this.onsuccess) this.onsuccess(this._weather);
      return this._weather;
    }
    
    if (peerSocket.readyState === peerSocket.OPEN) {
      // Send a command to the companion
      let message = {};
      let params = { apiKey : this._apiKey, provider : this._provider, feelsLike : this._feelsLike };
      message[WEATHER_MESSAGE_KEY] = params;
      peerSocket.send(message);
    }
    else {
      if(this.onerror) this.onerror("No connection with the companion");
    }
    return this._weather;
  }
};
