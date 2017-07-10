import Peer from "skyway-peerjs";
import { EventEmitter } from 'events';

export type PeerId = string;

class Transmitter{
  private readonly conn;

  constructor(conn){
    this.conn = conn;
  }

  send(data){
    this.conn.send(data);
  }
}

class Reciever{
  private readonly conn;
  private readonly emitter: EventEmitter;

  constructor(conn, emitter){
    this.conn = conn;
    this.emitter = emitter;
    this.conn.on('data', (data)=> {
      this.emitter.emit('recieve', {source: this, data: data});
    });
    this.conn.on('error', (e)=>{
      console.log(e);
    });
  }
}

export class Communicator{
  peerId: PeerId;
  private readonly peer: Peer;
  private readonly recievers: Map<PeerId, Reciever>;
  private readonly transmitters: Map<PeerId, Transmitter>;
  private readonly emitter: EventEmitter;

  constructor(apikey){
    this.peer = new Peer({key: apikey});
    this.recievers = new Map<PeerId, Reciever>();
    this.transmitters = new Map<PeerId, Transmitter>();
    this.emitter = new EventEmitter;

    this.peer.on('connection', (conn)=>{
      console.log("con");
      this.accept(conn);
      this.emitter.emit("accept", {source: this, data: conn});
    });
    this.peer.on('error', (e)=>{
      console.log(e);
    });
  }

  async allPeers(): Promise<Array<PeerId>>{
    const list = await new Promise(r => this.peer.listAllPeers(r));
    const a = list as Array<PeerId>;
    return a.filter(e=>e!=this.peerId);
  }

  async prepare(): Promise<void>{
    const id = await new Promise(r => this.peer.on('open', r));
    this.peerId = id as PeerId;
  }

  connect(destId: PeerId): void{
    if (!this.transmitters.get(destId)){
      const conn = this.peer.connect(destId);
      this.transmitters.set(destId, new Transmitter(conn));
    }
  }

  accept(conn): void{
    const destId = conn.peer;
    if (!this.recievers.get(destId)){
      this.connect(destId);
      const reciever = new Reciever(conn, this.emitter);
      this.recievers.set(destId, reciever);
    }
  }

  send(message: any): void{
    for (const t of this.transmitters.values()) {
      t.send(message);
    }
  }

  on(type, handler){
    this.emitter.on(type, handler);
  }
}

