export const css = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%}
body{background:#000;color:#fff;font-family:'Inter','Helvetica Neue',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;line-height:1.45;-webkit-font-smoothing:antialiased;overflow-x:hidden}
button,input{font:inherit;color:inherit;background:none;border:none;outline:none}
button{cursor:pointer}
a{color:inherit;text-decoration:none}
::selection{background:#fff;color:#000}
:root{--black:#000;--off-1:#08080a;--off-2:#0e0e10;--white:#fff;--dim:#c8c8cc;--g1:#888890;--g2:#4a4a52;--g3:#28282e;--bd:rgba(255,255,255,.09);--bd-hi:rgba(255,255,255,.28);--expo:cubic-bezier(.16,1,.3,1);--mono:ui-monospace,'SF Mono',Menlo,monospace;--serif:'Times New Roman',Georgia,serif}

.grain{position:fixed;inset:-50%;width:200%;height:200%;pointer-events:none;z-index:9998;opacity:.06;mix-blend-mode:overlay;image-rendering:pixelated;animation:grain 1.2s steps(8) infinite}
@keyframes grain{0%{transform:translate(0,0)}10%{transform:translate(-3%,-4%)}30%{transform:translate(4%,-8%)}50%{transform:translate(-8%,4%)}70%{transform:translate(0,8%)}90%{transform:translate(-5%,5%)}100%{transform:translate(0,0)}}

.app{min-height:100vh;position:relative}

/* NAV — transparent at top with difference-blend, frosted-glass on scroll */
.nav{
  position:fixed;top:0;left:0;right:0;height:56px;z-index:100;
  transition:
    background .55s var(--expo),
    backdrop-filter .55s var(--expo),
    -webkit-backdrop-filter .55s var(--expo),
    border-color .55s var(--expo);
  background:transparent;
  border-bottom:1px solid transparent;
}
.nav-blur{
  position:absolute;inset:0;
  pointer-events:none;
  backdrop-filter:blur(0px) saturate(1);
  -webkit-backdrop-filter:blur(0px) saturate(1);
  background:rgba(8,8,10,0);
  opacity:0;
  transition:opacity .55s var(--expo), background .55s var(--expo), backdrop-filter .55s var(--expo), -webkit-backdrop-filter .55s var(--expo);
  z-index:0;
}
.nav.scrolled .nav-blur{
  opacity:1;
  background:rgba(8,8,10,.55);
  backdrop-filter:blur(24px) saturate(1.4);
  -webkit-backdrop-filter:blur(24px) saturate(1.4);
}
.nav.scrolled{
  border-bottom-color:rgba(255,255,255,.08);
}
.nav-content{
  position:relative;
  z-index:1;
  height:100%;
  display:flex;align-items:center;justify-content:space-between;
  padding:0 28px;
  mix-blend-mode:difference;
}
.nav.scrolled .nav-content{
  mix-blend-mode:normal;
}
.nav-mark{display:flex;align-items:center;gap:10px;font-family:var(--mono);font-size:11.5px;letter-spacing:.18em;text-transform:uppercase;color:#fff;font-weight:600}
.nav-glyph{width:14px;height:14px;border:1px solid #fff;display:inline-flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;letter-spacing:0}
.nav-meta{display:flex;gap:24px;font-family:var(--mono);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#fff;opacity:.75}
@media (max-width:640px){.nav-meta>span:nth-child(n+3){display:none}}

.reveal-line{display:block;overflow:hidden}
.reveal-line>.reveal-inner{display:inline-block;transform:translateY(120%);transition:transform 1.35s var(--expo);transition-delay:var(--rd,0s)}
.app.ready .reveal-line>.reveal-inner{transform:translateY(0)}
.fade-item{opacity:0;transform:translateY(14px);transition:opacity .9s var(--expo),transform .9s var(--expo);transition-delay:var(--rd,0s)}
.app.ready .fade-item{opacity:1;transform:translateY(0)}

.hero{min-height:100vh;padding:140px 28px 40px;display:flex;flex-direction:column;position:relative}
.hero-top{display:flex;justify-content:space-between;font-family:var(--mono);font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--g1);padding-bottom:16px;border-bottom:1px solid var(--bd)}
.hero-top .dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#fff;margin-right:8px;vertical-align:middle;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.hero-top .col{display:flex;flex-direction:column;gap:6px}
.hero-top .col.right{text-align:right;align-items:flex-end}
.hero-display{flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0}
.display{font-weight:900;font-size:clamp(4.2rem,17vw,17rem);line-height:.82;letter-spacing:-.045em;text-transform:uppercase}
.display .indent{display:block;padding-left:clamp(2rem,12vw,14rem)}
.hero-foot{display:grid;grid-template-columns:1fr 1fr;gap:40px;padding-top:24px;border-top:1px solid var(--bd)}
.hero-lede{font-size:clamp(1rem,1.35vw,1.15rem);line-height:1.5;color:var(--dim);max-width:44ch}
.hero-lede em{font-family:var(--serif);font-style:italic;color:#fff}
.hero-meta{display:flex;flex-direction:column;gap:8px;font-family:var(--mono);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--g1);align-self:end;justify-self:end;text-align:right}
.hero-meta .row{display:flex;gap:16px;justify-content:flex-end}
.hero-meta .row span:first-child{color:var(--g2)}
@media (max-width:760px){.hero-foot{grid-template-columns:1fr;gap:24px}.hero-meta{justify-self:start;text-align:left}.hero-meta .row{justify-content:flex-start}}

.marquee{border-top:1px solid var(--bd);border-bottom:1px solid var(--bd);padding:18px 0;overflow:hidden}
.marquee-track{display:flex;white-space:nowrap;font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--g1);animation:marquee 42s linear infinite}
.marquee:hover .marquee-track{animation-play-state:paused}
.marquee-track>span>span{padding-right:56px}
.marquee-track>span>span>i{font-style:normal;color:#fff;margin-right:56px;padding:0 4px}
@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}

.section{padding:0 28px 100px;max-width:1600px;margin:0 auto;width:100%}
.section-head{display:flex;align-items:center;justify-content:space-between;padding:24px 0 20px;border-bottom:1px solid var(--bd);font-family:var(--mono);font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--g1)}
.section-head .dot{width:6px;height:6px;border-radius:50%;background:#fff;opacity:.6}
.section-head .dot.live{opacity:1;animation:pulse 1.6s infinite}

.dropzone{position:relative;padding:72px 40px 32px;min-height:440px;border:1px solid var(--bd);border-top:none;display:flex;flex-direction:column;justify-content:space-between;transition:border-color .7s var(--expo),background .7s var(--expo);cursor:none}
.dropzone:hover{border-color:var(--bd-hi);background:var(--off-1)}
.dropzone.on{border-color:#fff;background:var(--off-2)}
.dropzone-inner{display:grid;grid-template-columns:auto 1fr auto;gap:48px;align-items:start}
.dz-index{font-family:var(--mono);font-size:10.5px;letter-spacing:.2em;color:var(--g1);text-transform:uppercase;padding-top:8px}
.dz-title{font-size:clamp(3rem,9vw,9rem);font-weight:900;letter-spacing:-.045em;line-height:.85;text-transform:uppercase}
.dz-title .row{display:block;overflow:hidden}
.dz-title .row>span{display:inline-block;transform:translateY(110%);transition:transform 1.1s var(--expo)}
.dropzone:hover .dz-title .row>span,.dropzone.on .dz-title .row>span{transform:translateY(0)}
.dz-title .row:nth-child(2)>span{transition-delay:.06s}
.dz-title .outline{-webkit-text-stroke:1.5px #fff;color:transparent;font-family:var(--serif);font-style:italic;font-weight:400}
.dz-hint{font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--g1);padding-top:22px;display:flex;gap:14px;flex-wrap:wrap}
.dz-hint .sep{color:var(--g3)}
.dz-arrow{padding-top:16px;transition:transform .8s var(--expo)}
.dropzone:hover .dz-arrow{transform:translateX(14px)}
.dz-rule{flex:1;align-self:center;height:1px;background:var(--bd);margin:44px 0 24px;position:relative;overflow:hidden}
.dz-rule::after{content:'';position:absolute;inset:0;background:#fff;transform:translateX(-100%);transition:transform .9s var(--expo)}
.dropzone:hover .dz-rule::after{transform:translateX(0)}
.dz-foot{display:flex;gap:22px;flex-wrap:wrap;font-family:var(--mono);font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--g1)}
.dz-foot .sep{color:var(--g3)}
@media (max-width:820px){.dropzone{padding:48px 22px 24px;min-height:auto}.dropzone-inner{grid-template-columns:1fr;gap:22px}}

.workspace{display:grid;grid-template-columns:1.6fr 1fr;border:1px solid var(--bd);border-top:none}
@media (max-width:1024px){.workspace{grid-template-columns:1fr}}
.ws-left{border-right:1px solid var(--bd);display:flex;flex-direction:column}
@media (max-width:1024px){.ws-left{border-right:none;border-bottom:1px solid var(--bd)}}
.canvas-head{display:flex;align-items:center;justify-content:space-between;padding:16px 22px;border-bottom:1px solid var(--bd);font-family:var(--mono);font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--g1)}
.canvas-body{background:#020205;aspect-ratio:16/9;position:relative;display:flex;align-items:center;justify-content:center}
.canvas-body canvas{width:100%;height:100%;object-fit:contain;display:block}
.canvas-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--g2);font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase}
.ws-right{padding:0;display:flex;flex-direction:column}
.meta-block{padding:22px;border-bottom:1px solid var(--bd)}
.meta-block:last-child{border-bottom:none}
.meta-label{font-family:var(--mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--g1);margin-bottom:14px;display:flex;align-items:center;gap:10px}
.meta-label .dot{width:5px;height:5px;border-radius:50%;background:#fff;opacity:.7}
.meta-label.err{color:#ff5566}
.meta-label.err .dot{background:#ff5566}
.file-row{display:flex;align-items:baseline;gap:14px}
.file-name{font-size:14px;font-weight:500;color:#fff;word-break:break-all;flex:1}
.file-size{font-family:var(--mono);font-size:11px;color:var(--g1);flex-shrink:0}
.meta-list{display:flex;flex-direction:column;gap:10px}
.meta-row{display:flex;justify-content:space-between;gap:16px;font-size:13px;color:var(--dim);padding-bottom:10px;border-bottom:1px dashed var(--bd)}
.meta-row:last-child{border-bottom:none;padding-bottom:0}
.meta-row .k{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--g1)}
.meta-row .v{font-family:var(--mono);font-size:11px;letter-spacing:.08em;color:#fff;text-align:right}
.meta-row .v.good{color:#00d4aa}
.progress-track{position:relative;height:2px;background:var(--bd);overflow:hidden;margin-top:4px}
.progress-fill{position:absolute;inset:0;background:#fff;transform-origin:0 50%;transform:scaleX(0);transition:transform .25s var(--expo)}
.progress-read{display:flex;justify-content:space-between;margin-top:12px;font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--g1)}
.progress-read .big{color:#fff;font-size:13px;letter-spacing:.06em}
.err-msg{color:#ff5566;font-family:var(--mono);font-size:11px;line-height:1.6;word-break:break-word}

.export{display:block;position:relative;overflow:hidden;border-top:1px solid var(--bd);padding:26px 22px;color:#fff;transition:color .6s var(--expo);grid-column:1/-1;cursor:none}
.export::before{content:'';position:absolute;inset:0;background:#fff;transform:translateY(102%);transition:transform .65s var(--expo);z-index:0}
.export:hover{color:#000}
.export:hover::before{transform:translateY(0)}
.export>*{position:relative;z-index:1}
.export-inner{display:flex;align-items:center;justify-content:space-between;gap:24px}
.export-tag{font-family:var(--mono);font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;opacity:.6;display:block;margin-bottom:6px}
.export-title{font-size:clamp(1.6rem,3.6vw,2.8rem);font-weight:800;letter-spacing:-.03em;text-transform:uppercase;line-height:1}
.export-arrow{transition:transform .6s var(--expo)}
.export:hover .export-arrow{transform:translate(8px,-8px)}
.reset{grid-column:1/-1;padding:18px 22px;border-top:1px solid var(--bd);font-family:var(--mono);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--g1);display:flex;align-items:center;gap:10px;transition:color .4s var(--expo),background .4s var(--expo);text-align:left;width:100%;cursor:none}
.reset:hover{color:#fff;background:var(--off-1)}

.colophon{padding:0 28px 40px;max-width:1600px;margin:0 auto;width:100%}
.col-display{padding:80px 0 40px;display:flex;justify-content:space-between;align-items:baseline;gap:40px;flex-wrap:wrap;font-size:clamp(2.4rem,8vw,7rem);font-weight:900;letter-spacing:-.045em;line-height:.9;text-transform:uppercase}
.col-display .serif{font-family:var(--serif);font-style:italic;font-weight:400}
.col-display .thin{-webkit-text-stroke:1px #fff;color:transparent}
.col-row{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;padding-top:24px;border-top:1px solid var(--bd);font-family:var(--mono);font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--g1)}
.col-row .sep{color:var(--g3)}
.author-link{color:#fff;position:relative;padding-bottom:1px;background-image:linear-gradient(currentColor,currentColor);background-size:0% 1px;background-repeat:no-repeat;background-position:0 100%;transition:background-size .5s var(--expo);cursor:none}
.author-link:hover{background-size:100% 1px}
.author-mark{color:var(--g2);margin-right:6px;font-style:normal}

.cursor{position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:10000;mix-blend-mode:difference;display:none}
@media (hover:hover) and (pointer:fine){.cursor{display:block}body{cursor:none}}
.cursor-dot{position:absolute;top:-4px;left:-4px;width:8px;height:8px;background:#fff;border-radius:50%;transition:width .45s var(--expo),height .45s var(--expo),top .45s var(--expo),left .45s var(--expo)}
.cursor.on .cursor-dot{width:56px;height:56px;top:-28px;left:-28px}

.scroll-progress{position:fixed;top:0;left:0;right:0;height:1px;background:rgba(255,255,255,.06);z-index:9997}
.scroll-progress-fill{height:100%;width:100%;background:#fff;transform-origin:0 50%;transform:scaleX(0)}
`