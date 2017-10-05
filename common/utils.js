// This module is just a hack to know if the javascript is running on the device or on the phone
// I hope an API to do that will added in Fitbit OS because this solution is not satisfying

import * as filetransfer from "file-transfer";

export function isRunningOnDevice() {
  return filetransfer.inbox !== undefined;
}

export function isRunningOnPhone() {
  return !isRunningOnDevice();
}
