import first from '../data/s01e01.json';
import magic from '../data/s03e10.json';

// The existing player is also used by the standalone Python-generated reader.
window.COMIC_LIBRARY = [first, magic];
window.COMIC_BOOK = new URLSearchParams(location.search).get('episode')?.toLowerCase() === 's03e10' ? magic : first;
await import('./app.js');
