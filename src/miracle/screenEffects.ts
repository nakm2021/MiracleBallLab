export function triggerSwordImpactEffect(): void {
    const layer = document.createElement("div");
    layer.style.position = "fixed";
    layer.style.inset = "0";
    layer.style.zIndex = "9997";
    layer.style.pointerEvents = "none";
    layer.style.overflow = "hidden";
    layer.style.background =
        "radial-gradient(circle at 50% 50%, rgba(255,255,255,.20), rgba(30,80,160,.12) 32%, rgba(0,0,0,.62) 100%)";
    layer.innerHTML = `
        <style>
            @keyframes sword-impact-fade{0%{opacity:0}8%{opacity:1}100%{opacity:0}}
            @keyframes sword-impact-slash-a{0%{transform:translate(-115vw,35vh) rotate(-18deg) scaleX(.25);filter:blur(10px);opacity:0}18%{opacity:1;filter:blur(0)}48%{transform:translate(24vw,-20vh) rotate(-18deg) scaleX(1.25);opacity:1}100%{transform:translate(125vw,-78vh) rotate(-18deg) scaleX(1.6);opacity:0}}
            @keyframes sword-impact-slash-b{0%{transform:translate(110vw,50vh) rotate(20deg) scaleX(.25);filter:blur(10px);opacity:0}22%{opacity:1;filter:blur(0)}52%{transform:translate(-18vw,-14vh) rotate(20deg) scaleX(1.16);opacity:1}100%{transform:translate(-125vw,-64vh) rotate(20deg) scaleX(1.5);opacity:0}}
            @keyframes sword-impact-ring{0%{transform:translate(-50%,-50%) scale(.15);opacity:.95;border-width:16px}100%{transform:translate(-50%,-50%) scale(2.9);opacity:0;border-width:1px}}
            @keyframes sword-impact-title{0%{transform:translate(-50%,-50%) scale(.55);opacity:0;letter-spacing:.15em}18%{transform:translate(-50%,-50%) scale(1.18);opacity:1}52%{transform:translate(-50%,-50%) scale(1);opacity:1}100%{transform:translate(-50%,-58%) scale(.94);opacity:0;letter-spacing:.45em}}
            @keyframes sword-impact-sparks{0%{transform:translate(-50%,-50%) rotate(0deg) scale(.25);opacity:0}18%{opacity:1}100%{transform:translate(-50%,-50%) rotate(220deg) scale(1.7);opacity:0}}
        </style>
        <div style="position:absolute;left:50%;top:50%;width:min(76vmin,760px);height:min(76vmin,760px);border:12px solid rgba(220,246,255,.92);border-radius:999px;box-shadow:0 0 44px rgba(170,230,255,.95), inset 0 0 34px rgba(255,255,255,.78);animation:sword-impact-ring 1200ms ease-out forwards;"></div>
        <div style="position:absolute;left:0;top:50%;width:145vw;height:clamp(18px,4.8vw,52px);background:linear-gradient(90deg, transparent, rgba(255,255,255,.98) 18%, rgba(100,220,255,.95) 50%, rgba(255,255,255,.98) 82%, transparent);box-shadow:0 0 30px rgba(180,240,255,.95),0 0 80px rgba(100,180,255,.8);animation:sword-impact-slash-a 980ms cubic-bezier(.16,1,.3,1) forwards;"></div>
        <div style="position:absolute;left:0;top:51%;width:145vw;height:clamp(14px,3.8vw,42px);background:linear-gradient(90deg, transparent, rgba(255,255,255,.95) 20%, rgba(255,230,140,.94) 50%, rgba(255,255,255,.95) 80%, transparent);box-shadow:0 0 26px rgba(255,248,200,.9),0 0 70px rgba(255,210,80,.65);animation:sword-impact-slash-b 1040ms cubic-bezier(.16,1,.3,1) forwards 80ms;"></div>
        <div style="position:absolute;left:50%;top:50%;font-size:clamp(46px,13vw,150px);font-weight:1000;color:#f8fdff;text-shadow:0 0 12px #ffffff,0 0 34px #7dd3fc,0 12px 34px rgba(0,0,0,.75);animation:sword-impact-title 1420ms ease-out forwards;white-space:nowrap;">斬撃衝突</div>
        <div style="position:absolute;left:50%;top:50%;width:min(74vmin,740px);height:min(74vmin,740px);background:repeating-conic-gradient(from 0deg, rgba(255,255,255,.9) 0 4deg, transparent 4deg 16deg);clip-path:circle(50%);mix-blend-mode:screen;animation:sword-impact-sparks 1260ms ease-out forwards;"></div>
    `;
    layer.style.animation = "sword-impact-fade 1500ms ease-out forwards";
    document.body.appendChild(layer);
    window.setTimeout(() => layer.remove(), 1600);
}
