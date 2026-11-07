import { startHQ } from './core.js';
import ngocTrai from './themes/ngoc-trai.js';
// Theme registry: a later switcher can add `thapRua` here and pick by ?theme= or PF_HQ.theme.
const THEMES = { 'ngoc-trai': ngocTrai };
const pick = new URLSearchParams(location.search).get('theme') || (window.PF_HQ || {}).theme || 'ngoc-trai';
startHQ(THEMES[pick] || ngocTrai);
