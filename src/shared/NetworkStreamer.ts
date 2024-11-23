import express, { Request, Response } from "express";
import { string } from "mathjs";
import { ListItemCloseToken } from "remarkable/lib";

export class NetworkStreamer {
  private boundaries: Map<string, string> = new Map(); // Boundaries for MJPEG stream
  private activeConnections: Map<string, Response[]> = new Map(); // Array to track active connections

  constructor(private app: express.Application) { }

  // Setup MJPEG stream route
  public setupStreamRoutes(names: Array<string>) {
    console.log("Setting up internal stream routes")
    this.clearNetworkStreams();
    try {
      for (let name of names) {
        const randomBoundary = name + Math.random().toString(36).substr(2, 16);
        this.boundaries.set(name, randomBoundary);
        this.activeConnections.set(name, [])
        let endpointName = this.getSafeName(name);
        console.log("Creating endpoint /" + endpointName)
        this.app.get("/" + endpointName, (req: Request, res: Response) => {
          console.log("Connecting client to endpoint: /" + endpointName);
          // Set headers to start streaming
          res.setHeader("Content-Type", `multipart/x-mixed-replace; boundary=${randomBoundary}`);

          // Add the current connection to active connections
          (this.activeConnections.get(name) as Array<Response>).push(res);

          // When the connection is closed, remove it from active connections
          req.on("close", () => {
            let arr = this.activeConnections.get(name)
            let index = arr?.indexOf(res)
            if (index != undefined) {
              arr?.splice(index, 1);
            }
          });
        });
      }
    }
    catch (error) {
      console.log("Error setting up stream routes!")
    }


  }

  private getSafeName(name: string) {
    return encodeURIComponent(name.replace(" ", "_"));
  }

  // Send a frame clients with name
  public sendFrame(name: string, frame: Buffer) {
    // console.log("Sending frame for: " + name + "\n" + frame)
    // console.log(this.activeConnections)
    // console.log(this.boundaries)
    if (this.activeConnections.has(name) && this.boundaries.has(name)) {
      try {
        for (let res of (this.activeConnections.get(name) as Array<Response>)) {
          let boundary = this.boundaries.get(name);
          // Write the boundary and necessary headers for each frame
          res?.write(`--${boundary}\r\n`);
          res?.write("Content-Type: image/jpeg\r\n");
          res?.write("Content-Length: " + frame.length + "\r\n");
          res?.write("\r\n");

          // Send the frame as a JPEG image
          res?.write(frame);
          res?.write("\r\n"); // End of current frame
        };
      } catch (error) {
        console.log("Error sending frame!\n" + error);
      }
    } else {
      console.log("Error! Trying to send a frame with a name that matches no active connections!");
    }
  }

  public clearNetworkStreams() {
    try {
      // maybe handle active connections better?
      this.activeConnections.clear();
      this.boundaries.clear();
    } catch (error) {
      console.log("Error clearing streams!")
    }

  }
}
