import * as filetransfer from "file-transfer";

export function isRunningOnDevice() {
  return filetransfer.inbox !== undefined;
}

export function isRunningOnPhone() {
  return !isRunningOnDevice();
}