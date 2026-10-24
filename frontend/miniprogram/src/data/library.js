const first=require('./catalog');
Object.assign(first,{pageCount:9,panelCount:54,bubbleCount:115,storageKey:'bluey-comic-wechat-s01e01-v1'});
const magic=require('./magic');
const books=[first,magic];
module.exports={books,getBook:episode=>String(episode).toUpperCase()==='S03E10'?magic:first};
