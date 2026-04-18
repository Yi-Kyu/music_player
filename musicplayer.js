const audio=new Audio();
let tracks=[],currentIndex=0,isPlaying=false,shuffle=false,repeat=false,volume=0.7;
let analyser,source,audioCtx;

const btnPlay=document.getElementById('btn-play');
const btnPrev=document.getElementById('btn-prev');
const btnNext=document.getElementById('btn-next');
const btnShuffle=document.getElementById('btn-shuffle');
const btnRepeat=document.getElementById('btn-repeat');
const btnVol=document.getElementById('btn-vol');
const btnCola=document.getElementById('btn-cola');
const btnMin=document.getElementById('btn-min');
const btnExpand=document.getElementById('btn-expand');
const progreso=document.getElementById('progreso-actual');
const barraProgreso=document.getElementById('barra-progreso');
const tiempoActual=document.getElementById('tiempo-actual');
const tiempoTotal=document.getElementById('tiempo-total');
const nivelVol=document.getElementById('nivel-volumen');
const volLabel=document.getElementById('vol-label');
const volBarContainer=document.getElementById('vol-bar-container');
const fileInput=document.getElementById('file-input');
const colaContainer=document.getElementById('cola-container');
const colaLista=document.getElementById('cola-lista');
const dropZone=document.getElementById('drop-zone');
const canvas=document.getElementById('visualizador');
const ctx2=canvas.getContext('2d');
const minibar=document.getElementById('minibar');
const reproductor=document.getElementById('reproductor');
const miniTitle=document.getElementById('mini-title');
const miniFill=document.getElementById('mini-fill');
const miniPlay=document.getElementById('mini-play');
const miniPrev=document.getElementById('mini-prev');
const miniNext=document.getElementById('mini-next');
const miniVis=document.getElementById('mini-vis');
const miniCtx=miniVis.getContext('2d');

audio.volume=volume;

function formatTime(s){if(isNaN(s))return'0:00';const m=Math.floor(s/60),sec=Math.floor(s%60);return m+':'+(sec<10?'0':'')+sec}

function loadTrack(i){
  if(!tracks.length)return;
  currentIndex=i;
  const t=tracks[i];
  audio.src=t.url;
  document.getElementById('titulo-cancion').textContent=t.name;
  document.getElementById('artista-cancion').textContent=t.artist||'Unknown';
  miniTitle.textContent=t.name;
  audio.load();
  if(isPlaying)audio.play();
  renderQueue();
}

function addFiles(files){
  Array.from(files).forEach(f=>{
    tracks.push({url:URL.createObjectURL(f),name:f.name.replace(/\.[^.]+$/,''),artist:'Local'});
  });
  if(tracks.length===1||!isPlaying)loadTrack(tracks.length-1);
  else renderQueue();
}

fileInput.addEventListener('change',e=>addFiles(e.target.files));
dropZone.addEventListener('dragover',e=>{e.preventDefault();dropZone.classList.add('drag-over')});
dropZone.addEventListener('dragleave',()=>dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop',e=>{e.preventDefault();dropZone.classList.remove('drag-over');addFiles(e.dataTransfer.files)});

function setPlayState(playing){
  isPlaying=playing;
  btnPlay.innerHTML=playing?'&#9646;&#9646;':'&#9654;';
  miniPlay.innerHTML=playing?'&#9646;&#9646;':'&#9654;';
}

function togglePlay(){
  if(!tracks.length)return;
  if(!audioCtx)initVisualizer();
  if(isPlaying){audio.pause();setPlayState(false)}
  else{audio.play();setPlayState(true)}
}

btnPlay.addEventListener('click',togglePlay);
miniPlay.addEventListener('click',togglePlay);

function nextTrack(){
  if(!tracks.length)return;
  let i;
  if(shuffle)i=Math.floor(Math.random()*tracks.length);
  else if(repeat)i=currentIndex;
  else i=(currentIndex+1)%tracks.length;
  loadTrack(i);
  if(isPlaying)audio.play();
}
function prevTrack(){
  if(!tracks.length)return;
  const i=currentIndex>0?currentIndex-1:tracks.length-1;
  loadTrack(i);if(isPlaying)audio.play();
}

btnNext.addEventListener('click',nextTrack);
btnPrev.addEventListener('click',prevTrack);
miniNext.addEventListener('click',nextTrack);
miniPrev.addEventListener('click',prevTrack);
audio.addEventListener('ended',nextTrack);

audio.addEventListener('timeupdate',()=>{
  if(!audio.duration)return;
  const pct=(audio.currentTime/audio.duration)*100;
  progreso.style.width=pct+'%';
  miniFill.style.width=pct+'%';
  tiempoActual.textContent=formatTime(audio.currentTime);
  tiempoTotal.textContent=formatTime(audio.duration);
});

barraProgreso.addEventListener('click',e=>{
  const rect=barraProgreso.getBoundingClientRect();
  audio.currentTime=((e.clientX-rect.left)/rect.width)*audio.duration;
});

btnShuffle.addEventListener('click',()=>{shuffle=!shuffle;btnShuffle.classList.toggle('active',shuffle)});
btnRepeat.addEventListener('click',()=>{repeat=!repeat;btnRepeat.classList.toggle('active',repeat)});

volBarContainer.addEventListener('click',e=>{
  const rect=volBarContainer.getBoundingClientRect();
  volume=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));
  audio.volume=volume;
  nivelVol.style.width=(volume*100)+'%';
  volLabel.textContent=Math.round(volume*100)+'%';
  updateVolIcon();
});
btnVol.addEventListener('click',()=>{
  if(audio.volume>0){volume=0;audio.volume=0;nivelVol.style.width='0%';volLabel.textContent='0%'}
  else{volume=0.7;audio.volume=0.7;nivelVol.style.width='70%';volLabel.textContent='70%'}
  updateVolIcon();
});
function updateVolIcon(){
  if(volume===0)btnVol.innerHTML='&#128264;';
  else if(volume<0.5)btnVol.innerHTML='&#128265;';
  else btnVol.innerHTML='&#128266;';
}

btnCola.addEventListener('click',()=>colaContainer.classList.toggle('visible'));

/* MINIMIZE → show minibar, hide full player */
btnMin.addEventListener('click',()=>{
  reproductor.style.display='none';
  minibar.classList.add('visible');
});

/* EXPAND → hide minibar, show full player */
btnExpand.addEventListener('click',()=>{
  minibar.classList.remove('visible');
  reproductor.style.display='block';
});

function renderQueue(){
  colaLista.innerHTML='';
  tracks.forEach((t,i)=>{
    const li=document.createElement('li');
    li.className='cola-item'+(i===currentIndex?' active-track':'');
    li.innerHTML=`<span class="cola-item-num">${i+1}</span>
      <div class="cola-item-info">
        <div class="cola-item-title">${t.name}</div>
        <div class="cola-item-artist">${t.artist||'Unknown'}</div>
      </div>`;
    li.addEventListener('click',()=>{loadTrack(i);if(isPlaying)audio.play()});
    colaLista.appendChild(li);
  });
}

function initVisualizer(){
  audioCtx=new(window.AudioContext||window.webkitAudioContext)();
  analyser=audioCtx.createAnalyser();
  analyser.fftSize=64;
  source=audioCtx.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  drawVisualizer();
}

function drawVisualizer(){
  requestAnimationFrame(drawVisualizer);
  const buf=new Uint8Array(analyser?analyser.frequencyBinCount:32);
  if(analyser)analyser.getByteFrequencyData(buf);
  const W=canvas.width,H=canvas.height;
  ctx2.clearRect(0,0,W,H);
  ctx2.fillStyle='rgba(10,10,10,0.9)';
  ctx2.beginPath();ctx2.arc(W/2,H/2,W/2,0,Math.PI*2);ctx2.fill();
  const bars=buf.length,angleStep=(Math.PI*2)/bars,innerR=28;
  buf.forEach((val,i)=>{
    const angle=i*angleStep-Math.PI/2;
    const barH=(val/255)*(W/2-innerR-4);
    const alpha=0.4+0.6*(val/255);
    ctx2.strokeStyle=`rgba(255,${Math.floor(val*0.2)},0,${alpha})`;
    ctx2.lineWidth=2.5;ctx2.beginPath();
    ctx2.moveTo(W/2+Math.cos(angle)*innerR,H/2+Math.sin(angle)*innerR);
    ctx2.lineTo(W/2+Math.cos(angle)*(innerR+barH),H/2+Math.sin(angle)*(innerR+barH));
    ctx2.stroke();
  });
  ctx2.fillStyle='rgba(255,0,0,0.12)';
  ctx2.beginPath();ctx2.arc(W/2,H/2,innerR-2,0,Math.PI*2);ctx2.fill();
  ctx2.fillStyle='rgba(255,255,255,0.65)';
  ctx2.font='bold 10px monospace';ctx2.textAlign='center';ctx2.textBaseline='middle';
  ctx2.fillText(isPlaying?'LIVE':'---',W/2,H/2);

  /* mini visualizer */
  const mW=miniVis.width,mH=miniVis.height,mR=mW/2-1;
  miniCtx.clearRect(0,0,mW,mH);
  miniCtx.fillStyle='rgba(10,10,10,0.9)';
  miniCtx.beginPath();miniCtx.arc(mW/2,mH/2,mR,0,Math.PI*2);miniCtx.fill();
  const mBars=Math.min(buf.length,16),mAngle=(Math.PI*2)/mBars,mInner=6;
  for(let i=0;i<mBars;i++){
    const val=buf[Math.floor(i*(buf.length/mBars))];
    const angle=i*mAngle-Math.PI/2;
    const bH=(val/255)*(mR-mInner-1);
    miniCtx.strokeStyle=`rgba(255,0,0,${0.4+0.5*(val/255)})`;
    miniCtx.lineWidth=1.5;miniCtx.beginPath();
    miniCtx.moveTo(mW/2+Math.cos(angle)*mInner,mH/2+Math.sin(angle)*mInner);
    miniCtx.lineTo(mW/2+Math.cos(angle)*(mInner+bH),mH/2+Math.sin(angle)*(mInner+bH));
    miniCtx.stroke();
  }
}

(function idleLoop(){
  if(!analyser){
    const W=canvas.width,H=canvas.height;
    ctx2.clearRect(0,0,W,H);
    ctx2.fillStyle='rgba(10,10,10,0.9)';
    ctx2.beginPath();ctx2.arc(W/2,H/2,W/2,0,Math.PI*2);ctx2.fill();
    for(let i=0;i<32;i++){
      const angle=(i/32)*Math.PI*2-Math.PI/2,innerR=28,bH=3+Math.random()*3;
      ctx2.strokeStyle='rgba(255,0,0,0.2)';ctx2.lineWidth=2;ctx2.beginPath();
      ctx2.moveTo(W/2+Math.cos(angle)*innerR,H/2+Math.sin(angle)*innerR);
      ctx2.lineTo(W/2+Math.cos(angle)*(innerR+bH),H/2+Math.sin(angle)*(innerR+bH));
      ctx2.stroke();
    }
    ctx2.fillStyle='rgba(255,255,255,0.35)';
    ctx2.font='bold 10px monospace';ctx2.textAlign='center';ctx2.textBaseline='middle';
    ctx2.fillText('---',W/2,H/2);
    requestAnimationFrame(idleLoop);
  }
})();
