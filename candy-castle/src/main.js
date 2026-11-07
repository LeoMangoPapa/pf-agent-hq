import { startHQ } from './core.js';
import keoNgot from './themes/keo-ngot.js';
// Theme registry: other themes (Tháp Rùa, Ngọc trai) can be added here and picked by ?theme= or PF_HQ.theme.
const THEMES = { 'keo-ngot': keoNgot };
const pick = new URLSearchParams(location.search).get('theme') || (window.PF_HQ || {}).theme || 'keo-ngot';
startHQ(THEMES[pick] || keoNgot);
