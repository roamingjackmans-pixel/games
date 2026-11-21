// Clicks the geode over and over.
import { clickEvery } from '../tools.mjs';

export default { steps: ['t:YEEHAW', 'w:1200'], during: clickEvery('#geode', 110) };
