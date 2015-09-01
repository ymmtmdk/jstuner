audioContext = null
canvas = null
canvasContext = null

setPixel = (imageData, x, y, color) ->
  width = imageData.width
  data = imageData.data
  index = ((width * y) + x) * 4
  data[index] = color.r unless isNaN(color.r)
  data[index + 1] = color.g unless isNaN(color.g)
  data[index + 2] = color.b unless isNaN(color.b)
  data[index + 3] = color.a unless isNaN(color.a)

drawWave = (buffer, note) ->
  canvasContext.save()
  canvasContext.fillStyle = "rgb(30, 30, 30)"
  canvasContext.fillRect 0, 0, canvas.width, canvas.height
  canvasContext.restore()
  imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height)
  color =
    r: 200
    g: 200
    b: 200
    a: 255

  red =
    r: 200
    g: 0
    b: 0
    a: 255

  width = imageData.width
  height = imageData.height

  for x in [0...width]
    y = Math.floor(height/2+buffer[x*2]*height)
    setPixel imageData, x, y, color

  x = Math.round(width/2 + width * note.diff())
  for y in [0...height]
    setPixel imageData, x, y, color
    setPixel imageData, width/2, y, red

  canvasContext.putImageData imageData, 0, 0

connectRecorder = (stream) ->
  audioContext = new AudioContext()

  hzElement = document.getElementById("hz")
  noteElement = document.getElementById("note")

  bufferSize = 2048
  recorder = audioContext.createScriptProcessor(bufferSize, 2, 2)
  recorder.onaudioprocess = (e) ->
    left = e.inputBuffer.getChannelData(0)
    hz = Pitcher.pitch(left, audioContext.sampleRate)
    note = new Note(hz)
    drawWave(left, note)
    return unless hz >= 30
    hzElement.innerHTML = 'hz = ' + hz
    noteElement.innerHTML = 'note = ' + note.name()

  # connect the recorder
  input = audioContext.createMediaStreamSource(stream)
  input.connect recorder
  recorder.connect audioContext.destination

Meteor.startup ->
  navigator.getUserMedia = navigator.getUserMedia or navigator.webkitGetUserMedia or navigator.mozGetUserMedia or navigator.msGetUserMedia unless navigator.getUserMedia
  window.AudioContext = window.webkitAudioContext unless window.AudioContext

  if navigator.getUserMedia and window.AudioContext
    navigator.getUserMedia
      audio: true
    ,connectRecorder, -> alert "error capturing audio."
  else
    alert "not supported in this browser."
    return

  canvas = document.getElementById("wave")
  canvasContext = canvas.getContext("2d")
