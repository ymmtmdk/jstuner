import Note from './note';
import Pitcher from './pitcher';

let audioContext, canvas, canvasContext;
audioContext = null;
canvas = null;
canvasContext = null;

function setPixel(imageData, x: number, y: number, color) {
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
};

function drawWave(buffer, note: Note) {
  let x, y;
  canvasContext.save();
  canvasContext.fillStyle = "rgb(30, 30, 30)";
  canvasContext.fillRect(0, 0, canvas.width, canvas.height);
  canvasContext.restore();
  const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
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
    setPixel(imageData, x, y, color);
  }

  x = Math.round(width/2 + width * note.diff())
  for (let y = 0; y < height; y++){
    setPixel(imageData, x, y, color);
    setPixel(imageData, width/2, y, red);
  }
  canvasContext.putImageData(imageData, 0, 0);
};

function connectRecorder(stream) {
  audioContext = new AudioContext();
  const hzElement = document.getElementById("hz");
  const noteElement = document.getElementById("note");
  const bufferSize = 2048;
  const recorder = audioContext.createScriptProcessor(bufferSize, 2, 2);
  let counter = 0;
  recorder.onaudioprocess = function(e) {
    const span = document.hasFocus() ? 2 : 16;
    if (counter++ % span != 0) {
      return;
    }
    const left = e.inputBuffer.getChannelData(0);
    const hz = Pitcher.pitch(left, audioContext.sampleRate);
    const note = new Note(hz);
    drawWave(left, note);
    if (!(hz >= 30)) {
      return;
    }
    hzElement.innerHTML = 'hz = ' + hz;
    noteElement.innerHTML = 'note = ' + note.name();
  };
  const input = audioContext.createMediaStreamSource(stream);
  input.connect(recorder);
  return recorder.connect(audioContext.destination);
};

window.onload = () => {
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
    connectRecorder, ()=> {alert("error capturing audio.");}
  );
  canvas = document.getElementById("wave");
  canvasContext = canvas.getContext("2d");
};

