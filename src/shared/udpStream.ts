import * as zmq from 'zeromq';

export class ZmqStreamer {
  private sockets: Map<string, zmq.Push>;  // Map for storing socket connections
  private connections: Map<string, boolean>; // Track active connections
  private names: Map<string, number>;        // Track client names and their indices

  constructor() {
    this.sockets = new Map();
    this.connections = new Map();
    this.names = new Map();
  }

  // Setup persistent ZMQ connections (Push sockets with UDP)
  public setupZMQ(clientNames: Array<string>) {
    clientNames.forEach((name, idx) => {
      this.names.set(name, idx);
      const socket = new zmq.Push();  // Use Push socket to send messages
      const port = 5555 + idx; // Using port based on the index (adjust as necessary)
      socket.connect(`tcp://localhost:${port}`); // Connecting to the ZMQ server via UDP

      this.sockets.set(name, socket);
      console.log(`Connected to Push socket for ${name} on port ${port}`);
    });
  }

  // Send frame to a specific active client
  public sendFrame(name: string, frame: Buffer) {
    if (this.names.has(name)) {
      const idx = this.names.get(name);
      const connectionName = `camera_${idx}`;
      const socket = this.sockets.get(connectionName);

      if (socket && this.connections.has(name)) {
        try {
          socket.send(frame); // Send the frame to the client via UDP
          console.log(`Sent frame Name: ${name} Idx: ${idx} via connection ${connectionName}`);
        } catch (err) {
          console.error(`Failed to send frame Name: ${name} Idx: ${idx} via ${connectionName}:`, err);
        }
      } else {
        console.warn(`Connection ${connectionName} is not active. Skipping frame Name: ${name} Idx: ${idx}.`);
      }
    } else {
      console.warn(`Name ${name} is not present in the connections!`);
    }
  }

  // Disconnect all ZMQ connections (close Push sockets)
  public disconnectFromZMQ() {
    this.sockets.forEach((socket, connectionName) => {
      console.log(`Disconnecting from ${connectionName}`);
      socket.close(); // Close the socket
    });
    this.connections.clear();
    this.names.clear();
  }
}
