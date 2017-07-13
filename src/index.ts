import { Note, Pitcher } from 'pitch-detector';

export class JsTuner{
  private readonly audioContext;
  private readonly canvas;
  private readonly canvasContext;
  private readonly hzElement;
  private readonly noteElement;

  constructor(element){
    console.log(element);
    this.canvas = document.createElement("canvas");
    this.hzElement = document.createElement("div");
    this.noteElement = document.createElement("div");
    element.appendChild(this.canvas);
    element.appendChild(this.hzElement);
    element.appendChild(this.noteElement);
    this.canvasContext = this.canvas.getContext("2d");
    this.audioContext = new AudioContext();
  }

  setPixel(imageData, x: number, y: number, color) {
    const width = imageData.width;
    const data = imageData.data;
    const index = ((width * y) + x) * 4;
    if (!isNaN(color.r)) {
      data[index] = color.r;
    }
    if (!isNaN(color.g)) {
      data[index + 1] = color.g;
    }
    if (!isNaN(color.b)) {
      data[index + 2] = color.b;
    }
    if (!isNaN(color.a)) {
      return data[index + 3] = color.a;
    }
  }

  drawWave(buffer, note: Note) {
    let x, y;
    this.canvasContext.save();
    this.canvasContext.fillStyle = "rgb(30, 30, 30)";
    this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvasContext.restore();
    const imageData = this.canvasContext.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const color = {
      r: 200,
      g: 200,
      b: 200,
      a: 255
    };
    const red = {
      r: 200,
      g: 0,
      b: 0,
      a: 255
    };

    const width = imageData.width;
    const height = imageData.height;
    for (let x = 0; x < width; x++){
      y = Math.floor(height/2+buffer[x*2]*height)
      this.setPixel(imageData, x, y, color);
    }

    x = Math.round(width/2 + width * note.diff())
    for (let y = 0; y < height; y++){
      this.setPixel(imageData, x, y, color);
      this.setPixel(imageData, width/2, y, red);
    }
    this.canvasContext.putImageData(imageData, 0, 0);
  };

  connectRecorder(stream) {
    const bufferSize = 2048;
    const recorder = this.audioContext.createScriptProcessor(bufferSize, 2, 2);
    let counter = 0;
    recorder.onaudioprocess = (e)=> {
      const span = document.hasFocus() ? 2 : 16;
      if (counter++ % span != 0) {
        return;
      }
      const left = e.inputBuffer.getChannelData(0);
      const hz = Pitcher.pitch(left, this.audioContext.sampleRate);
      const note = new Note(hz);
      this.drawWave(left, note);
      if (!(hz >= 30)) {
        return;
      }
      this.hzElement.innerHTML = 'hz = ' + hz;
      this.noteElement.innerHTML = 'note = ' + note.name();
    };
    const input = this.audioContext.createMediaStreamSource(stream);
    input.connect(recorder);
    return recorder.connect(this.audioContext.destination);
  };

  main(){
    const nav: any = navigator;
    const win: any = window;

    if (!nav.getUserMedia) {
      nav.getUserMedia = nav.getUserMedia || nav.webkitGetUserMedia || nav.mozGetUserMedia || nav.msGetUserMedia;
    }
    if (!win.AudioContext) {
      win.AudioContext = win.webkitAudioContext;
    }
    if (!nav.getUserMedia || !win.AudioContext) {
      alert("not supported in this browser.");
      return;
    }

    nav.getUserMedia(
      { audio: true },
      this.connectRecorder.bind(this), () => alert("error capturing audio.")
    );
  }
}

