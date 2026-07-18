const DATA = {
  hinane: {
    label: "🌸 ひなね", goal: 10,
    fixed: [
      ["📚","学校の夏休みの宿題をする","まいにち"],
      ["🧺","洗濯物を取り入れる","まいにち"],
      ["🪥","はみがきをする","まいにち"]
    ],
    random: [
      ["📖","本を10分読む","べんきょう"],["✏️","ひらがなを5もじ書く","べんきょう"],
      ["🔢","たしざんを5もんとく","べんきょう"],["🧹","へやを5分そうじする","おてつだい"],
      ["👕","洗濯物をたたむ","おてつだい"],["🍚","ごはんをならべる","おてつだい"],
      ["🥒","料理のおてつだいをする","おてつだい"],["🧸","おもちゃをかたづける","おてつだい"],
      ["🌱","花や草に水をあげる","おてつだい"],["🎨","絵を1まいかく","つくる"],
      ["🧩","パズルをする","あそび"],["🧱","ブロックで何かをつくる","あそび"],
      ["⚽","ボールで10分あそぶ","からだ"],["🤸","ストレッチをする","からだ"],
      ["🕺","すきな歌でおどる","からだ"],["🚶","外を15分あるく","おでかけ"],
      ["🌿","葉っぱを3しゅるい見つける","たんけん"],["🐜","虫を1ぴき見つける","たんけん"],
      ["☁️","空を見て天気を話す","たんけん"],["💌","だれかにありがとうを言う","やさしいこと"],
      ["🧡","妹にやさしくする","やさしいこと"],["🎤","歌を1きょく歌う","あそび"],
      ["🧠","しりとりを10こ続ける","ことば"],["📷","すきなものの写真をとる","あそび"],
      ["🌙","明日のじゅんびをする","せいかつ"],["🫗","じぶんで水を入れる","せいかつ"]
    ]
  },
  otone: {
    label: "🫧 おとね", goal: 5,
    fixed: [
      ["🪥","はみがきをする","まいにち"],
      ["🧸","おもちゃをかたづける","まいにち"]
    ],
    random: [
      ["📖","えほんを1さつ見る","ことば"],["🎨","すきないろで絵をかく","つくる"],
      ["🖍️","ぬりえをする","つくる"],["🧱","ブロックをつむ","あそび"],
      ["🎵","すきな歌をうたう","あそび"],["💃","歌にあわせておどる","からだ"],
      ["🐰","うさぎジャンプを5かいする","からだ"],["👏","手を10かいたたく","からだ"],
      ["🌼","お花を1つ見つける","たんけん"],["🐜","虫を1ぴき見つける","たんけん"],
      ["🔴","あかいものを3こさがす","たんけん"],["⭕","まるいものを3こさがす","たんけん"],
      ["🍙","おにぎりをにぎる","りょうり"],["🥄","スプーンをならべる","おてつだい"],
      ["🌱","みずやりをする","おてつだい"],["💛","おねえちゃんにありがとうを言う","やさしいこと"],
      ["🤗","かぞくにぎゅっとする","やさしいこと"],["👋","げんきにあいさつする","やさしいこと"],
      ["⚽","ボールをころがす","からだ"],["🐶","どうぶつのまねをする","あそび"]
    ]
  },
  suzune: {
    label: "👶 すずね", goal: 1, fixed: [],
    random: [
      ["😊","にこっと笑った！","すずねミッション"],["🦶","足をパタパタした！","すずねミッション"],
      ["🧸","おもちゃで遊んだ！","すずねミッション"],["👀","おねえちゃんを見た！","すずねミッション"],
      ["🎵","歌を聞いた！","すずねミッション"],["🙌","手をのばした！","すずねミッション"],
      ["😴","ぐっすりねた！","すずねミッション"],["🤗","だっこしてもらった！","すずねミッション"],
      ["🗣️","声を出した！","すずねミッション"],["🍼","ミルクを飲んだ！","すずねミッション"]
    ]
  }
};

const $ = id => document.getElementById(id);
const now = new Date();
const dateKey = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
$("dateBox").innerHTML = `${now.getMonth()+1}がつ<br>${now.getDate()}にち`;

let current = localStorage.getItem("summerCurrentChild") || "hinane";
let soundOn = localStorage.getItem("summerSound") !== "off";
let familyCelebrated = localStorage.getItem(`familyCelebrated_${dateKey}`) === "yes";

const taskKey = child => `summerTasks_${child}_${dateKey}`;
const doneKey = child => `summerDone_${child}_${dateKey}`;

function shuffled(arr){
  const copy = [...arr];
  for(let i=copy.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}
function createTasks(child){
  const d=DATA[child];
  const numberNeeded=d.goal-d.fixed.length;
  return [...d.fixed,...shuffled(d.random).slice(0,numberNeeded)]
    .map((item,index)=>({id:index,emoji:item[0],text:item[1],kind:item[2]}));
}
function getTasks(child){
  const saved=localStorage.getItem(taskKey(child));
  if(saved) return JSON.parse(saved);
  const tasks=createTasks(child);
  localStorage.setItem(taskKey(child),JSON.stringify(tasks));
  return tasks;
}
function getDone(child){
  return new Set(JSON.parse(localStorage.getItem(doneKey(child))||"[]"));
}
function saveDone(child,set){
  localStorage.setItem(doneKey(child),JSON.stringify([...set]));
}

function beep(type="tap"){
  if(!soundOn) return;
  try{
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    const ctx=new AudioCtx();
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type="sine";
    osc.frequency.value=type==="clear"?740:520;
    gain.gain.setValueAtTime(.001,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.16,ctx.currentTime+.01);
    gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+(type==="clear"?.42:.12));
    osc.start();
    osc.stop(ctx.currentTime+(type==="clear"?.45:.14));
  }catch(e){}
}

function progressFor(child){
  return Math.min(getDone(child).size,DATA[child].goal);
}
function updateProgress(){
  let total=0;
  for(const child of ["hinane","otone","suzune"]){
    const value=progressFor(child);
    const goal=DATA[child].goal;
    total+=value;
    $(`${child}Num`).textContent=`${value} / ${goal}`;
    $(`${child}Fill`).style.width=`${value/goal*100}%`;
  }
  $("familyBox").innerHTML=`👨‍👩‍👧‍👧 かぞくコンプリート <strong>${total} / 16</strong>`;
  if(total===16){
    $("familyBox").innerHTML="🎆 かぞくコンプリート！ みんなクリア！";
    if(!familyCelebrated){
      familyCelebrated=true;
      localStorage.setItem(`familyCelebrated_${dateKey}`,"yes");
      beep("clear");
      confettiBurst();
    }
  }
}
function render(){
  document.querySelectorAll(".child-summary").forEach(btn=>{
    btn.classList.toggle("active",btn.dataset.child===current);
  });
  $("sectionTitle").textContent=`${DATA[current].label}の ミッション`;
  const tasks=getTasks(current);
  const done=getDone(current);
  $("todayCount").textContent=`${done.size}こ できた`;

  const grid=$("grid");
  grid.innerHTML="";
  tasks.forEach(task=>{
    const card=document.createElement("button");
    card.className=`mission-card${done.has(task.id)?" done":""}`;
    card.innerHTML=`
      <span class="icon">${task.emoji}</span>
      <span>
        <span class="kind">${task.kind}</span>
        <span class="task-text">${task.text}</span>
      </span>
      <span class="check">${done.has(task.id)?"✓":""}</span>`;
    card.addEventListener("click",()=>{
      const wasDone=done.has(task.id);
      wasDone ? done.delete(task.id) : done.add(task.id);
      saveDone(current,done);
      if(!wasDone) beep(done.size===DATA[current].goal?"clear":"tap");
      card.classList.add("bump");
      setTimeout(render,120);
    });
    grid.appendChild(card);
  });

  const clear=done.size>=DATA[current].goal;
  $("goal").className=`clear-banner${clear?" show":""}`;
  $("goal").textContent=current==="suzune"
    ?"👶 すずねミッションクリア！ きょうもすくすく！"
    :`${DATA[current].label} きょうのミッションクリア！`;
  updateProgress();
}
document.querySelectorAll(".child-summary").forEach(btn=>{
  btn.addEventListener("click",()=>{
    current=btn.dataset.child;
    localStorage.setItem("summerCurrentChild",current);
    render();
  });
});
$("reroll").addEventListener("click",()=>{
  if(confirm("この子のきょうのミッションを選びなおしますか？")){
    localStorage.setItem(taskKey(current),JSON.stringify(createTasks(current)));
    localStorage.removeItem(doneKey(current));
    localStorage.removeItem(`familyCelebrated_${dateKey}`);
    familyCelebrated=false;
    render();
  }
});
$("reset").addEventListener("click",()=>{
  if(confirm("この子のチェックを全部もどしますか？")){
    localStorage.removeItem(doneKey(current));
    localStorage.removeItem(`familyCelebrated_${dateKey}`);
    familyCelebrated=false;
    render();
  }
});
$("soundToggle").addEventListener("click",()=>{
  soundOn=!soundOn;
  localStorage.setItem("summerSound",soundOn?"on":"off");
  $("soundToggle").textContent=soundOn?"🔊 おと ON":"🔇 おと OFF";
  if(soundOn) beep();
});
$("soundToggle").textContent=soundOn?"🔊 おと ON":"🔇 おと OFF";

$("installHelp").addEventListener("click",()=>$("helpDialog").showModal());

function confettiBurst(){
  const canvas=$("confetti");
  const ctx=canvas.getContext("2d");
  const dpr=window.devicePixelRatio||1;
  canvas.width=innerWidth*dpr; canvas.height=innerHeight*dpr;
  ctx.scale(dpr,dpr);
  const bits=Array.from({length:150},()=>({
    x:innerWidth/2,y:innerHeight*.25,
    vx:(Math.random()-.5)*13,vy:Math.random()*-10-4,
    g:.24+Math.random()*.12,r:4+Math.random()*5,
    rot:Math.random()*Math.PI,color:["#ff8068","#55a8e8","#ffd768","#67c77a","#b487e8"][Math.floor(Math.random()*5)]
  }));
  let frame=0;
  function draw(){
    ctx.clearRect(0,0,innerWidth,innerHeight);
    bits.forEach(p=>{
      p.vy+=p.g;p.x+=p.vx;p.y+=p.vy;p.rot+=.12;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);
      ctx.fillStyle=p.color;ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r*.65);ctx.restore();
    });
    frame++;
    if(frame<180) requestAnimationFrame(draw); else ctx.clearRect(0,0,innerWidth,innerHeight);
  }
  draw();
}

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js"));
}
render();
