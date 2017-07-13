import { JsTuner } from './jstuner';

window.onload = () => {
  (new JsTuner(document.getElementById("tuner"))).main();
};

