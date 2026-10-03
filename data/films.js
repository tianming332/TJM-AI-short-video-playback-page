/* Local file dates are export dates, not a claim that the GitHub upload is live. */
(function () {
  const repositoryBase = 'https://tianming332.github.io/Tian-VideoAgent-Assetes/';
  const videoBase = `${repositoryBase}videos/`;
  const films = [
    {id:0,cat:'story',title:'初めて手をつなぐ',date:'2026.06.18',duration:'01:22',ratio:'1080 / 1904',poster:'assets/posters/first-hand.jpg',video:`${videoBase}tjm-ai-film-01-first-hand-20260618.mp4`,meta:'AI 视频 · 恋爱短剧'},
    {id:1,cat:'game',title:'战锤 40K：钢铁远征',date:'2026.07.27',duration:'00:30',ratio:'16 / 9',poster:'assets/posters/warhammer-v2.jpg',video:`${videoBase}tjm-ai-film-03-warhammer-expedition-20260727.mp4`,meta:'AI 视频 · 游戏混剪 · 横屏'},
    {id:2,cat:'ad',title:'汗水说，该补水了',date:'2026.08.16',duration:'00:33',ratio:'9 / 16',poster:'assets/posters/pocari.jpg',video:`${videoBase}tjm-ai-film-04-pocari-hydration-20260816.mp4`,meta:'AI 视频 · 品牌广告'},
    {id:3,cat:'ad',title:'沿风而行',date:'2026.09.03',duration:'00:43',ratio:'9 / 16',poster:'assets/posters/yanshi.jpg',video:`${videoBase}tjm-ai-film-05-yanshi-ride-with-wind-20260903.mp4`,meta:'AI 视频 · 生活方式'},
    {id:4,cat:'ad',title:'彩妆 · 苹果发布会风广告',date:'2026.09.29',duration:'00:30',ratio:'16 / 9',poster:'assets/posters/beauty-keynote.jpg',video:`${videoBase}tjm-ai-film-07-beauty-keynote-ad-20260929.mp4`,sourceVideo:repositoryBase+encodeURIComponent('彩妆-苹果发布会风广告.mp4'),meta:'AI 视频 · 彩妆广告 · 横屏'},
    {id:5,cat:'ad',title:'自然旅聚 · 概念广告',date:'2026.09.29',duration:'00:30',ratio:'16 / 9',poster:'assets/posters/nature-journey.jpg',video:`${videoBase}tjm-ai-film-08-nature-journey-ad-20260929.mp4`,sourceVideo:repositoryBase+encodeURIComponent('自然旅聚概念广告视频.mp4'),meta:'AI 视频 · 自然概念 · 横屏'},
    {id:6,cat:'story',title:'喜欢 · 恋爱向短视频',date:'2026.09.30',duration:'00:35',ratio:'9 / 16',poster:'assets/posters/like-love-story.jpg',video:`${videoBase}tjm-ai-film-09-like-love-story-20260930.mp4`,sourceVideo:repositoryBase+encodeURIComponent('喜欢-恋爱向短视频.mp4'),uploadStatus:'pending',meta:'AI 视频 · 恋爱短剧 · 竖屏'},
    {id:7,cat:'story',title:'小王子 · 恋爱向短视频',date:'2026.10.03',duration:'00:18',ratio:'9 / 16',poster:'assets/posters/little-prince-love-story.jpg',video:`${videoBase}tjm-ai-film-10-little-prince-love-story-20261003.mp4`,sourceVideo:repositoryBase+encodeURIComponent('小王子-恋爱向短视频.mp4'),uploadStatus:'pending',meta:'AI 视频 · 恋爱短剧 · 竖屏'}
  ];
  window.TJM_FILMS = Object.freeze(films.map(film => Object.freeze(film)));
  window.resolveFilmPlaybackURL = function (film, href = location.href) {
    const page = new URL(href);
    // Only the known sibling-folder local preview uses local files.
    // Public deployment always retains the predicted GitHub Pages URL.
    if (['localhost', '127.0.0.1', '[::1]'].includes(page.hostname)) {
      const marker = '/TJM-AI short video playback page/';
      const pathname = decodeURIComponent(page.pathname);
      const position = pathname.indexOf(marker);
      if (position !== -1 && film.video.startsWith(repositoryBase)) {
        return new URL(pathname.slice(0, position) + '/Tian-VideoAgent-Assetes/' + film.video.slice(repositoryBase.length), page.origin).href;
      }
    }
    return film.video;
  };
}());
