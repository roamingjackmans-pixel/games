// Taps the hex button over and over.
import { clickEvery } from '../tools.mjs';

export default { steps: ['t:Got it', 'w:800'], during: clickEvery('#hex-btn', 140) };
