/* E-3907 Nível Concept V2 — Modelo educativo configurável, não para operação real. */
(() => {
'use strict';
const D = window.CONCEPT;
const $ = (id) => document.getElementById(id);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const fmt=(x,n=1)=>Number(x).toLocaleString('pt-BR',{minimumFractionDigits:n,maximumFractionDigits:n});
const pct=x=>fmt(x,1)+'%';
const state0=()=>({
 e:30,u:66, feed:67.2,demand:24,head:1, spE:30,spB:60,spR:90,speed:1,signalB:'mv',
 v1:60,v2:26.667, q1:43.2,q2:24,ltE:30,ltU:66,ft:24,
 mv1:60,mvF:26.667,mvR:100,mvFY:26.667,spFlow:24,owner:'FIC-730', bPV:60,invalidSelector:false,
 int1:20,intB:0,intF:0,intR:0,mode179:'auto',mode179b:'auto',modeFic:'cas',mode35056:'auto',
 manual179:75,manualB:25,manualFic:35,manual35056:100,antiwindup:true,
 fault:'none',time:0,paused:false,trace:[],acc:0,renderAcc:0,goalDuration:0,segment:'baseline',nuisance:'',lastTrendE:0,lastTrendU:0,events:[],lastOwner:'FIC-730'
});
let s=state0();let prevFrame=performance.now();let deferredPrompt=null;let toastTimer=0;
const CAP_E=450,CAP_U=220,Q1MAX=72,Q2MAX=90;
const ids=['feed','demand','head','spE','spB','spR','speed','manual179','manualB','manualFic','manual35056'];
const inputs={feed:'feed',demand:'demand',head:'head',spE:'spE',spB:'spB',spR:'spR',speed:'speed',manual179:'manual179',manualB:'manualB',manualFic:'manualFic',manual35056:'manual35056'};
const suffix={feed:' m³/h',demand:' m³/h',head:'%',spE:'%',spB:'%',spR:'%',speed:'×',manual179:'%',manualB:' m³/h',manualFic:'%',manual35056:'%'};
function syncInputs(){
 ids.forEach(id=>{const raw=id==='head'?s.head*100:s[id];$(id).value=String(raw);$(id+'Out').textContent=fmt(raw,0)+suffix[id]});
 $('fault').value=s.fault;$('antiwindup').checked=s.antiwindup;$('signalB').value=s.signalB;updateSignalDescription();
 ['mode179','mode179b','modeFic','mode35056'].forEach(id=>$(id).value=s[id]); updateManualVisibility();
}
function updateSignalDescription(){
 const isMV=s.signalB==='mv';
 $('signalBDescription').textContent=isMV?'Hipótese MV: o LIC-179B recebe a saída percentual do LIC-179; seu SP 60% referencia esse sinal. A imagem não confirma a natureza do sinal.':'Hipótese PV: o LIC-179B recebe o nível indicado por LT-179; nesse caso SP 60% é referência direta ao nível. A imagem não confirma essa ligação.';
}
$('signalB').addEventListener('change',e=>{
 s.signalB=e.target.value;
 // Zera memória integral da malha complementar ao mudar de hipótese.
 s.intB=0;s.intF=0;s.goalDuration=0;
 updateSignalDescription();record(true);updateDisplay();
 toast('Hipótese de LIC-179B: '+(s.signalB==='mv'?'MV do LIC-179':'PV do LT-179'));
});
function updateManualVisibility(){
 $('manual179Wrap').hidden=s.mode179!=='manual';$('manualBWrap').hidden=s.mode179b!=='manual';$('manualFicWrap').hidden=s.modeFic!=='manual';$('manual35056Wrap').hidden=s.mode35056!=='manual';
}
ids.forEach(id=>$(id).addEventListener('input',e=>{
 let val=Number(e.target.value);s[id]=id==='head'?val/100:val;
 $(id+'Out').textContent=fmt(val,0)+suffix[id];
 if(s.paused)updateDisplay();
}));
['mode179','mode179b','modeFic','mode35056'].forEach(id=>$(id).addEventListener('change',e=>{
 const val=e.target.value;
 if(id==='mode179'&&val==='manual')s.manual179=Math.round(s.mv1);
 if(id==='mode179b'&&val==='manual')s.manualB=Math.round(s.spFlow);
 if(id==='modeFic'&&val==='manual')s.manualFic=Math.round(s.mvF);
 if(id==='mode35056'&&val==='manual')s.manual35056=Math.round(s.mvR);
 s[id]=val;syncInputs();toast('Modo alterado: '+id+' → '+val.toUpperCase());
}));
$('fault').addEventListener('change',e=>{s.fault=e.target.value;toast(s.fault==='none'?'Instrumentação restaurada.':'Falha ativada: '+e.target.selectedOptions[0].textContent)});
$('antiwindup').addEventListener('change',e=>s.antiwindup=e.target.checked);
$('playBtn').addEventListener('click',()=>{s.paused=!s.paused;setPlayLabel();updateDisplay()});
function advanceVirtual(minutes){s.paused=true;setPlayLabel();const count=Math.round(minutes/.05);for(let i=0;i<count;i++){tick(minutes/count);if(i%3===0)record(true)}record(true);updateDisplay();drawAll()}
$('step1Btn').addEventListener('click',()=>advanceVirtual(1));
$('step5Btn').addEventListener('click',()=>advanceVirtual(5));
function escapeCSV(val){return String(val).replaceAll('"','""')}
$('exportBtn').addEventListener('click',()=>{
 const columns=['t','e','u','q1','q2','spq','ft','f','r','sel','spE','spB','spR'];
 const header='min_virtual;nivel_E3907_pct;nivel_U35_pct;retirada_LCV_m3h;envio_FV_m3h;SP_FIC_m3h;FT_m3h;MV_FIC_pct;MV_LIC35056_pct;MV_FY_pct;SP_LIC179_pct;SP_LIC179B_pct;SP_LIC35056_pct';
 const rows=[header,...s.trace.map(p=>columns.map(k=>escapeCSV(Number(p[k]).toFixed(3))).join(';'))];
 const blob=new Blob(['\ufeff'+rows.join('\n')],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='E-3907-Concept-V2-tendencias.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Tendências exportadas em CSV.');
});
$('resetBtn').addEventListener('click',()=>{reset();toast('Simulação reiniciada.')});
$('clearChart').addEventListener('click',()=>{s.trace=[];record(true);drawAll();toast('Histórico visual reiniciado.')});
$('viewE').addEventListener('click',()=>document.querySelector('.diagram-scroll').scrollTo({left:0,behavior:'smooth'}));
$('viewU').addEventListener('click',()=>{const el=document.querySelector('.diagram-scroll');el.scrollTo({left:el.scrollWidth-el.clientWidth,behavior:'smooth'})});
function setPlayLabel(){$('playBtn').textContent=s.paused?'▶ Retomar':'Ⅱ Pausar'}
function reset(){const speed=s.speed;s=state0();s.speed=speed;syncInputs();setPlayLabel();record(true);updateDisplay();drawAll();$('scenarioExplanation').innerHTML='<b>Simulação restaurada</b><p>Acompanhe o estabelecimento do equilíbrio. Altere uma variável ou use um cenário para provocar uma resposta de controle.</p>';document.querySelectorAll('.scenario').forEach(b=>b.classList.remove('current'))}
function tick(m){
 // Leituras de falha exclusivamente na PV indicada.
 s.ltE=clamp(s.e-(s.fault==='ltE-low'?22:0),0,100);
 s.ltU=clamp(s.u-(s.fault==='ltU-low'?26:0),0,100);
 s.ft=Math.max(0,s.q2+(s.fault==='ft-low'?-18:s.fault==='ft-high'?18:0));
 const e1=s.ltE-s.spE;
 s.bPV=s.signalB==='mv'?s.mv1:s.ltE; // atualizado novamente depois de computar MV-179
 const eR=s.spR-s.ltU;
 // Controladores educativos PI (todas as ações em convenção abertura crescente).
 if(s.mode179==='auto'){
  const raw=40+3.1*e1+s.int1;
  s.mv1=clamp(raw,0,100);
  if((raw>0&&raw<100)||(raw>=100&&e1<0)||(raw<=0&&e1>0))s.int1=clamp(s.int1+0.26*e1*m,-80,80);
 }else{s.mv1=s.manual179}
 s.bPV=s.signalB==='mv'?s.mv1:s.ltE;
 const eB=s.bPV-s.spB;
 if(s.mode179b==='auto'){
  const rawB=24+4.3*eB+s.intB;
  s.spFlow=clamp(rawB,0,95);
  if((rawB>0&&rawB<95)||(rawB>=95&&eB<0)||(rawB<=0&&eB>0))s.intB=clamp(s.intB+.23*eB*m,-45,85);
 }else{s.spFlow=s.manualB}
 if(s.modeFic==='cas'){
  const ef=s.spFlow-s.ft;
  const rawF=100*s.spFlow/Q2MAX+.82*ef+s.intF;
  s.mvF=clamp(rawF,0,100);
  const blocked=(s.mvR<s.mvF-.25);
  if((!s.antiwindup||!blocked)&&((rawF>0&&rawF<100)||(rawF>=100&&ef<0)||(rawF<=0&&ef>0)))s.intF=clamp(s.intF+.92*ef*m,-65,75);
 }else{s.mvF=s.manualFic}
 if(s.mode35056==='auto'){
  const rawR=55+17*eR+s.intR;
  s.mvR=clamp(rawR,0,100);
  if((rawR>0&&rawR<100)||(rawR>=100&&eR<0)||(rawR<=0&&eR>0))s.intR=clamp(s.intR+1.3*eR*m,-65,55);
 }else{s.mvR=s.manual35056}
 // Simulação opcional de falha de FY: o seletor perde a função de mínimo.
 s.invalidSelector=s.fault==='fy-bypass';
 s.mvFY=s.invalidSelector?s.mvF:Math.min(s.mvF,s.mvR);
 s.owner=s.invalidSelector?'FIC-730 (FY em falha)':s.mvR<s.mvF-.15?'LIC-35056':'FIC-730';
 if(s.modeFic==='cas'&&s.antiwindup&&!s.invalidSelector&&s.mvR<s.mvF-.25){
  // Rastreamento didático da saída selecionada (back-calculation), sem alterar o seletor.
  const delta=s.mvFY-s.mvF;
  s.intF=clamp(s.intF+0.55*delta*m,-65,75);
 }
 if(s.owner!==s.lastOwner){s.events.push({t:s.time,msg:'Mudança FY: '+s.owner});s.lastOwner=s.owner;if(s.events.length>30)s.events.shift()}

 const target1=s.fault==='lcv-closed'?0:s.fault==='lcv-open'?100:s.mv1;
 const target2=s.fault==='fv-closed'?0:s.fault==='fv-open'?100:s.mvFY;
 s.v1=clamp(s.v1+(target1-s.v1)*(1-Math.exp(-m/1.3)),0,100);
 s.v2=clamp(s.v2+(target2-s.v2)*(1-Math.exp(-m/.65)),0,100);
 // Capacidade instalada fictícia: fluxos simplificados; incluem disponibilidade hidráulica.
 s.q1=Q1MAX*(s.v1/100)*Math.sqrt(s.head);
 s.q2=Q2MAX*(s.v2/100)*Math.sqrt(s.head);
 const dE=(s.feed-s.q1-s.q2),dU=(s.q2-s.demand);
 s.lastTrendE=(100*dE/CAP_E)/60;s.lastTrendU=(100*dU/CAP_U)/60;
 s.e=clamp(s.e+100*dE/CAP_E*m/60,0,100);
 s.u=clamp(s.u+100*dU/CAP_U*m/60,0,100);
 s.time+=m;
 const stable=Math.abs(dE)<3&&Math.abs(dU)<3&&Math.abs(s.e-s.spE)<3&&s.u<s.spR-2&&s.e>5&&s.u>5&&!s.invalidSelector&&s.mode179==='auto'&&s.fault==='none';
 s.goalDuration=stable?s.goalDuration+m:0;
}
function record(force=false){
 const entry={t:s.time,e:s.e,u:s.u,q1:s.q1,q2:s.q2,spq:s.spFlow,ft:s.ft,f:s.mvF,r:s.mvR,sel:s.mvFY,spE:s.spE,spB:s.spB,spR:s.spR};
 if(force||!s.trace.length||entry.t-s.trace[s.trace.length-1].t>.11)s.trace.push(entry);
 const oldest=s.time-15;
 while(s.trace.length>3&&s.trace[1].t<oldest)s.trace.shift();
}
function updateSvg(){
 const txt=(id,t)=>{const el=$(id);if(el)el.textContent=t};
 txt('pvE',pct(s.e));txt('pvU',pct(s.u));txt('ltTag',pct(s.ltE));txt('ltUTag',pct(s.ltU));txt('sp1Tag',fmt(s.spE,0)+'%');txt('sp2Tag',fmt(s.spB,0)+'%');txt('sp3Tag',fmt(s.spR,0)+'%');
 txt('modeBTag',s.signalB==='mv'?'MV L179':'PV LT179');txt('mv1Tag','MV '+fmt(s.mv1,0)+'%');txt('mvFTtag','MV '+fmt(s.mvF,0)+'%');txt('spFlowTag',fmt(s.spFlow,1)+' m³/h');txt('ftTag',fmt(s.ft,1)+' m³/h');txt('mvRTag','MV '+fmt(s.mvR,0)+'%');txt('mvSelTag',fmt(s.mvFY,0)+'%');
 txt('q1Tag',fmt(s.q1,1)+' m³/h');txt('q2Tag',fmt(s.q2,1)+' m³/h');txt('qFeedTag',fmt(s.feed,0)+' m³/h');txt('qOutTag',fmt(s.demand,0)+' m³/h');
 const be=s.feed-s.q1-s.q2,bu=s.q2-s.demand;
 txt('balanceETag',(be>0?'+':'')+fmt(be,1)+' m³/h');txt('balanceUTag',(bu>0?'+':'')+fmt(bu,1)+' m³/h');
 const hE=225*s.e/100,hU=162*s.u/100;
 $('liquidE').setAttribute('y',String(445-hE));$('liquidE').setAttribute('height',String(hE));$('liquidU').setAttribute('y',String(430-hU));$('liquidU').setAttribute('height',String(hU));
 const yE=445-hE,yU=430-hU;
 $('waveE').setAttribute('d',`M67 ${yE} Q90 ${yE-7} 114 ${yE} T162 ${yE} T210 ${yE}`);
 $('waveU').setAttribute('d',`M915 ${yU} Q939 ${yU-6} 961 ${yU} T1006 ${yU} T1052 ${yU}`);
 $('flow1').style.opacity=String(clamp(.17+s.q1/95,.15,1));$('flow2').style.opacity=String(clamp(.17+s.q2/95,.15,1));$('flow3').style.opacity=String(clamp(.17+s.demand/100,.15,1));
 $('flow1').style.animationDuration=fmt(clamp(2.1-s.q1/70,.25,2.1),2)+'s';$('flow2').style.animationDuration=fmt(clamp(2.3-s.q2/67,.25,2.3),2)+'s';
 $('signalFic').classList.toggle('active',s.owner.startsWith('FIC-730'));$('signalLic').classList.toggle('active',s.owner==='LIC-35056');$('signalLic').classList.toggle('fault',s.invalidSelector);
 txt('runBadge',s.paused?'Ⅱ PAUSADO':'● SIMULANDO');txt('winnerBadge',s.owner);
 const mins=Math.floor(s.time),seconds=Math.floor((s.time-mins)*60);
 txt('simClock',`${String(mins).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`);
}
function updateDisplay(){
 updateSvg();
 const txt=(id,t)=>$(id).textContent=t;
 txt('labLevelE',pct(s.e));txt('labLevelU',pct(s.u));
 $('labFillE').style.height=clamp(s.e,0,100)+'%';$('labFillU').style.height=clamp(s.u,0,100)+'%';
 txt('labLIC179','MV '+fmt(s.mv1,0)+'%');txt('labQ1',fmt(s.q1,1)+' m³/h');txt('labQ2',fmt(s.q2,1)+' m³/h');
 txt('labFY',fmt(s.mvFY,0)+'%');txt('labWinner',s.owner+' selecionado');txt('labFIC','MV FIC '+fmt(s.mvF,0)+'%');txt('labLIMIT','MV LIC '+fmt(s.mvR,0)+'%');txt('labDemand',fmt(s.demand,0)+' m³/h');
 $('labFillU').classList.toggle('danger',s.u>=s.spR);$('labFillE').classList.toggle('danger',s.e>85||s.e<10);
 txt('kpiE',pct(s.e));txt('kpiU',pct(s.u));txt('kpiQ1',fmt(s.q1,1));txt('kpiQ2',fmt(s.q2,1));txt('kpiFY',fmt(s.mvFY,0)+'%');txt('kpiOwner',s.owner);txt('kpiEtrend',s.lastTrendE>=0?'↑ '+fmt(s.lastTrendE,2)+' p.p./min':'↓ '+fmt(Math.abs(s.lastTrendE),2)+' p.p./min');txt('kpiUtrend',s.lastTrendU>=0?'↑ '+fmt(s.lastTrendU,2)+' p.p./min':'↓ '+fmt(Math.abs(s.lastTrendU),2)+' p.p./min');
 const be=s.feed-s.q1-s.q2,bu=s.q2-s.demand;
 const constrained=s.owner==='LIC-35056';const stable=s.goalDuration>=2;
 const nearE=Math.abs(s.e-s.spE)<=3,balanced=Math.abs(be)<=3&&Math.abs(bu)<=3,margin=s.u<s.spR-2;
 const concern=s.e>89||s.u>94||s.e<13||s.u<8;
 const status=concern?'Faixa extrema (modelo)':s.invalidSelector?'FY com falha':stable?'Controle estabilizado':constrained?'Override ativo':balanced&&!nearE?'Equilíbrio com desvio':balanced?'Equilíbrio inicial':'Em transição';
 txt('stabilityText',status);txt('stabilityDetail',stable?'Estável por '+fmt(s.goalDuration,1)+' min virtuais':`ΔL E ${fmt(s.e-s.spE,1)} p.p. | Balanços ${fmt(be,0)} / ${fmt(bu,0)}`);
 const check=(ok,id,textId,value)=>{ $(id).textContent=ok?'✓':'◷';$(id).classList.toggle('passed',ok);$(textId).textContent=value;};
 check(nearE,'missionEIcon','missionEText',`ΔL: ${fmt(s.e-s.spE,1)} p.p. (meta ±3)`);
 check(balanced,'missionBIcon','missionBText',`E ${fmt(be,1)} / U ${fmt(bu,1)} m³/h`);
 check(margin,'missionUIcon','missionUText',`Nível U: ${fmt(s.u,1)}% · SP ${fmt(s.spR,0)}%`);
 $('missionScore').textContent=stable?`✓ Estabilização mantida por ${fmt(s.goalDuration,1)} min virtuais. Confira MVs e limitações antes de concluir.`:(balanced&&!nearE?'Equilíbrio de vazões não é controle do nível: a E-3907 está fora do SP.':'Meta: atender aos três critérios simultaneamente, sem falhas e com LIC-179 em AUTO, por 2 min virtuais.');
 const messages=[];
 messages.push([s.invalidSelector?'danger':constrained?'warn':'ok','FY-713',s.invalidSelector?'Falha simulada: FY ignora o menor sinal e passa MV do FIC; a limitação da U-35 pode deixar de atuar.':constrained?'Override ativo: o LIC-35056 fornece o menor sinal.':'FIC-730 selecionado; limitador U-35 não restringe a MV.']);
 messages.push(['ok','LIC-179B',`Hipótese ${s.signalB==='mv'?'MV do LIC-179':'PV do LT-179'}: entrada ${fmt(s.bPV,1)}%, SP ${fmt(s.spB,0)}%; SP enviado ao FIC ${fmt(s.spFlow,1)} m³/h.`]);
 if(balanced&&!nearE)messages.push(['warn','Equilíbrio ≠ controle',`Balanço próximo de zero, mas nível E desvia ${fmt(s.e-s.spE,1)} p.p. do SP. Cheque saturação e viabilidade.`]);
 messages.push([s.ltE!==s.e||s.ltU!==s.u?'danger':'ok','Medição de nível',s.ltE!==s.e||s.ltU!==s.u?'PV indicada diferente do inventário físico: falha simulada.':'Medições de nível coerentes com os inventários simulados.']);
 messages.push([s.fault.startsWith('ft-')?'danger':Math.abs(s.spFlow-s.ft)>9?'warn':'ok','Vazão',`FIC SP ${fmt(s.spFlow,1)} / FT PV ${fmt(s.ft,1)} m³/h; desvio ${fmt(s.spFlow-s.ft,1)}.`]);
 messages.push([Math.abs(be)>16?'warn':'ok','Balanço de fundo',`Produção ${fmt(s.feed,0)} − saídas ${fmt(s.q1+s.q2,1)} = ${be>0?'+':''}${fmt(be,1)} m³/h.`]);
 messages.push([s.u>90?'warn':'ok','Tambor U-35',`Nível real ${pct(s.u)}, indicado ${pct(s.ltU)}; variação ${fmt(s.lastTrendU,2)} p.p./min.`]);
 messages.push([s.fault!=='none'?'warn':'ok','Integridade',s.fault!=='none'?'Existe falha deliberada no laboratório. Não interpretar indicação isoladamente.':'Sem falhas impostas no cenário.']);
 $('diagnostics').innerHTML=messages.map(m=>`<div class="diagnostic-item"><i class="diagnostic-dot ${m[0]==='warn'?'warn':m[0]==='danger'?'danger':''}"></i><span><b>${m[1]}.</b> ${m[2]}</span></div>`).join('');
 $('goalState').textContent=stable?'✓ Controle estabilizado e balanços próximos de zero (metas didáticas).':s.invalidSelector?'⚠ Falha lógica do FY-713: a limitação da U-35 está comprometida.':concern?'⚠ Inventários em faixa extrema didática; não são alarmes reais.':balanced&&!nearE?'⚠ Vazões equilibradas, mas LIC-179 não controla no SP.':constrained?'⚠ Override U-35 ativo; o nível da E-3907 pode continuar subindo.':'◷ Observe vazões, nível versus SP e autoridade efetiva das válvulas.';
}
function graph(id,keys,rangeMax,option={}){
 const cv=$(id);if(!cv)return;
 const rect=cv.getBoundingClientRect();if(rect.width<15||rect.height<15)return;
 const dpr=Math.min(window.devicePixelRatio||1,2);
 if(cv.width!==Math.round(rect.width*dpr)||cv.height!==Math.round(rect.height*dpr)){cv.width=Math.round(rect.width*dpr);cv.height=Math.round(rect.height*dpr)}
 const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);
 const w=rect.width,h=rect.height,p={l:39,r:9,t:9,b:25};const cw=w-p.l-p.r,ch=h-p.t-p.b;
 c.clearRect(0,0,w,h);c.strokeStyle='#324b61';c.lineWidth=.8;c.font='11px system-ui';c.fillStyle='#b1c3d2';c.textAlign='right';
 for(let i=0;i<=4;i++){const y=p.t+ch*(i/4);c.beginPath();c.moveTo(p.l,y);c.lineTo(w-p.r,y);c.stroke();c.fillText(fmt(rangeMax*(1-i/4),0),p.l-6,y+3)}
 if(s.trace.length===0)return;
 const tmax=Math.max(15,s.time),tmin=tmax-15;
 c.textAlign='center';for(let i=0;i<=3;i++){const t=tmin+15*i/3;const x=p.l+cw*i/3;c.fillText(fmt(Math.max(0,t),0)+'m',x,h-7)}
 for(const key of keys){c.beginPath();c.lineWidth=2;c.strokeStyle=key.color;c.setLineDash(key.dashed?[6,5]:[]);
  let started=false;
  for(const pt of s.trace){if(pt.t<tmin-.1)continue;const x=p.l+cw*(pt.t-tmin)/15,y=p.t+ch*(1-clamp(pt[key.k]/rangeMax,0,1));if(!started){c.moveTo(x,y);started=true}else{c.lineTo(x,y)}}
  if(started)c.stroke();c.setLineDash([]);
 }
}
function drawAll(){graph('levelChart',[{k:'e',color:'#5bd6e8'},{k:'u',color:'#5ee0a3'},{k:'spE',color:'#b18ef2',dashed:true},{k:'spB',color:'#eaca79',dashed:true},{k:'spR',color:'#fa98aa',dashed:true}],100);graph('flowChart',[{k:'q1',color:'#5bd6e8'},{k:'q2',color:'#5ee0a3'},{k:'spq',color:'#eaca79',dashed:true},{k:'ft',color:'#fa98aa',dashed:true}],170);graph('selectorChart',[{k:'f',color:'#5bd6e8'},{k:'r',color:'#fa98aa'},{k:'sel',color:'#eaca79',dashed:true}],100)}
function loop(now){const dt=Math.min(Math.max((now-prevFrame)/1000,0),.16);prevFrame=now;
 if(!s.paused){const dm=dt*s.speed*.5;const steps=Math.max(1,Math.ceil(dm/.08));for(let i=0;i<steps;i++)tick(dm/steps);s.acc+=dt;s.renderAcc+=dt;if(s.acc>.25){record();s.acc=0}if(s.renderAcc>.24){updateDisplay();drawAll();s.renderAcc=0}}
 requestAnimationFrame(loop);
}
function toast(m){const e=$('toast');e.textContent=m;e.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.hidden=true,3200)}
const scen = {
 increase:{title:'Sobrecarga da desbutanizadora',explanation:'A produção do fundo aumenta para 142 m³/h. Observe a LCV-179 chegando ao limite, a reação do LIC-179B, o SP do FIC e a resposta do nível da E-3907. Investigue o balanço antes de interpretar uma MV de 100% como vazão garantida.',apply(){s.feed=142;s.e=67;s.head=1;s.demand=28;s.u=68}},
 receiver:{title:'Restrição de consumo U-35',explanation:'O consumo do tambor cai a 3 m³/h com nível inicial elevado (89%). Observe o LIC-35056 reduzir sua permissão quando o nível se aproxima do SP e o momento de transferência da seleção para o FY-713.',apply(){s.demand=3;s.u=89;s.e=65;s.feed=110}},
 conflict:{title:'Conflito simultâneo de níveis',explanation:'A E-3907 começa em 81% com produção alta; a U-35 começa em 91,5% e consumo reduzido. A retirada é desejada na origem mas restringida no destino. Compare MV FIC, MV LIC-35056, FY selecionado e balanço da E-3907.',apply(){s.feed=155;s.demand=5;s.e=81;s.u=91.5;s.intB=2;s.intF=0}},
 hydraulic:{title:'Baixa disponibilidade hidráulica',explanation:'O fator de capacidade hidráulica cai para 40%. O FIC aumenta a MV tentando compensar a vazão, mas pode não atingir o SP por saturação. A diferença de vazão pode aumentar o nível de fundo.',apply(){s.head=.4;s.feed=105;s.e=68}},
 ftfault:{title:'FT-730 medindo abaixo da vazão real',explanation:'O FT-730 indica 18 m³/h abaixo do fluxo real. O FIC reage ao valor falso: sua MV pode subir desnecessariamente. Compare FT medido, vazão real do gráfico e as variações dos dois níveis.',apply(){s.fault='ft-low';s.feed=95;s.e=63}},
 ltfault:{title:'LT-35056 medindo nível falso baixo',explanation:'O tambor inicia com nível real de 94%, porém LT-35056 indica 26 pontos percentuais menos. O controlador pode oferecer permissão excessiva ao ramal apesar da U-35 estar cheia. Esse é um risco de observabilidade, não um defeito matemático do seletor.',apply(){s.fault='ltU-low';s.u=94;s.e=74;s.feed=118;s.demand=12}},
 manual:{title:'FIC-730 retirado da cascata',explanation:'O FIC passa a MANUAL com MV 35%. Seu comando não corrige automaticamente desvios de FT. O FY-713 continua comparando esse comando com a permissão de LIC-35056.',apply(){s.modeFic='manual';s.manualFic=35;s.feed=122;s.e=66}},
 recovery:{title:'Restabelecimento das condições',explanation:'As falhas são retiradas, modos AUTO/CAS restaurados e as condições nominais do modelo reaplicadas. Os níveis físicos atuais são preservados para verificar o transitório de recuperação.',apply(){s.feed=67.2;s.demand=24;s.head=1;s.fault='none';s.mode179='auto';s.mode179b='auto';s.modeFic='cas';s.mode35056='auto'}},
 saturation:{title:'Equilíbrio de vazões sem controle no SP',explanation:'O nível físico inicia em 61%, muito acima do SP 30%. O LIC-179 está em saturação e o LIC-179B fica temporariamente em MANUAL com SP de 24 m³/h, de modo que as retiradas podem equilibrar a produção sem corrigir o desvio de nível. Diferencie balanço nulo de controle no SP.',apply(){s.signalB='mv';s.feed=96;s.demand=24;s.e=61;s.u=66;s.int1=20;s.intB=0;s.intF=0;s.v1=100;s.v2=24/90*100;s.mode179b='manual';s.manualB=24}},
 selectorFault:{title:'FY-713 fora da função de mínimo',explanation:'O limitador da U-35 solicita reduzir alimentação, mas o FY-713 em falha passa incorretamente a MV do FIC. Verifique subida de nível U-35 e perda da restrição.',apply(){s.fault='fy-bypass';s.e=70;s.u=92;s.feed=115;s.demand=3}}
};
document.querySelectorAll('[data-scenario]').forEach(b=>b.addEventListener('click',()=>{
 const key=b.dataset.scenario,item=scen[key];item.apply();s.paused=false;setPlayLabel();syncInputs();document.querySelectorAll('.scenario').forEach(el=>el.classList.remove('current'));b.classList.add('current');$('scenarioExplanation').innerHTML=`<b>${item.title}</b><p>${item.explanation}</p>`;updateDisplay();toast('Cenário aplicado: '+item.title);
}));
// Navigation to full sections; one open technical drawer at a time.
function openTab(id){document.querySelectorAll('.tab').forEach(t=>{const on=t.dataset.tab===id;t.classList.toggle('selected',on);t.setAttribute('aria-selected',String(on))});document.querySelectorAll('.tabpage').forEach(sec=>sec.classList.toggle('active',sec.id===id));window.scrollTo({top:document.querySelector('.tabs').getBoundingClientRect().top+window.scrollY-82,behavior:'smooth'});if(id==='laboratorio')setTimeout(drawAll,80)}
document.querySelectorAll('.tab,[data-tab-jump]').forEach(btn=>btn.addEventListener('click',()=>openTab(btn.dataset.tab||btn.dataset.tabJump)));
let lastFocus=null;
function openInfo(id){const info=D.instrument[id];if(!info)return;lastFocus=document.activeElement;$('drawerTitle').textContent=info.title;$('drawerContent').innerHTML=info.html;$('infoDrawer').hidden=false;$('infoShade').hidden=false;document.body.style.overflow='hidden';$('closeDrawer').focus();}
function closeInfo(){$('infoDrawer').hidden=true;$('infoShade').hidden=true;document.body.style.overflow='';if(lastFocus&&typeof lastFocus.focus==='function')lastFocus.focus()}
document.querySelectorAll('[data-info]').forEach(el=>{el.addEventListener('click',()=>openInfo(el.dataset.info));el.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();openInfo(el.dataset.info)}})});
$('closeDrawer').addEventListener('click',closeInfo);$('infoShade').addEventListener('click',closeInfo);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('infoDrawer').hidden)closeInfo()});
function renderContent(container,data){$(container).innerHTML=data.map(({title,html})=>`<article class="panel article-block"><h3>${title}</h3>${html}</article>`).join('')}
renderContent('strategyContent',D.chapters);renderContent('cicContent',D.cic);
$('referenceContent').innerHTML=`<article class="panel article-block"><h3>Instrumentos e informações para consulta</h3><p>Selecione a lâmpada de cada instrumento no diagrama, ou uma das entradas a seguir, para abrir o painel técnico integral.</p><div class="hero-tags">${Object.keys(D.instrument).map(tag=>`<button type="button" class="btn outline" data-info="${tag}">💡 ${tag}</button>`).join('')}</div></article>`+D.chapters.map(({title,html})=>`<details><summary>${title}</summary><div class="detailbody">${html}</div></details>`).join('')+`<article class="panel article-block"><h3>Nota metodológica e restrições</h3><p>Este Concept transcreve a função de cada instrumento visível, a estrutura de cascata e a seleção de menor sinal, acrescida de um sistema dinâmico fictício. Não contém números operacionais de segurança não fornecidos na figura. A lógica entre LIC-179 e LIC-179B depende de confirmação e foi expressamente identificada como premissa.</p><p>A seção “Estratégia” apresenta todos os capítulos; “Conteúdo integral” disponibiliza-os novamente sob demanda, sem criar duplicação de painéis técnicos no fluxo principal. A página mantém apenas um painel de lâmpada aberto por vez.</p></article>`;
document.querySelectorAll('#referenceContent [data-info]').forEach(el=>el.addEventListener('click',()=>openInfo(el.dataset.info)));
// Teste de retenção, embaralhamento da ordem de perguntas E de alternativas.
function shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}
let qOrder=[],qIndex=0,qSelected={};
function startQuiz(){qOrder=shuffle(D.quizzes.map((q,idx)=>({id:idx,...q,options:shuffle(q.a.map((text,i)=>({text,correct:i===q.correct}))) })));qIndex=0;qSelected={};renderQuiz()}
function renderQuiz(){const q=qOrder[qIndex],selection=qSelected[q.id];const done=selection!==undefined;let score=0;for(const item of qOrder){const idx=qSelected[item.id];if(idx!==undefined&&item.options[idx].correct)score++}
 $('quizProgress').textContent=`Questão ${qIndex+1} / ${qOrder.length}`;$('quizScore').textContent=`${score} acerto${score===1?'':'s'}`;$('quizBar').style.width=(100*(qIndex+1)/qOrder.length)+'%';$('quizType').textContent=q.kind;$('quizQuestion').textContent=q.q;
 $('quizAnswers').innerHTML=q.options.map((o,i)=>`<button class="answer ${done&&o.correct?'correct':done&&i===selection&&!o.correct?'wrong':''}" data-answer="${i}" ${done?'disabled':''}><span class="letter">${String.fromCharCode(65+i)}</span><span>${o.text}</span></button>`).join('');
 if(done){const hit=q.options[selection].correct;$('quizFeedback').hidden=false;$('quizFeedback').innerHTML=`<strong>${hit?'✓ Correto':'✕ Revisão necessária'}</strong>${q.why}`}
 else{$('quizFeedback').hidden=true;$('quizFeedback').textContent=''}
 $('quizPrev').disabled=qIndex===0;$('quizNext').textContent=qIndex===qOrder.length-1?'Reiniciar avaliação ↻':'Próxima →';
 document.querySelectorAll('[data-answer]').forEach(el=>el.addEventListener('click',()=>{qSelected[q.id]=Number(el.dataset.answer);renderQuiz()}));
}
$('quizPrev').addEventListener('click',()=>{if(qIndex>0){qIndex--;renderQuiz()}});
$('quizNext').addEventListener('click',()=>{if(qIndex<qOrder.length-1){qIndex++;renderQuiz()}else{startQuiz();toast('Novo sorteio de alternativas e perguntas.')}});
$('restartQuiz').addEventListener('click',()=>{startQuiz();toast('Avaliação reiniciada e embaralhada.')});
$('themeBtn').addEventListener('click',()=>document.body.classList.toggle('light'));
$('installHelpBtn').addEventListener('click',()=>toast('Instalação: publique por HTTPS, abra no Chrome/Edge ou Safari e use Instalar app / Adicionar à Tela de Início. O navegador pode não oferecer aviso automático.'));

// PWA: registration is secure-origin only; assets served relative to GitHub Pages repo.
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('installBtn').hidden=false});
$('installBtn').addEventListener('click',async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('installBtn').hidden=true}else{toast('No navegador, use o menu “Adicionar à tela inicial” ou “Instalar app”.')}});
window.addEventListener('appinstalled',()=>{$('installBtn').hidden=true;toast('Aplicativo instalado.')});
if('serviceWorker' in navigator&&['https:','http:'].includes(location.protocol)){
 window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(reg=>{
  const updateBtn=$('updateBtn');
  const showUpdate=()=>{updateBtn.hidden=false;toast('Nova versão da PWA disponível; toque em Atualizar.')};
  if(reg.waiting&&navigator.serviceWorker.controller)showUpdate();
  reg.addEventListener('updatefound',()=>{const worker=reg.installing;if(worker)worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)showUpdate()})});
  updateBtn.addEventListener('click',()=>{if(reg.waiting){reg.waiting.postMessage({type:'SKIP_WAITING'})}else{location.reload()}});
  let refreshed=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!refreshed){refreshed=true;location.reload()}});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')reg.update().catch(()=>{})});
 }).catch(err=>console.warn('PWA indisponível:',err)));
}
window.addEventListener('resize',()=>drawAll());
startQuiz();syncInputs();record(true);updateDisplay();drawAll();requestAnimationFrame(loop);
})();
