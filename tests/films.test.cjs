const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const context={window:{},location:{href:'https://tianming332.github.io/film-room/'},URL,encodeURIComponent};
vm.runInNewContext(readFileSync(path.join(root,'data/films.js'),'utf8'),context);
const films=context.window.TJM_FILMS;
const resolve=context.window.resolveFilmPlaybackURL;
test('six unique films, four brand adverts, original entries kept',()=>{
 assert.equal(films.length,6);assert.equal(new Set(films.map(f=>f.id)).size,6);
 assert.equal(films.filter(f=>f.cat==='ad').length,4);
 assert.deepEqual(Array.from(films.slice(0,4),f=>[f.title,f.duration,f.ratio]),[
  ['初めて手をつなぐ','01:22','1080 / 1904'],['战锤 40K：钢铁远征','00:30','16 / 9'],['汗水说，该补水了','00:33','9 / 16'],['沿风而行','00:43','9 / 16']
 ]);
 for(const film of films)assert.ok(existsSync(path.join(root,film.poster)));
});
test('predicted public URLs follow existing repository/videos path',()=>{
 for(const film of films){
  assert.match(film.video,/^https:\/\/tianming332\.github\.io\/Tian-VideoAgent-Assetes\/videos\/tjm-ai-film-/);
  assert.equal(resolve(film,'https://tianming332.github.io/any-film-room/'),film.video);
 }
 assert.ok(films[4].sourceVideo.endsWith(encodeURIComponent('彩妆-苹果发布会风广告.mp4')));
 assert.ok(films[5].sourceVideo.endsWith(encodeURIComponent('自然旅聚概念广告视频.mp4')));
});
test('localhost resolves actual sibling files, unrelated locations preserve public URL',()=>{
 for(const film of films){
  const url=new URL(resolve(film,'http://127.0.0.1:8796/TJM-AI%20short%20video%20playback%20page/index.html'));
  assert.equal(url.origin,'http://127.0.0.1:8796');
  assert.ok(existsSync(path.join(root,'..',decodeURIComponent(url.pathname))));
  assert.equal(resolve(film,'http://localhost:9999/unrelated/'),film.video);
 }
});
test('new browser copies are real 30-second 16:9 H.264/AAC videos',()=>{
 for(const film of films.slice(4)){
  const file=path.join(root,'..','Tian-VideoAgent-Assetes','videos',film.video.split('/').pop());
  const meta=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file]));
  const video=meta.streams.find(s=>s.codec_type==='video');
  assert.equal(video.codec_name,'h264');assert.equal(video.pix_fmt,'yuv420p');
  assert.equal(video.width,1920);assert.equal(video.height,1080);
  assert.ok(Math.abs(Number(meta.format.duration)-30)<.1);
  assert.ok(meta.streams.some(s=>s.codec_type==='audio'&&s.codec_name==='aac'));
  assert.equal(film.duration,'00:30');assert.equal(film.ratio,'16 / 9');
 }
});
