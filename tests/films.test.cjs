const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const context={window:{},URL,encodeURIComponent};
vm.runInNewContext(readFileSync(path.join(root,'data/films.js'),'utf8'),context);
const films=context.window.TJM_FILMS;
test('eight unique films, three love stories, four brand adverts, original entries kept',()=>{
 assert.equal(films.length,8);assert.equal(new Set(films.map(f=>f.id)).size,8);
 assert.equal(films.filter(f=>f.cat==='story').length,3);
 assert.equal(films.filter(f=>f.cat==='game').length,1);
 assert.equal(films.filter(f=>f.cat==='ad').length,4);
 assert.deepEqual(Array.from(films.slice(0,6),f=>[f.title,f.duration,f.ratio]),[
  ['初めて手をつなぐ','01:22','1080 / 1904'],['战锤 40K：钢铁远征','00:30','16 / 9'],['汗水说，该补水了','00:33','9 / 16'],['沿风而行','00:43','9 / 16'],
  ['彩妆 · 苹果发布会风广告','00:30','16 / 9'],['自然旅聚 · 概念广告','00:30','16 / 9']
 ]);
 for(const film of films)assert.ok(existsSync(path.join(root,film.poster)));
});
test('every film plays from the public asset repository, nothing is marked pending',()=>{
 for(const film of films){
  assert.match(film.video,/^https:\/\/tianming332\.github\.io\/Tian-VideoAgent-Assetes\/videos\/tjm-ai-film-\d\d-[a-z0-9-]+-\d{8}\.mp4$/);
  assert.equal(film.uploadStatus,undefined);
 }
});
test('player uses the public URL directly',()=>{
 const script=readFileSync(path.join(root,'script.js'),'utf8');
 assert.ok(script.includes('video.src = work.video;'));
 assert.ok(!/localhost|127\.0\.0\.1|待上传|Pending upload/.test(script+readFileSync(path.join(root,'data/films.js'),'utf8')));
});
