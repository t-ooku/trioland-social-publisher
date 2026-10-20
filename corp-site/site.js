(function(){
  // 日本語として文節で改行させる（トップは外枠が付くので lang をここで入れる）
  if (!document.documentElement.lang) document.documentElement.lang = "ja";
  // ページを開いたら必ず一番上から（前のページのスクロール位置を引き継がない）
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  var moved = false; ["wheel","touchmove","keydown","pointerdown"].forEach(function(ev){ addEventListener(ev, function(){ moved = true }, {passive:true, once:true}) });
  var toTop = function(){ if (location.hash || moved) return; var h = document.documentElement, s = h.style.scrollBehavior; h.style.scrollBehavior = "auto"; window.scrollTo(0, 0); var f = document.body && document.body.firstElementChild; if (f && f.scrollIntoView) try { f.scrollIntoView({block:"start", behavior:"instant"}) } catch(e){ f.scrollIntoView(true) } h.style.scrollBehavior = s };
  toTop(); addEventListener("DOMContentLoaded", toTop); addEventListener("load", toTop); addEventListener("pageshow", toTop);
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // メニュー（スマホ）
  var mb = document.getElementById("menuBtn"), nav = document.getElementById("gnav");
  if (mb) {
    mb.addEventListener("click", function(){ var o = nav.classList.toggle("open"); mb.setAttribute("aria-expanded", o) });
    nav.addEventListener("click", function(e){ if (e.target.closest("a")) { nav.classList.remove("open"); mb.setAttribute("aria-expanded", false) } });
  }

  // トップの写真と動画：動画は表示されるたびに最初から再生し、終わったら次へ
  var hero = document.getElementById("hero");
  if (hero) {
    var sls = hero.querySelectorAll(".sl"), ctrl = document.getElementById("heroCtrl"), cap = document.getElementById("heroCap"), cur = 0, timer;
    sls.forEach(function(_, i){ var b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", (i+1) + "枚目"); b.innerHTML = "<i></i>"; b.onclick = function(){ show(i) }; ctrl.appendChild(b) });
    var vplay = function(v){ v.muted = true; v.defaultMuted = true; v.playsInline = true; try { v.currentTime = 0 } catch(e){} var p = v.play(); if (p && p.catch) p.catch(function(){}) };
    var show = function(i){
      cur = (i + sls.length) % sls.length; clearTimeout(timer);
      sls.forEach(function(el, k){ el.classList.toggle("on", k === cur); var v = el.querySelector("video"); if (v && k !== cur) v.pause() });
      var el = sls[cur], v = el.querySelector("video"), dur = v ? ((v.duration && isFinite(v.duration)) ? v.duration : 5.5) : 6;
      ctrl.querySelectorAll("button").forEach(function(b, k){ b.classList.remove("on"); if (k === cur){ void b.offsetWidth; b.style.setProperty("--dur", dur + "s"); b.classList.add("on") } });
      cap.innerHTML = '<span class="en">' + el.dataset.n + '</span><span>' + el.dataset.cap + '</span>';
      if (v){ vplay(v); if (!reduce) timer = setTimeout(function(){ show(cur + 1) }, (dur + 3) * 1000) }
      else if (!reduce) timer = setTimeout(function(){ show(cur + 1) }, 6000);
    };
    sls.forEach(function(el){ var v = el.querySelector("video"); if (v) v.addEventListener("ended", function(){ if (sls[cur] === el && !reduce) show(cur + 1) }) });
    ["touchstart","pointerdown"].forEach(function(ev){ document.addEventListener(ev, function once(){ var v = sls[cur].querySelector("video"); if (v && v.paused){ var p = v.play(); if (p && p.catch) p.catch(function(){}) } document.removeEventListener(ev, once) }, {passive:true}) });
    show(0);
  }

  // 地図：画面に入ったらピンが落ちて、本社から線が伸びる。凡例で事業ごとに絞り込み
  var maps = document.querySelectorAll(".kmap");
  if ("IntersectionObserver" in window && !reduce){
    var mo = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add("go"); mo.unobserve(e.target) } }) }, {threshold:.25});
    maps.forEach(function(m){ mo.observe(m) });
  } else maps.forEach(function(m){ m.classList.add("go") });
  document.querySelectorAll(".mapbox").forEach(function(box){
    var btns = box.querySelectorAll(".lg-btn");
    btns.forEach(function(b){ b.addEventListener("click", function(){
      var on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", on);
      var act = {}; btns.forEach(function(x){ act[x.dataset.f] = x.getAttribute("aria-pressed") === "true" });
      box.querySelectorAll(".pin").forEach(function(p){ p.classList.toggle("off", !act[p.dataset.biz]) });
      box.querySelectorAll(".link").forEach(function(l){ var k = (l.getAttribute("class").match(/b-(\w+)/) || [])[1]; l.classList.toggle("off", !act[k]) });
      document.querySelectorAll(".fgroup").forEach(function(g){ g.hidden = !act[g.dataset.biz] });
    }) });
  });

  // 数字のカウントアップ
  var cnts = document.querySelectorAll(".cnt");
  if ("IntersectionObserver" in window && !reduce){
    var co = new IntersectionObserver(function(es){ es.forEach(function(e){ if (!e.isIntersecting) return; co.unobserve(e.target);
      var el = e.target, to = +el.dataset.to, from = to > 1000 ? to - 30 : 0, t0 = performance.now();
      (function step(t){ var k = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step) })(t0);
    }) }, {threshold:.6});
    cnts.forEach(function(c){ co.observe(c) });
  }

  // スクロールで少し浮き上がる（最初から見えている）
  if ("IntersectionObserver" in window && !reduce){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add("on"); io.unobserve(e.target) } }) }, {rootMargin:"0px 0px -8% 0px"});
    document.querySelectorAll(".rv").forEach(function(el){ io.observe(el) });
  }
  // 見えているあいだだけ動画を再生
  var play = function(v){ v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function(){}) };
  if ("IntersectionObserver" in window){
    var io2 = new IntersectionObserver(function(es){ es.forEach(function(e){ var v = e.target;
      if (e.isIntersecting){ if (!v.dataset.ld){ v.querySelectorAll("source").forEach(function(s){ s.src = s.dataset.src }); v.load(); v.dataset.ld = 1 } play(v) } else v.pause() }) }, {threshold:.3});
    document.querySelectorAll("video.clip").forEach(function(v){ io2.observe(v) });
  }
})();
