# Catálogo — o que dá pra pedir (three.js)

Referência rápida baseada no showcase `demos/01-threejs-showcase`. Cada item aponta a cena onde aparece.

| Quero… | Dá? | Como pedir | Cena |
|---|---|---|---|
| Uma pessoa 3D andando, correndo, parada | Sim | "personagem andando do ponto A ao B, depois corre" | 01 |
| Multidão | Sim | "5–50 pessoas andando na rua" | 01 |
| Raio‑X / esqueleto do corpo | Sim | "mostra o esqueleto por dentro" | 01 |
| Rosto com expressões (sorriso, surpresa, medo) | Sim | "rosto passando de neutro para medo" | 02 |
| Mapa 3D com rota, pins e horários | Sim | "rota do suspeito com 4 paradas e horários" | 03 |
| Cena de crime (sala, lanterna, evidências numeradas) | Sim | "sala escura, lanterna revelando as evidências" | 04 |
| Câmera de segurança (CCTV, REC, timestamp) | Sim | "corta para a câmera de segurança às 23:47" | 04 |
| Física (queda, colisões, dominó, câmera lenta) | Sim | "1000 bolinhas caindo e câmera lenta no impacto" | 05 |
| Cidade / casa / cenário completo | Sim, com modelo 3D | precisa de um modelo .glb (grátis em Sketchfab/Poly Haven) | 06 |
| Oceano, céu, pôr do sol, animais | Sim | "mar ao entardecer com pássaros" | 07 |
| Espiral hipnótica, ilusão de ótica | Sim (shader) | "espiral hipnótica roxa girando cada vez mais rápido" | 08 |
| Globo com dados e conexões | Sim | "globo com % de ansiedade por país" | 09 |
| Materiais: vidro, metal, ouro, veludo, cartoon | Sim | "cérebro de vidro", "coração de ouro" | 10 |
| Estilos: filme antigo, quadrinhos, pixel, desenho, sonho | Sim | "flashback em sépia", "memória em halftone" | 11 |
| Texto 3D metálico/brilhante | Sim | "título 3D cromado girando" | 00 |
| Gráficos, contadores, anéis, barras | Sim (HTML/SVG + 3D) | "contador até 95% com anel" | 00-showreel |

## Limites honestos
- **Pessoas realistas específicas** (um rosto real, uma celebridade): não. Personagens são genéricos (manequins, modelos de exemplo).
- **Modelos novos** (um cérebro anatômico, uma arma, um carro específico): precisam de um arquivo .glb. Eu encontro/indico, você baixa e coloca na pasta.
- **Animação de personagem nova** (ex.: "pessoa se ajoelhando"): precisa de animação Mixamo (grátis) — eu aplico no personagem.
- **Fotorrealismo de cinema**: o three.js é tempo real; fica muito bom, mas não é Unreal/Blender.
- **Áudio/voz**: não está no vídeo exportado. A gente sincroniza depois na edição (ou adiciono a trilha via ffmpeg).
