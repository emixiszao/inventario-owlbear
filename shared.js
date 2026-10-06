export const BASE = "https://emixiszao.github.io/inventario-owlbear/";
export const K_LISTA = "com.inventario.ordem/lista";
export const CH_ANUNCIO = "com.inventario.ordem/anuncio";
export const MODAL_ANUNCIO = "com.inventario.ordem/anuncio-modal";
export const TIPOS = ["Arma", "Acessório", "Explosivo", "Item Operacional", "Item Amaldiçoado", "Documento", "Variado"];

const ROMANOS = ["0", "I", "II", "III", "IV"];
export const romano = n => ROMANOS[n] ?? "0";
export const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* Mantém só negrito, itálico e quebras de linha. */
export function sanitize(html) {
  const doc = new DOMParser().parseFromString("<body>" + (html || "") + "</body>", "text/html");
  const out = [];
  const termBr = () => out.length && out[out.length - 1] === "<br>";
  (function walk(node) {
    node.childNodes.forEach(n => {
      if (n.nodeType === 3) { out.push(esc(n.nodeValue)); return; }
      if (n.nodeType !== 1) return;
      const t = n.tagName.toLowerCase();
      const fw = n.style && n.style.fontWeight;
      const negrito = t === "b" || t === "strong" || fw === "bold" || parseInt(fw, 10) >= 600;
      const italico = t === "i" || t === "em" || (n.style && n.style.fontStyle === "italic");
      if (t === "script" || t === "style") return;
      if (t === "br") { out.push("<br>"); return; }
      if (t === "div" || t === "p") { if (out.length && !termBr()) out.push("<br>"); walk(n); return; }
      if (negrito) out.push("<b>");
      if (italico) out.push("<i>");
      walk(n);
      if (italico) out.push("</i>");
      if (negrito) out.push("</b>");
    });
  })(doc.body);
  return out.join("").replace(/(<br>)+$/, "");
}

export function htmlParaTexto(html) {
  const d = document.createElement("div");
  d.innerHTML = (html || "").replace(/<br\s*\/?>/gi, "\n");
  return d.textContent;
}

export async function copiarTexto(texto) {
  try { await navigator.clipboard.writeText(texto); return true; } catch (e) {}
  const t = document.createElement("textarea");
  t.value = texto; t.style.cssText = "position:fixed;left:-9999px;top:0";
  document.body.appendChild(t); t.select();
  let ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
  t.remove(); return ok;
}

/* Copia mantendo o negrito (text/html + text/plain). */
export async function copiarRico(html) {
  const limpo = sanitize(html);
  const plano = htmlParaTexto(limpo);
  try {
    await navigator.clipboard.write([new ClipboardItem({
      "text/html": new Blob([limpo], { type: "text/html" }),
      "text/plain": new Blob([plano], { type: "text/plain" })
    })]);
    return true;
  } catch (e) {}
  // Plano B: seleciona um trecho renderizado e copia (também preserva a formatação)
  const d = document.createElement("div");
  d.innerHTML = limpo;
  d.style.cssText = "position:fixed;left:-9999px;top:0;white-space:pre-wrap";
  document.body.appendChild(d);
  const r = document.createRange(); r.selectNodeContents(d);
  const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  let ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
  s.removeAllRanges(); d.remove(); return ok;
}

export function holoHTML(src) {
  const s = esc(src);
  return `<div class="holo"><div class="holo-in"><img class="h-base" src="${s}" alt="" draggable="false"><img class="h-glow" src="${s}" alt="" draggable="false"></div></div>`;
}

export function initHolo(holo) {
  const inner = holo.querySelector(".holo-in");
  const reset = () => {
    holo.classList.remove("ativo"); holo.classList.add("solto");
    ["--rx", "--ry", "--mx", "--my", "--hue"].forEach(v => inner.style.removeProperty(v));
  };
  const mover = e => {
    const r = holo.getBoundingClientRect();
    const px = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
    const py = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1);
    holo.classList.add("ativo"); holo.classList.remove("solto");
    inner.style.setProperty("--ry", ((px - 0.5) * 34).toFixed(1));
    inner.style.setProperty("--rx", ((0.5 - py) * 34).toFixed(1));
    inner.style.setProperty("--mx", (px * 100).toFixed(1));
    inner.style.setProperty("--my", (py * 100).toFixed(1));
    inner.style.setProperty("--hue", (px * 140 - 30).toFixed(0));
  };
  holo.addEventListener("pointermove", mover);
  holo.addEventListener("pointerdown", e => { try { holo.setPointerCapture(e.pointerId); } catch (_) {} mover(e); });
  holo.addEventListener("pointerleave", reset);
  holo.addEventListener("pointerup", e => { if (e.pointerType !== "mouse") reset(); });
  holo.addEventListener("pointercancel", reset);
}
