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
test('predicted public URLs follow existing repository/videos path',()=>{
 for(const film of films){
  assert.match(film.video,/^https:\/\/tianming332\.github\.io\/Tian-VideoAgent-Assetes\/videos\/tjm-ai-film-/);
  assert.equal(resolve(film,'https://tianming332.github.io/any-film-room/'),film.video);
 }
 assert.ok(films[4].sourceVideo.endsWith(encodeURIComponent('彩妆-苹果发布会风广告.mp4')));
 assert.ok(films[5].sourceVideo.endsWith(encodeURIComponent('自然旅聚概念广告视频.mp4')));
 assert.ok(films[6].sourceVideo.endsWith(encodeURIComponent('喜欢-恋爱向短视频.mp4')));
 assert.ok(films[7].sourceVideo.endsWith(encodeURIComponent('小王子-恋爱向短视频.mp4')));
 for(const film of films.slice(6))assert.equal(film.uploadStatus,'pending');
});
test('localhost resolves actual sibling files, unrelated locations preserve public URL',()=>{
 for(const film of films){
  const url=new URL(resolve(film,'http://127.0.0.1:8796/TJM-AI%20short%20video%20playback%20page/index.html'));
  assert.equal(url.origin,'http://127.0.0.1:8796');
  assert.ok(existsSync(path.join(root,'..',decodeURIComponent(url.pathname))));
  assert.equal(resolve(film,'http://localhost:9999/unrelated/'),film.video);
 }
});
test('existing advert copies remain 30-second 16:9 H.264/AAC videos',()=>{
 for(const film of films.slice(4,6)){
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
test('new love stories preserve source length, resolution, frame rate and audio',()=>{
 for(const film of films.slice(6)){
  const assetRoot=path.join(root,'..','Tian-VideoAgent-Assetes');
  const file=path.join(assetRoot,'videos',film.video.split('/').pop());
  const source=path.join(assetRoot,decodeURIComponent(film.sourceVideo.split('/').pop()));
  const probe=file=>JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file]));
  const meta=probe(file),original=probe(source);
  const video=meta.streams.find(s=>s.codec_type==='video');
  const sourceVideo=original.streams.find(s=>s.codec_type==='video');
  const audio=meta.streams.find(s=>s.codec_type==='audio');
  const sourceAudio=original.streams.find(s=>s.codec_type==='audio');
  assert.equal(video.codec_name,'h264');assert.equal(video.pix_fmt,'yuv420p');
  assert.equal(video.width,1080);assert.equal(video.height,1920);
  assert.equal(video.avg_frame_rate,sourceVideo.avg_frame_rate);
  assert.equal(video.nb_frames,sourceVideo.nb_frames);
  assert.ok(Math.abs(Number(meta.format.duration)-Number(original.format.duration))<.1);
  assert.equal(audio.codec_name,'aac');assert.equal(audio.channels,sourceAudio.channels);
  assert.equal(audio.sample_rate,sourceAudio.sample_rate);
  assert.equal(film.duration,`00:${String(Math.floor(Number(meta.format.duration))).padStart(2,'0')}`);
  assert.equal(film.ratio,'9 / 16');
  const exportDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'})
   .format(new Date(original.format.tags.creation_time)).replaceAll('-','.');
  assert.equal(film.date,exportDate);
  assert.ok(film.video.endsWith(`${exportDate.replaceAll('.','')}.mp4`));
 }
});
