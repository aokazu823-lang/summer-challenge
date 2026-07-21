
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2,"0");
const now = new Date();
const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const TODAY = dateKey(now);
const read = (k,f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
const write = (k,v) => localStorage.setItem(k, JSON.stringify(v));
const shuffle = a => { const x=[...a]; for(let i=x.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [x[i],x[j]]=[x[j],x[i]]; } return x; };

let currentChild = localStorage.getItem("sc22_current_child") || "hinane";
let calendarCursor = new Date(now.getFullYear(), now.getMonth(), 1);

const childKey = (child, kind, day=TODAY) => `sc22_${kind}_${day}_${child}`;
const bonusKey = (day=TODAY) => `sc22_bonus_${day}`;
const awardsKey = (day=TODAY) => `sc22_awards_${day}`;
const sisterKey = (day=TODAY) => `sc22_sister_${day}`;
const sisterDoneKey = (day=TODAY) => `sc22_sister_done_${day}`;
const walletKey = child => `sc22_wallet_${child}`;
const walletAwardedKey = (child,day=TODAY) => `sc22_wallet_awarded_${day}_${child}`;
const stampsKey = "sc22_stamps";
const historyKey = "sc22_history";

function makeTasks(child){
  const c = APP_DATA.children[child];
  return [...c.fixed, ...shuffle(c.random).slice(0, c.goal-c.fixed.length)]
    .map((x,i)=>({id:`t${i}`,emoji:x[0],text:x[1],kind:x[2]}));
}
function tasks(child,day=TODAY){
  let value = read(childKey(child,"tasks",day), null);
  if(!value && day===TODAY){ value=makeTasks(child); write(childKey(child,"tasks",day),value); }
  return value || [];
}
function doneSet(child,day=TODAY){ return new Set(read(childKey(child,"done",day),[])); }
function setDoneSet(child,set,day=TODAY){ write(childKey(child,"done",day),[...set]); }
function progress(child,day=TODAY){ return doneSet(child,day).size; }
function familyTotal(day=TODAY){ return ["hinane","otone","suzune"].reduce((s,c)=>s+progress(c,day),0); }
function bonuses(day=TODAY){ return read(bonusKey(day),[]); }
function awards(day=TODAY){ return read(awardsKey(day),[]); }

function sisterMission(day=TODAY){
  let value = read(sisterKey(day),null);
  if(!value && day===TODAY){
    const pick = APP_DATA.sisterMissions[Math.floor(Math.random()*APP_DATA.sisterMissions.length)];
    value = {emoji:pick[0], text:pick[1]};
    write(sisterKey(day),value);
  }
  return value;
}
function sisterDone(day=TODAY){ return read(sisterDoneKey(day),false); }

function wallet(child){ return read(walletKey(child),0); }
function setWallet(child,value){ write(walletKey(child),Math.max(0,value)); }

function collectedStamps(){ return read(stampsKey,[]); }
function awardRandomStamp(){
  const have = new Set(collectedStamps());
  const available = APP_DATA.stamps.map((_,i)=>i).filter(i=>!have.has(i));
  const pool = available.length ? available : APP_DATA.stamps.map((_,i)=>i);
  const index = pool[Math.floor(Math.random()*pool.length)];
  if(!have.has(index)){ have.add(index); write(stampsKey,[...have]); }
  showStampPopup(index);
}
function showStampPopup(index){
  const stamp=APP_DATA.stamps[index];
  $("stampPopupEmoji").textContent=stamp[0];
  $("stampPopupName").textContent=stamp[1];
  $("stampPopup").classList.remove("hidden");
}

function checkWalletReward(child){
  if(child==="suzune") return;
  const goal=APP_DATA.children[child].goal;
  if(progress(child)===goal && !read(walletAwardedKey(child),false)){
    setWallet(child,wallet(child)+10);
    write(walletAwardedKey(child),true);
    awardRandomStamp();
  }
}

function saveHistory(){
  const h=read(historyKey,{});
  h[TODAY]={
    children:{},
    sister:{mission:sisterMission(),done:sisterDone()},
    bonuses:bonuses(),
    awards:awards()
  };
  for(const child of ["hinane","otone","suzune"]){
    h[TODAY].children[child]={
      done:progress(child),
      goal:APP_DATA.children[child].goal,
      tasks:tasks(child),
      doneIds:[...doneSet(child)]
    };
  }
  write(historyKey,h);
}

function render(){
  $("todayText").textContent=`${now.getMonth()+1}がつ ${now.getDate()}にち`;
  $("th").textContent=`${progress("hinane")}/10`;
  $("to").textContent=`${progress("otone")}/6`;
  $("ts").textContent=`${progress("suzune")}/4`;
  $("walletHinane").textContent=`${wallet("hinane")}えん`;
  $("walletOtone").textContent=`${wallet("otone")}えん`;

  const total=familyTotal();
  $("familyCount").textContent=`${total} / 20`;
  $("familyFill").style.width=`${Math.min(100,total/20*100)}%`;

  document.querySelectorAll(".tab[data-child]").forEach(b=>b.classList.toggle("active",b.dataset.child===currentChild));

  const c=APP_DATA.children[currentChild];
  $("childTitle").textContent=`${c.emoji} ${c.name}の ミッション`;
  $("badge").textContent=`${progress(currentChild)} / ${c.goal}`;

  const d=doneSet(currentChild);
  $("missions").innerHTML="";
  tasks(currentChild).forEach(task=>{
    const b=document.createElement("button");
    b.className=`mission ${currentChild} ${d.has(task.id)?"done":""}`;
    b.innerHTML=`<span class="e">${task.emoji}</span><span><span class="kind">${task.kind}</span><span class="txt">${task.text}</span></span><span class="check">${d.has(task.id)?"✓":""}</span>`;
    b.onclick=()=>{
      const beforeFamily=familyTotal();
      const beforeChild=progress(currentChild);
      const set=doneSet(currentChild);
      set.has(task.id)?set.delete(task.id):set.add(task.id);
      setDoneSet(currentChild,set);
      checkWalletReward(currentChild);
      saveHistory();
      if(beforeFamily<20 && familyTotal()===20){ burst(); awardRandomStamp(); }
      else if(beforeChild<APP_DATA.children[currentChild].goal && progress(currentChild)===APP_DATA.children[currentChild].goal){ burst(); }
      render();
    };
    $("missions").appendChild(b);
  });

  const sm=sisterMission();
  const sd=sisterDone();
  $("sisterMission").innerHTML=`<div class="row"><strong>${sm.emoji} ${sm.text}</strong><button class="small ${sd?"done":""}" id="sisterDoneBtn">${sd?"できた！":"できた"}</button></div>`;
  $("sisterDoneBtn").onclick=()=>{
    const next=!sisterDone();
    write(sisterDoneKey(),next);
    if(next) awardRandomStamp();
    saveHistory();
    render();
  };

  const childBonuses=bonuses().filter(x=>x.child===currentChild);
  $("bonusBox").classList.toggle("hidden",!childBonuses.length);
  $("bonusList").innerHTML="";
  childBonuses.forEach(x=>{
    const row=document.createElement("div"); row.className="row";
    row.innerHTML=`<strong>${x.done?"✅":"🌟"} ${x.text}</strong>`;
    const btn=document.createElement("button"); btn.className=`small ${x.done?"done":""}`; btn.textContent=x.done?"できた！":"できた";
    btn.onclick=()=>{ const all=bonuses(); const item=all.find(v=>v.id===x.id); if(item)item.done=!item.done; write(bonusKey(),all); saveHistory(); render(); };
    row.appendChild(btn); $("bonusList").appendChild(row);
  });

  const childAwards=awards().filter(x=>x.child===currentChild);
  $("awardBox").classList.toggle("hidden",!childAwards.length);
  $("awardList").innerHTML=childAwards.map(x=>`<div class="row"><strong>🏅 ${x.text}</strong></div>`).join("");

  renderSummary();
  saveHistory();
}

function showView(view){
  ["missionView","calendarView","stampView"].forEach(id=>$(id).classList.add("hidden"));
  $(view).classList.remove("hidden");
}

document.querySelectorAll(".tab[data-child]").forEach(btn=>{
  btn.onclick=()=>{
    currentChild=btn.dataset.child;
    localStorage.setItem("sc22_current_child",currentChild);
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    showView("missionView");
    render();
  };
});

$("calendarTab").onclick=()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  $("calendarTab").classList.add("active");
  showView("calendarView");
  renderCalendar();
};

$("stampTab").onclick=()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  $("stampTab").classList.add("active");
  showView("stampView");
  renderStamps();
};

$("reroll").onclick=()=>{
  if(confirm("きょうの ミッションを えらびなおしますか？")){
    write(childKey(currentChild,"tasks"),makeTasks(currentChild));
    localStorage.removeItem(childKey(currentChild,"done"));
    saveHistory(); render();
  }
};
$("resetChecks").onclick=()=>{
  if(confirm("チェックを ぜんぶ もどしますか？")){
    localStorage.removeItem(childKey(currentChild,"done"));
    saveHistory(); render();
  }
};

$("stampPopupClose").onclick=()=>$("stampPopup").classList.add("hidden");

$("parentOpen").onclick=()=>{
  $("parentDialog").showModal();
  $("loginPane").classList.remove("hidden");
  $("parentPane").classList.add("hidden");
  $("pin").value="";
  $("pinError").textContent="";
};
$("loginBtn").onclick=()=>{
  if($("pin").value===APP_DATA.pin){
    $("loginPane").classList.add("hidden");
    $("parentPane").classList.remove("hidden");
    renderSummary();
  }else{
    $("pinError").textContent="あいことばが ちがいます。";
  }
};
$("addBonus").onclick=()=>{
  const text=$("bonusText").value.trim();
  if(!text)return;
  const all=bonuses();
  all.push({id:String(Date.now()),child:$("bonusChild").value,text,done:false});
  write(bonusKey(),all);
  $("bonusText").value="";
  saveHistory(); render();
};
$("addAward").onclick=()=>{
  const all=awards();
  all.push({id:String(Date.now()),child:$("awardChild").value,text:$("awardText").value});
  write(awardsKey(),all);
  saveHistory(); render();
};
$("spendWallet").onclick=()=>{
  const child=$("walletChild").value;
  const amount=Number($("walletSpend").value||0);
  if(amount<=0)return;
  setWallet(child,wallet(child)-amount);
  $("walletSpend").value="";
  render();
};

function renderSummary(){
  $("summary").innerHTML=`
    <p>🩵 ひなね：${progress("hinane")}/10・${wallet("hinane")}えん</p>
    <p>🩷 おとね：${progress("otone")}/6・${wallet("otone")}えん</p>
    <p>💛 すずね：${progress("suzune")}/4</p>
    <p>🤝 なかよし：${sisterDone()?"できた！":"まだ"}</p>
    <p><strong>かぞく：${familyTotal()}/20</strong></p>`;
}

$("prevMonth").onclick=()=>{ calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1); renderCalendar(); };
$("nextMonth").onclick=()=>{ calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1); renderCalendar(); };

function renderCalendar(){
  const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth();
  const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
  const history=read(historyKey,{});
  $("monthTitle").textContent=`${y}ねん ${m+1}がつ`;
  $("calendar").innerHTML="";
  for(let i=0;i<first;i++){ const z=document.createElement("div"); z.className="day blank"; $("calendar").appendChild(z); }
  for(let d=1;d<=days;d++){
    const key=dateKey(new Date(y,m,d));
    const rec=history[key];
    const btn=document.createElement("button"); btn.className="day";
    if(key===TODAY)btn.classList.add("today");
    let n=0;
    if(rec) n=Object.values(rec.children).reduce((s,c)=>s+c.done,0);
    if(n===20)btn.classList.add("full"); else if(n)btn.classList.add("some");
    btn.innerHTML=`<strong>${d}</strong><span class="marks">${n===20?"🎉":n?`${n}/20`:""}</span>`;
    btn.onclick=()=>showCalendarDetail(key,rec);
    $("calendar").appendChild(btn);
  }
}

function showCalendarDetail(key,rec){
  const [,m,d]=key.split("-");
  if(!rec){ $("calendarDetail").innerHTML=`<h3>${Number(m)}がつ ${Number(d)}にち</h3><p>まだ きろくが ありません。</p>`; return; }
  const list=child=>{
    const ids=new Set(rec.children[child].doneIds||[]);
    const arr=(rec.children[child].tasks||[]).filter(t=>ids.has(t.id));
    return arr.map(t=>`<li>${t.emoji} ${t.text}</li>`).join("")||"<li>なし</li>";
  };
  $("calendarDetail").innerHTML=`
    <h3>${Number(m)}がつ ${Number(d)}にち</h3>
    <h4>🩵 ひなね ${rec.children.hinane.done}/10</h4><ul>${list("hinane")}</ul>
    <h4>🩷 おとね ${rec.children.otone.done}/6</h4><ul>${list("otone")}</ul>
    <h4>💛 すずね ${rec.children.suzune.done}/4</h4><ul>${list("suzune")}</ul>
    <h4>🤝 なかよし</h4><p>${rec.sister?.done?"できた！":"まだ"}</p>`;
}

function renderStamps(){
  const have=new Set(collectedStamps());
  $("stampCount").textContent=`${have.size} / ${APP_DATA.stamps.length}`;
  $("stampGrid").innerHTML="";
  APP_DATA.stamps.forEach((s,i)=>{
    const card=document.createElement("div");
    card.className=`stamp-card ${have.has(i)?"":"locked"}`;
    card.innerHTML=`<div class="stamp-emoji">${have.has(i)?s[0]:"❓"}</div><div class="stamp-name">${have.has(i)?s[1]:"？？？"}</div>`;
    $("stampGrid").appendChild(card);
  });
}

function burst(){
  const c=$("confetti"),ctx=c.getContext("2d"),ratio=devicePixelRatio||1;
  c.width=innerWidth*ratio;c.height=innerHeight*ratio;ctx.scale(ratio,ratio);
  const colors=["#68c7f1","#ff9fc4","#f2d35b","#79cf87","#aa8af4"];
  const p=Array.from({length:130},()=>({x:innerWidth/2,y:innerHeight*.25,vx:(Math.random()-.5)*12,vy:-4-Math.random()*8,g:.26,s:4+Math.random()*6,c:colors[Math.floor(Math.random()*colors.length)]}));
  let frame=0;
  (function go(){
    ctx.clearRect(0,0,innerWidth,innerHeight);
    p.forEach(q=>{q.vy+=q.g;q.x+=q.vx;q.y+=q.vy;ctx.fillStyle=q.c;ctx.fillRect(q.x,q.y,q.s,q.s);});
    if(frame++<150)requestAnimationFrame(go);
  })();
}

if("serviceWorker" in navigator){
  addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js"));
}

render();
