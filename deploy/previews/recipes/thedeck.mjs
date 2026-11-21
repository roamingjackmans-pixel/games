// Solo: draws a card every 1.3 seconds. The table sits in the middle of the page, so the clip is cropped to it.
import { clickEvery } from '../tools.mjs';

export default {
  steps: ['f:#name-input=Joe', 's:#solo-btn', 'w:800', 's:#draw-button', 'w:900'],
  during: clickEvery('#draw-button', 1300),
  crop: [320, 0, 640, 360],
};
