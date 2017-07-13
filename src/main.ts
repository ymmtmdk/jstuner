import { JsTunerUI, Recorder } from 'jstuner-ui';
// import { JsTunerUI, Recorder } from './index';

window.onload = () => {
  const ui = new JsTunerUI(document.getElementById("tuner"));
  const recorder = new Recorder();
  recorder.onData = (wave, hz, note)=>{
    ui.draw(wave, hz, note);
  }
  recorder.main();
};
