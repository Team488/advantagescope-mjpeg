import { contextBridge, ipcRenderer } from "electron";
import { ListItemCloseToken } from "remarkable/lib";

contextBridge.exposeInMainWorld("electronAPI", {
  sendFrameToMain: (name: string, imageBuffer: string) => ipcRenderer.send("send-frame", name, imageBuffer),
  updateNetworkStreamNames: (names: Array<string>) => ipcRenderer.send("update-network-names", names),
  clearNetworkStreams: () => ipcRenderer.send("clear-network-streams"),
  log: (details: string) => ipcRenderer.send("log", details)
});

const windowLoaded = new Promise((resolve) => {
  window.onload = resolve;
});

ipcRenderer.on("port", async (event) => {
  await windowLoaded;
  window.postMessage("port", "*", event.ports);
});
