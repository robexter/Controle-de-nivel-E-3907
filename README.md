# E-3907 — Controle de Nível Concept V2

One-page/PWA educativa de controle de nível e transferência de gasolina desbutanizada da E-3907 para a U-35. Refinamento da V1, preservando a versão original.

## V2 — principais aprimoramentos

- **Hipóteses comparáveis da ligação LIC-179 → LIC-179B**: entrada do controlador B recebe (A) a MV do LIC-179 ou (B) a PV do LT-179. A imagem não identifica qual sinal é empregado na planta. A seleção inicial é a hipótese MV, **não validada**.
- **Equilíbrio vs. controle**: painel CIC diferencia vazões equilibradas de nível no SP e indica saturação/limitação; a missão exige atendimento simultâneo aos três critérios didáticos por 2 min virtuais.
- **Simulação de processo ampliada**: 10 cenários, inclusive equilíbrio com desvio de nível e falha na seleção do FY-713; dois inventários, duas válvulas, perturbações e oito falhas mais a falha de FY.
- **Interatividade**: avanço manual +1/+5 min, pausar/retomar, alteração de hipóteses, modos, setpoints, capacidade hidráulica, vazão de produção, consumo e falhas.
- **Cascata e seletor**: MV(FY)=MIN(MV(FIC),MV(LIC-35056)) em lógica normal; em falha intencional de FY, a saída do FIC prevalece indevidamente. Anti-windup didático de rastreamento por back-calculation opcional.
- **Tendências e registro**: níveis, vazões, solicitações, MVs e sinal selecionado, exportação CSV da janela gráfica móvel de 15 min virtuais.
- **Teoria e avaliação CIC**: todos os capítulos anteriores preservados, três capítulos técnicos adicionais, 18 questões reescritas com alternativas plausíveis e embaralhamento de questões/alternativas.
- **PWA**: cache V2, mecanismo explícito de aviso de nova versão e atualização, manifesto e ícones 192×192/512×512.

## Estrutura
- `index.html`: layout de uma página, abas, fluxograma vivo e módulos.
- `styles.css`: tema, responsividade desktop/mobile, painéis e acessibilidade.
- `content.js`: explicações integrais, painéis e banco de 18 perguntas.
- `app.js`: simulação, estados, controles PI, tendências, missões e interações.
- `assets`: imagens da malha fornecidas pelo usuário.
- `icons`: ícones PWA 192 e 512 pixels.
- `manifest.webmanifest` e `sw.js`: instalação e cache offline.

## Modelo didático e hipóteses

- `dV_E/dt = Q_produção − Q_LCV179 − Q_FV730A`.
- `dV_U/dt = Q_FV730A − Q_consumo_U35`.
- `MV_FY713 = min(MV_FIC730, MV_LIC35056)` para a convenção de abertura crescente **suposta**.
- Volume útil virtual E = 450 m³, U = 220 m³, Q máx LCV = 72 m³/h, Q máx FV = 90 m³/h. **Esses números são inteiramente fictícios.**
- No estado nominal de V2, nível E ≈ 30%, nível U = 66%, produção ≈ 67,2 m³/h, retirada LCV ≈ 43,2 m³/h e envio U-35 ≈ 24 m³/h; usado apenas para referência de equilíbrio no modo MV.
- Missão didática: |L_E − SP_E| ≤ 3 p.p.; |balanços E e U| ≤ 3 m³/h; L_U < SP_U − 2 p.p., por ao menos 2 minutos virtuais, sem falha e com LIC-179 em AUTO. **Não são critérios operacionais reais.**

## Publicação GitHub Pages

1. Criar um repositório para a V2 (ou atualizar o repositório publicado, preservando cópia da V1).
2. Enviar o conteúdo desta pasta para a **raiz** do repositório; não enviar apenas `index.html`.
3. Ativar *Settings > Pages*, branch principal e pasta `/ (root)`.
4. Abrir em HTTPS. O botão de instalação aparece apenas quando o navegador apresenta evento de instalação; caso não apareça, usar *Adicionar à tela inicial* do navegador.
5. Se a V1 já estiver instalada, recarregar; a V2 notifica quando há nova versão e oferece botão de atualização quando aplicável. O comportamento varia conforme o navegador.

## Validação necessária na U-39

O simulador **não** representa sinais internos confirmados, valores reais de vazão, níveis de alarme, intertravamento, volumes, curvas Cv, ganho/sintonia, permissivas ou posições de falha. Conferir P&ID e esquemas de configuração do Yokogawa Centum VP, especialmente a ligação LIC-179 → LIC-179B, direção e escala dos sinais, limites de saída e condições de anti-windup/tracking. Não usar para comando de equipamento nem decisão em emergência.
