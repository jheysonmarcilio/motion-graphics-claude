---
name: animar-cena
description: Transforma um roteiro (ou pedido de cena) em animação three.js determinística no padrão do projeto, aplicando as regras de movimento do formato longo 16:9 ou Short 9:16. Use quando for criar ou alterar uma animação/cena em demos/.
---

# Animar cena (three.js)

## 1. Ler (mínimo)
- Storyboard `roteiros/NN-*.md` com a bíblia visual no topo (se não existir: `direcao-de-arte` antes). Não reler `brand/*` — a bíblia já resume.
- Narração: `node tools/transcrever.cjs audio/NN.mp3 demos/NN-nome/fala.json` (imprime "seg texto"; `--fino` para tempos precisos). A animação segue a voz.
- **Nunca** ler `three.js-master/` inteiro nem arquivos de kit inteiros: `grep -n "^export" arquivo` para ver a API e ler só a função que vai usar.

## 2. Montar sem reescrever (economia de tokens)
Copiar com shell (`cp`), não com Read/Write, e editar só o que muda:
| Precisa de | Copiar de | API |
|---|---|---|
| motor (index.html, HUD, `?t`, `?export`, `__mg`, legendas) | o demo mais próximo do formato: Short `06-ressignificar-traumas` (index.html, main.js, lib.js, overlay.js) | `lib.js`: `seg ease pop gone smooth mulberry32 wobble fitFont canvasTex` · `overlay.js`: `buildOverlay CAPS` |
| explainer flat (bonecos vetoriais, placas que encaixam texto) | `06-ressignificar-traumas/flat.js` | `box disc poly arc limb stroke plate text star bolt cloud polaroid person blinkAt` |
| 3D de brinquedo brilhante | `07-anuncio-curso/toy.js` | `toy sign iconBadge fitFont` |
| colagem / papel recortado | `04-hipnose-existe-v2.1/{paper,puppet,props}.js` | `sheet textCut ribbon` · `puppet mini` · `notepad tape sticky stamp` |
| overlay 2D sobre vídeo gravado | `09-ads2-parece-filme` (main.js + cues.json) | ver memória "anúncio overlay" |
| Sticker (só se pedido) | importar de `demos/_sticker/` + estrutura de `12-franklin-mesmer/main.js` | skill `estilo-sticker` |
| SFX / trilha | `sfx.cjs` do demo copiado + `trilha.json` | `tools/sfx-lib.js`, `tools/trilha.cjs` |
**Variar sem começar do zero:** montar o vídeo com peças dos kits (repintadas pela paleta da bíblia, recombinadas em outros cenários e papéis) e escrever só o que falta. Herói e linguagem principal não repetem os 2 vídeos anteriores.
**A biblioteca cresce:** peça nova que sirva para outros vídeos (boneco, prop, cenário, transição) vira função exportada com parâmetros (cor, tamanho, pose) no arquivo de kit do vídeo, e ganha uma linha nesta tabela ao terminar.

Código: escrever cada arquivo novo de uma vez (Write), ajustes com Edit pequeno; não reler arquivo recém-escrito.

## 3. Regras fixas
- Palco 1920×1080 ou 1080×1920; `window.__mg = { duration, fps: 30, width, height, renderAt, current: () => ({scene, camera}) }`; `?export` → `__mg.loaded = true`, sem rAF.
- Determinismo: PRNG com seed, `mixer.setTime(t)`, nada depende do quadro anterior. Pré-aquecer shaders.
- `frustumCulled = false` em InstancedMesh/Points que nascem com escala 0.
- Texto em caixa: `fitFont`/escalar mesh, nunca tamanho fixo. Planos sobrepostos: altura própria + `renderOrder`.
- Tremores ≤ ~2,5 Hz; nada de pisca-pisca rápido.

| | Longo 16:9 | Short 9:16 |
|---|---|---|
| Plano | 4–8 s | 1,5–3 s, nada parado > 3 s |
| Câmera | dolly lento, pan, parallax, zoom-out revelador | zoom-in rápido, whip pan, close↔médio↔diagrama |
| Transição | cartela de capítulo, troca de cenário, fades | match cut, whip, zoom through |
| Composição | terços, 3 camadas | centro; nada vital no 25% inferior nem 15% direita |
| Texto | integrado ao cenário | ≤ 5 palavras, bold, central |
| Fim | síntese + 15–20 s livres | imagem-chave + pergunta CTA + loop |

Internet, não institucional: pessoa → personagem + cartão; números contáveis; ênfase com zoom-punch, carimbo, setas, tremor; micro-animação contínua; nada surge do nada (`expoOut`); cada palavra-chave da fala tem resposta visual no mesmo instante.

## 4. Verificar (barato)
1. `node tools/check.js demos/NN-nome` → "✓ nenhum erro" (AVISO = avaliar).
2. **Uma** folha de contato: `node tools/frames.js demos/NN-nome - t1 … t12` (12 tempos espalhados, sai no TEMP) e olhar só ela. Mais da metade parecendo o mesmo plano → variar. Não tirar screenshots soltos em loop; para um problema pontual, `frames.js` com 1–3 tempos.
3. Exportar com `exportar-video`.
