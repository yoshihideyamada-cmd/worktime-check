(function(){
if(window.__dakokuRunning){alert('すでに実行中です。完了までお待ちください。');return;}

var KIND_NOTE='WebレコーダーX / WinレコーダーX / テレタイムeZ-X・Z-X・C-X / スマートテレタイムX / マルチスマートテレタイムX';
var UI_IDS=['__dakoku_loading','__dakoku_settings','__dakoku_result','__dakoku_deptchooser'];

function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
function waitFor(check,timeout){
 return new Promise(function(resolve){
  var start=Date.now();
  (function poll(){
   var r=check();
   if(r)return resolve(r);
   if(Date.now()-start>timeout)return resolve(null);
   setTimeout(poll,200);
  })();
 });
}
function norm(s){return String(s||'').replace(/[\s\u3000]+/g,'');}
function txt(e){return e?(e.textContent||'').trim():'';}
function pad(n){return(n<10?'0':'')+n;}
function ymd(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function escapeRegex(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function removeUi(){UI_IDS.forEach(function(id){var o=document.getElementById(id);if(o)o.remove();});}
function mk(tag,style,text){
 var e=document.createElement(tag);
 if(style)e.style.cssText=style;
 if(text!==undefined)e.textContent=text;
 return e;
}

function showLoading(msg){
 var old=document.getElementById('__dakoku_loading');
 if(old)old.remove();
 var box=mk('div','position:fixed;top:12px;right:12px;z-index:999999;background:white;color:#333;border:2px solid #333;padding:10px 14px;font:14px Meiryo,sans-serif;box-shadow:0 4px 16px #0005;white-space:pre-line');
 box.id='__dakoku_loading';
 box.appendChild(mk('div','',msg));
 var stopBtn=mk('button','margin-top:8px;padding:4px 12px;color:#c00000','停止');
 stopBtn.onclick=function(){
  window.__dakokuStop=true;
  stopBtn.disabled=true;
  stopBtn.textContent='停止中...';
 };
 box.appendChild(stopBtn);
 document.body.appendChild(box);
}
function hideLoading(){
 var old=document.getElementById('__dakoku_loading');
 if(old)old.remove();
}

function isLocKind(k){
 k=norm(k);
 return/レコーダーX/.test(k)||/テレタイム/.test(k);
}
function parseLatLon(btn){
 var srcs=[btn.getAttribute('value'),btn.getAttribute('onclick')];
 for(var i=0;i<srcs.length;i++){
  var s=srcs[i]||'';
  var m=/marker=(-?\d+(?:\.\d+)?)(?:,|%2C)(-?\d+(?:\.\d+)?)/i.exec(s)||/mlat=(-?\d+(?:\.\d+)?)&(?:amp;)?mlon=(-?\d+(?:\.\d+)?)/i.exec(s);
  if(m){
   var la=+m[1],lo=+m[2];
   if(isFinite(la)&&isFinite(lo)&&Math.abs(la)<=90&&Math.abs(lo)<=180&&!(la===0&&lo===0))return{lat:la,lon:lo};
  }
 }
 return null;
}
function parseDt(s){
 var m=/^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(s);
 return m?new Date(+m[1],m[2]-1,+m[3],+m[4],+m[5],+(m[6]||0)).getTime():null;
}
function cnt(doc,id){
 var e=doc.getElementById('timecardLogPageCounter'+id);
 return e?(parseInt((e.textContent||'').replace(/[^\d]/g,''),10)||0):0;
}
function dataRows(doc){
 return[].filter.call(doc.querySelectorAll('#timecardLogList tr'),function(r){return r.querySelectorAll('td').length>5;});
}
function headerIdx(doc){
 var ths=doc.querySelectorAll('#timecardLogList thead th'),labels=[],i,t;
 for(i=0;i<ths.length;i++){
  t=txt(ths[i]);
  if(labels.length&&t===labels[0])break;
  labels.push(t);
 }
 function f(n,d){var k=labels.indexOf(n);return k>=0?k:d;}
 return{dt:f('打刻日時',0),kind:f('打刻機種',1),user:f('ユーザー',4),kbn:f('区分',5),loc:f('位置',9)};
}

async function setPageSize300(doc,win){
 var sel=doc.getElementById('timecardLogPagingListList');
 if(!sel||sel.value==='300')return;
 if(![].some.call(sel.options,function(o){return o.value==='300';}))return;
 if(cnt(doc,'All')<=100)return;
 sel.value='300';
 sel.dispatchEvent(new win.Event('change',{bubbles:true}));
 await waitFor(function(){return(cnt(doc,'End')>100||cnt(doc,'End')>=cnt(doc,'All'))?true:null;},10000);
 await sleep(300);
}

async function extractFromDoc(doc,win,o){
 var tbl=await waitFor(function(){return doc.getElementById('timecardLogList');},20000);
 if(!tbl)return{error:'打刻データの表が読み込めませんでした'};
 await waitFor(function(){return cnt(doc,'All')>0?true:null;},6000);
 if(cnt(doc,'All')===0)return{recs:[],names:[],scanned:0};
 await setPageSize300(doc,win);

 var ix=headerIdx(doc);
 var recs=[],names={},scanned=0,page=1,maxPages=60,truncated=false;
 while(page<=maxPages){
  if(window.__dakokuStop){truncated=true;break;}
  var rows=dataRows(doc);
  var prev=Infinity,mono=true,lastMs=null;
  rows.forEach(function(r){
   var c=r.cells;
   var dtS=txt(c[ix.dt]);
   var ms=parseDt(dtS);
   scanned++;
   if(ms!==null){
    if(ms>prev+1000)mono=false;
    prev=ms;
    lastMs=ms;
   }
   var user=txt(c[ix.user]);
   if(user)names[user]=1;
   var kind=txt(c[ix.kind]);
   if(!isLocKind(kind))return;
   if(ms===null||ms<o.from||ms>o.to)return;
   var cell=c[ix.loc];
   var btn=cell?cell.querySelector('button'):null;
   var ll=(btn&&!btn.disabled)?parseLatLon(btn):null;
   recs.push({user:user,dt:dtS,kind:kind,kbn:txt(c[ix.kbn]),lat:ll?ll.lat:null,lon:ll?ll.lon:null});
  });
  if(o.expectName){
   var keys=Object.keys(names);
   if(keys.length&&!keys.some(function(k){return norm(k)===norm(o.expectName);})){
    return{error:'別のユーザー('+keys[0]+')のデータが表示されました。個別モードで、本人の打刻データ画面から実行してください。'};
   }
  }
  if(lastMs!==null&&lastMs<o.from&&mono)break;
  var end=cnt(doc,'End'),all=cnt(doc,'All');
  if(end>=all)break;
  var ul=doc.getElementById('timecardLogPageNaterPageNater');
  var lis=ul?ul.querySelectorAll('li'):[];
  var nextA=lis.length?lis[lis.length-1].querySelector('a'):null;
  if(!nextA)break;
  var prevStart=cnt(doc,'Start');
  var firstTxt=rows.length?txt(rows[0].cells[ix.dt])+txt(rows[0].cells[ix.kbn]):'';
  nextA.click();
  var moved=await waitFor(function(){
   if(cnt(doc,'Start')===prevStart)return null;
   var rr=dataRows(doc);
   return(rr.length&&(txt(rr[0].cells[ix.dt])+txt(rr[0].cells[ix.kbn]))!==firstTxt)?true:null;
  },10000);
  if(!moved){truncated=true;break;}
  await sleep(150);
  page++;
 }
 if(page>maxPages)truncated=true;
 return{recs:recs,names:Object.keys(names),scanned:scanned,truncated:truncated};
}

async function loadLogFrame(){
 var link=document.querySelector('a[onclick*="loadTimecardLog"]');
 if(!link)return{error:'「打刻データ」リンクが見つかりません(タイムカード画面で実行してください)'};
 var orig=window.open,url=null;
 function setUrl(v){if(v)url=String(v);}
 window.open=function(u){
  setUrl(u);
  var locObj={assign:setUrl,replace:setUrl};
  Object.defineProperty(locObj,'href',{set:setUrl,get:function(){return url||'';}});
  var fake={focus:function(){},close:function(){},closed:false,document:{write:function(){},open:function(){},close:function(){}}};
  Object.defineProperty(fake,'location',{set:setUrl,get:function(){return locObj;}});
  return fake;
 };
 try{link.click();}catch(e){}
 await waitFor(function(){return url;},3000);
 window.open=orig;
 if(!url)return{error:'打刻データ画面のURLを取得できませんでした'};
 var ifr=document.createElement('iframe');
 ifr.style.cssText='position:fixed;left:-10000px;top:0;width:1300px;height:900px;border:0';
 ifr.src=url;
 var loaded=new Promise(function(res){ifr.addEventListener('load',function(){res(true);});setTimeout(function(){res(false);},20000);});
 document.body.appendChild(ifr);
 var ok=await loaded;
 if(!ok){ifr.remove();return{error:'打刻データ画面の読込がタイムアウトしました'};}
 var doc=null;
 try{doc=ifr.contentDocument;}catch(e){}
 if(!doc){ifr.remove();return{error:'打刻データ画面を読み込めませんでした'};}
 return{doc:doc,win:ifr.contentWindow,remove:function(){ifr.remove();}};
}

function clickExact(selector,text,root){
 root=root||document;
 var els=root.querySelectorAll(selector);
 for(var i=0;i<els.length;i++){
  if((els[i].textContent||'').trim()===text){els[i].click();return true;}
 }
 return false;
}
function findModalContainer(){
 var heading=null;
 document.querySelectorAll('*').forEach(function(el){
  if(!heading&&el.children.length===0&&(el.textContent||'').trim()==='ユーザーを選択して下さい。')heading=el;
 });
 return heading;
}
function hasDeptTree(){
 return document.querySelectorAll('li[class*="jstree-node"] > a').length>0;
}
function hasPickerButton(){
 var c=document.querySelectorAll('button,a'),i;
 for(i=0;i<c.length;i++){if((c[i].textContent||'').trim()==='選択')return true;}
 return false;
}
async function openUserPickerModal(){
 if(findModalContainer()&&hasDeptTree())return true;
 var candidates=[];
 document.querySelectorAll('button,a').forEach(function(el){
  if((el.textContent||'').trim()==='選択')candidates.push(el);
 });
 for(var i=0;i<candidates.length;i++){
  candidates[i].click();
  var heading=await waitFor(findModalContainer,3000);
  if(heading){
   var treeReady=await waitFor(function(){return hasDeptTree()?true:null;},3000);
   if(treeReady)return true;
   clickExact('button,a','キャンセル');
   await sleep(300);
  }
 }
 return false;
}
function getDepartmentNames(){
 var names=[],seen={};
 var anchors=document.querySelectorAll('li[class*="jstree-node"] > a');
 for(var i=0;i<anchors.length;i++){
  var tx=(anchors[i].textContent||'').trim();
  if(tx&&tx!=='すべて'&&!seen[tx]){seen[tx]=true;names.push(tx);}
 }
 return names;
}
function getUserRows(){
 var rows=[];
 var radios=document.querySelectorAll('input[type=radio]');
 for(var i=0;i<radios.length;i++){
  var tr=radios[i].closest('tr');
  if(!tr)continue;
  var hidden=tr.querySelector('input[type=hidden][name]');
  if(!hidden)continue;
  var td=hidden.closest('td')||tr.children[1];
  var parts=td?td.querySelectorAll('.uk-text-truncate'):[];
  var role=parts[1]?parts[1].textContent.trim():'';
  rows.push({radio:radios[i],name:hidden.getAttribute('name'),role:role});
 }
 return rows;
}
function snapshotRadios(){return getUserRows().map(function(r){return r.radio;});}
async function waitForRowsRefreshed(prevRadios,maxTotal){
 return!!(await waitFor(function(){
  var cur=getUserRows();
  if(cur.length===0)return null;
  if(prevRadios.length===0)return true;
  for(var i=0;i<prevRadios.length;i++){
   if(!document.body.contains(prevRadios[i]))return true;
  }
  return cur.length!==prevRadios.length?true:null;
 },maxTotal));
}
function findDeptAnchor(name){
 var anchors=document.querySelectorAll('li[class*="jstree-node"] > a');
 for(var i=0;i<anchors.length;i++){
  var tx=(anchors[i].textContent||'').trim();
  if(tx===name||tx.indexOf(name)===0)return anchors[i];
 }
 return null;
}
function clickDepartmentByName(name){
 var a=findDeptAnchor(name);
 if(a){a.click();return true;}
 return false;
}
function getChildDeptNames(li){
 var names=[];
 var childAnchors=li.querySelectorAll(':scope > ul > li[class*="jstree-node"] > a');
 for(var i=0;i<childAnchors.length;i++){
  var tx=(childAnchors[i].textContent||'').trim();
  if(tx)names.push(tx);
 }
 return names;
}
async function expandDeptIfNeeded(name){
 var a=findDeptAnchor(name);
 if(!a)return[];
 var li=a.closest('li');
 if(!/jstree-closed/.test(li.className))return getChildDeptNames(li);
 var icon=li.querySelector('i.jstree-ocl');
 if(icon)icon.click();
 await waitFor(function(){return/jstree-closed/.test(li.className)?null:true;},8000);
 return getChildDeptNames(li);
}
async function collapseIfExpanded(name){
 var a=findDeptAnchor(name);
 if(!a)return;
 var li=a.closest('li');
 if(/jstree-closed/.test(li.className))return;
 var icon=li.querySelector('i.jstree-ocl');
 if(icon)icon.click();
 await waitFor(function(){return/jstree-closed/.test(li.className)?true:null;},4000);
}
async function selectScopePath(path){
 for(var i=0;i<path.length-1;i++){
  await expandDeptIfNeeded(path[i]);
 }
 return clickDepartmentByName(path[path.length-1]);
}
function userLoaded(name){
 var t=norm(document.body.innerText);
 return t.indexOf(norm(name)+'さんのタイムカード')!==-1&&!!document.querySelector('a[onclick*="loadTimecardLog"]');
}
async function navigateToUser(path,name){
 if(!await openUserPickerModal())return'ユーザー選択画面(部署ツリー付き)が開けません';
 var deptReady=await waitFor(function(){var n=getDepartmentNames();return n.length>0?true:null;},8000);
 if(!deptReady)return'部署一覧の読込待ちタイムアウト';
 var prevRadios=snapshotRadios();
 if(!await selectScopePath(path))return'部署/課の選択に失敗';
 var rowsReady=await waitForRowsRefreshed(prevRadios,8000);
 if(!rowsReady)return'社員一覧の読込待ちタイムアウト';
 var rows=getUserRows();
 var target=null;
 for(var i=0;i<rows.length;i++)if(rows[i].name===name){target=rows[i];break;}
 if(!target)return'一覧に対象者なし('+rows.length+'件中)';
 target.radio.click();
 if(!clickExact('button,a','OK'))return'OKボタンが見つかりません';
 var loaded=await waitFor(function(){return userLoaded(name)?true:null;},8000);
 if(!loaded)return'画面切替待ちタイムアウト';
 return null;
}

var BACK_SENTINEL='__BACK__';
function longestCommonPrefix(strs){
 if(!strs.length)return'';
 var prefix=strs[0];
 for(var i=1;i<strs.length;i++){
  var s=strs[i],j=0;
  while(j<prefix.length&&j<s.length&&prefix[j]===s[j])j++;
  prefix=prefix.slice(0,j);
  if(!prefix)break;
 }
 return prefix;
}
function shortenChildLabels(parentName,children){
 var stripLen=0;
 if(children.length&&children.every(function(c){return c.indexOf(parentName)===0&&c.length>parentName.length;})){
  stripLen=parentName.length;
 }else{
  var cp=longestCommonPrefix(children);
  if(cp.length>=2&&children.every(function(c){return c.length>cp.length;}))stripLen=cp.length;
 }
 return children.map(function(c){return{label:stripLen?c.slice(stripLen):c,value:c};});
}
function chooseDepartment(options,titleText,showBack){
 var normalized=options.map(function(o){return(typeof o==='string')?{label:o,value:o}:o;});
 return new Promise(function(resolve){
  var old=document.getElementById('__dakoku_deptchooser');
  if(old)old.remove();
  var box=mk('div','position:fixed;top:12px;right:12px;z-index:999999;background:white;color:black;border:2px solid #333;padding:14px 16px;width:280px;max-width:90vw;max-height:80vh;overflow:auto;box-shadow:0 4px 16px #0005;font:15px Meiryo,sans-serif;line-height:1.6');
  box.id='__dakoku_deptchooser';
  box.appendChild(mk('div','font-weight:700;margin-bottom:10px',titleText||'対象の部署を選んでください'));
  if(showBack){
   var back=mk('button','display:block;width:100%;text-align:left;padding:8px;margin-bottom:10px;color:#555','← 戻る');
   back.onclick=function(){box.remove();resolve(BACK_SENTINEL);};
   box.appendChild(back);
  }
  normalized.forEach(function(opt){
   var btn=mk('button',opt.isAll
    ?'display:block;width:100%;text-align:left;padding:8px;margin-bottom:10px;font-weight:700;background:#fff3cd;border:1px solid #e0c060'
    :'display:block;width:100%;text-align:left;padding:8px;margin-bottom:6px',opt.label);
   btn.onclick=function(){box.remove();resolve(opt.value);};
   box.appendChild(btn);
  });
  var cancel=mk('button','display:block;width:100%;text-align:left;padding:8px;margin-top:6px;color:#c00000','キャンセル');
  cancel.onclick=function(){box.remove();resolve(null);};
  box.appendChild(cancel);
  document.body.appendChild(box);
 });
}

function askSettings(ctx){
 return new Promise(function(resolve){
  var box=mk('div','position:fixed;top:12px;right:12px;z-index:999999;background:white;color:black;border:2px solid #333;padding:14px 16px;width:360px;max-width:92vw;max-height:88vh;overflow:auto;box-shadow:0 4px 16px #0005;font:14px Meiryo,sans-serif;line-height:1.7');
  box.id='__dakoku_settings';
  box.appendChild(mk('div','font-weight:700;font-size:16px;margin-bottom:8px','打刻位置情報 一覧'));

  box.appendChild(mk('div','font-size:12px;color:#666','対象'));
  var scope=ctx.onLog?'one':(ctx.canDept?'dept':'one');
  var radios={};
  [['dept','部署を選んで全員',!ctx.canDept],['one','今開いている1人',false]].forEach(function(d){
   var lab=mk('label','display:block;margin:2px 0'+(d[2]?';color:#aaa':''));
   var rb=document.createElement('input');
   rb.type='radio';rb.name='__dakoku_scope';rb.value=d[0];rb.disabled=d[2];
   rb.checked=(d[0]===scope);
   rb.onchange=function(){scope=d[0];};
   radios[d[0]]=rb;
   lab.appendChild(rb);
   lab.appendChild(document.createTextNode(' '+d[1]+(d[2]?(ctx.onLog?'(この画面では選べません)':'(システム設定→タイムカード画面で選べます)'):'')));
   box.appendChild(lab);
  });

  box.appendChild(mk('div','font-size:12px;color:#666;margin-top:10px','期間(打刻日時)'));
  var now=new Date();
  var fromIn=document.createElement('input');fromIn.type='date';fromIn.value=ymd(new Date(now.getFullYear(),now.getMonth(),1));
  var toIn=document.createElement('input');toIn.type='date';toIn.value=ymd(now);
  var row=mk('div','margin:2px 0');
  row.appendChild(fromIn);row.appendChild(document.createTextNode(' ～ '));row.appendChild(toIn);
  box.appendChild(row);
  var presets=mk('div','margin:4px 0');
  [['今月',function(){return[new Date(now.getFullYear(),now.getMonth(),1),now];}],
   ['先月',function(){return[new Date(now.getFullYear(),now.getMonth()-1,1),new Date(now.getFullYear(),now.getMonth(),0)];}],
   ['直近7日',function(){return[new Date(now.getTime()-6*86400000),now];}],
   ['直近30日',function(){return[new Date(now.getTime()-29*86400000),now];}]].forEach(function(p){
   var b=mk('button','margin-right:4px;padding:1px 8px;font-size:12px',p[0]);
   b.onclick=function(){var r=p[1]();fromIn.value=ymd(r[0]);toIn.value=ymd(r[1]);};
   presets.appendChild(b);
  });
  box.appendChild(presets);

  box.appendChild(mk('div','font-size:11px;color:#888;margin-top:8px','位置情報が付く打刻機種:\n'+KIND_NOTE));
  box.lastChild.style.whiteSpace='pre-line';
  box.appendChild(mk('div','font-size:11px;color:#888;margin-top:4px','画面を読み取るだけで、打刻や申請などサイトのデータは一切変更しません。'));

  var btnRow=mk('div','margin-top:12px;text-align:right');
  var cancel=mk('button','margin-right:8px;padding:4px 12px','キャンセル');
  cancel.onclick=function(){box.remove();resolve(null);};
  var go=mk('button','padding:4px 16px;font-weight:700','実行');
  go.onclick=function(){
   if(!fromIn.value||!toIn.value){alert('期間を入力してください。');return;}
   var f=fromIn.value.split('-'),t=toIn.value.split('-');
   var from=new Date(+f[0],f[1]-1,+f[2],0,0,0).getTime();
   var to=new Date(+t[0],t[1]-1,+t[2],23,59,59).getTime();
   if(from>to){alert('期間の開始が終了より後になっています。');return;}
   box.remove();
   resolve({scope:scope,from:from,to:to,fromS:fromIn.value,toS:toIn.value});
  };
  btnRow.appendChild(cancel);btnRow.appendChild(go);
  box.appendChild(btnRow);
  document.body.appendChild(box);
 });
}

function gmapUrl(r){return'https://www.google.com/maps?q='+r.lat+','+r.lon;}
function csvCell(v){v=String(v==null?'':v);return/[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;}
function buildRows(results){
 var out=[];
 results.forEach(function(res){
  (res.recs||[]).forEach(function(r){out.push({name:res.name||r.user,dt:r.dt,kind:r.kind,kbn:r.kbn,lat:r.lat,lon:r.lon,addr:r.addr||null});});
 });
 out.sort(function(a,b){
  if(a.name!==b.name)return a.name<b.name?-1:1;
  return a.dt<b.dt?1:(a.dt>b.dt?-1:0);
 });
 return out;
}
function toTable(rows,sep){
 var head=['氏名','打刻日時','打刻機種','区分','住所','地図URL'];
 var lines=[head.map(csvCell).join(sep)];
 rows.forEach(function(r){
  var has=r.lat!==null;
  var cells=[r.name,r.dt,r.kind,r.kbn,has?(r.addr||'(住所不明)'):'位置なし',has?gmapUrl(r):''];
  lines.push(sep===','?cells.map(csvCell).join(','):cells.join('\t'));
 });
 return lines.join('\r\n');
}
function copyText(text){
 if(navigator.clipboard&&navigator.clipboard.writeText){
  return navigator.clipboard.writeText(text).catch(function(){fallbackCopy(text);});
 }
 fallbackCopy(text);
 return Promise.resolve();
}
function fallbackCopy(text){
 var ta=document.createElement('textarea');
 ta.value=text;ta.style.position='fixed';ta.style.left='-9999px';
 document.body.appendChild(ta);ta.select();
 try{document.execCommand('copy');}catch(e){}
 document.body.removeChild(ta);
}

var muniMap=null;
var geoCache={};
function setLoadingText(msg){
 var b=document.getElementById('__dakoku_loading');
 if(b&&b.firstChild)b.firstChild.textContent=msg;
 else showLoading(msg);
}
async function loadMuni(){
 if(muniMap)return muniMap;
 var map={};
 try{
  var r=await fetch('https://maps.gsi.go.jp/js/muni.js');
  if(r.ok){
   var t=await r.text();
   var re=/MUNI_ARRAY\[\s*["']?(\d+)["']?\s*\]\s*=\s*["'](\d+),([^,]+),(\d+),([^"']+)["']/g,m;
   while((m=re.exec(t))){map[('00000'+m[4]).slice(-5)]=(m[3]+m[5]).replace(/[\s　]+/g,'');}
  }
 }catch(e){}
 muniMap=map;
 return map;
}
function geoKey(lat,lon){return lat.toFixed(4)+','+lon.toFixed(4);}
async function lookupAddress(lat,lon){
 var key=geoKey(lat,lon);
 if(key in geoCache)return geoCache[key];
 var addr=null;
 try{
  var r=await fetch('https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat='+lat.toFixed(4)+'&lon='+lon.toFixed(4));
  if(r.ok){
   var j=await r.json();
   var res=j&&j.results;
   if(res&&res.muniCd){
    var mm=await loadMuni();
    var a=(mm[('00000'+res.muniCd).slice(-5)]||'')+(res.lv01Nm||'');
    if(a)addr=a;
   }
  }
 }catch(e){}
 geoCache[key]=addr;
 return addr;
}
async function fillAddresses(results,progress){
 var recs=[];
 results.forEach(function(r){(r.recs||[]).forEach(function(x){if(x.lat!==null)recs.push(x);});});
 var uniq={};
 recs.forEach(function(x){uniq[geoKey(x.lat,x.lon)]=x;});
 var keys=Object.keys(uniq),idx=0,done=0,fail=0;
 async function worker(){
  while(idx<keys.length){
   if(window.__dakokuStop)return;
   var x=uniq[keys[idx++]];
   var a=await lookupAddress(x.lat,x.lon);
   if(a===null)fail++;
   done++;
   progress(done,keys.length);
  }
 }
 await Promise.all([worker(),worker(),worker(),worker()]);
 recs.forEach(function(x){x.addr=geoCache[geoKey(x.lat,x.lon)]||null;});
 return{total:keys.length,fail:fail};
}

function showResult(scopeLabel,st,results,geo){
 var old=document.getElementById('__dakoku_result');
 if(old)old.remove();
 var box=mk('div','position:fixed;top:12px;right:12px;z-index:999999;background:white;color:black;border:2px solid #333;padding:14px 16px;width:780px;max-width:96vw;max-height:90vh;overflow:auto;box-shadow:0 4px 16px #0005;font:14px Meiryo,sans-serif;line-height:1.6');
 box.id='__dakoku_result';
 var close=mk('button','float:right','閉じる');
 close.onclick=function(){box.remove();};
 box.appendChild(close);
 box.appendChild(mk('div','font-weight:700;font-size:17px;margin-bottom:4px','【'+scopeLabel+' 打刻位置情報 一覧】'));
 box.appendChild(mk('div','font-size:12px;color:#555;margin-bottom:8px','期間：'+st.fromS+' ～ '+st.toS));

 var rows=buildRows(results);
 var withLoc=rows.filter(function(r){return r.lat!==null;}).length;
 var people=results.filter(function(r){return!r.error;}).length;
 box.appendChild(mk('div','margin-bottom:6px','対象 '+people+'人 ／ 打刻 '+rows.length+'件(位置情報あり '+withLoc+'件)'));

 var bar=mk('div','margin-bottom:8px');
 var onlyLoc=document.createElement('input');onlyLoc.type='checkbox';onlyLoc.checked=false;
 var onlyLab=mk('label','margin-right:12px');
 onlyLab.appendChild(onlyLoc);onlyLab.appendChild(document.createTextNode(' 位置情報ありのみ表示'));
 bar.appendChild(onlyLab);
 var status=mk('span','font-size:12px;color:#0a7d00;margin-left:8px');
 var copyBtn=mk('button','margin-right:6px;padding:2px 10px','Excel用にコピー');
 copyBtn.onclick=function(){
  var list=onlyLoc.checked?rows.filter(function(r){return r.lat!==null;}):rows;
  copyText(toTable(list,'\t')).then(function(){status.textContent='コピーしました('+list.length+'件)。Excelに貼り付けできます。';});
 };
 var csvBtn=mk('button','margin-right:6px;padding:2px 10px','CSV保存');
 csvBtn.onclick=function(){
  var list=onlyLoc.checked?rows.filter(function(r){return r.lat!==null;}):rows;
  var blob=new Blob(['\ufeff'+toTable(list,',')],{type:'text/csv;charset=utf-8'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='打刻位置一覧_'+st.fromS+'_'+st.toS+'.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(function(){URL.revokeObjectURL(a.href);},2000);
 };
 bar.appendChild(copyBtn);bar.appendChild(csvBtn);bar.appendChild(status);
 box.appendChild(bar);

 var table=mk('table','width:100%;border-collapse:collapse;font-size:13px');
 var head=document.createElement('tr');
 ['氏名','打刻日時','機種','区分','住所','地図'].forEach(function(h){
  head.appendChild(mk('th','text-align:left;border-bottom:2px solid #ccc;padding:4px;white-space:nowrap',h));
 });
 table.appendChild(head);
 var body=document.createElement('tbody');
 table.appendChild(body);
 function render(){
  while(body.firstChild)body.removeChild(body.firstChild);
  var list=onlyLoc.checked?rows.filter(function(r){return r.lat!==null;}):rows;
  var lastName=null;
  list.forEach(function(r){
   var tr=document.createElement('tr');
   var td=function(t,st2){var e=mk('td','padding:3px 4px;border-bottom:1px solid #eee;'+(st2||''),t);tr.appendChild(e);return e;};
   var red=r.lat===null?'color:#c00000;':'';
   td(r.name===lastName?'':r.name,red+'white-space:nowrap');
   lastName=r.name;
   td(r.dt,red+'white-space:nowrap');
   td(r.kind,red+'font-size:12px');
   td(r.kbn,red+'white-space:nowrap');
   if(r.lat!==null){
    td(r.addr||'(住所を取得できませんでした)',r.addr?'':'color:#999');
    var tdm=td('');
    var a=mk('a','color:#0645ad','Googleマップ');
    a.href=gmapUrl(r);a.target='_blank';a.rel='noopener noreferrer';
    tdm.appendChild(a);
   }else{
    td('位置なし','color:#c00000;font-weight:700');
    td('');
   }
   body.appendChild(tr);
  });
  if(!list.length){
   var tr2=document.createElement('tr');
   var tdE=mk('td','padding:10px;color:#666','該当する打刻はありません。');
   tdE.colSpan=6;tr2.appendChild(tdE);body.appendChild(tr2);
  }
 }
 onlyLoc.onchange=render;
 render();
 box.appendChild(table);

 var errs=results.filter(function(r){return r.error;});
 if(errs.length){
  var eb=mk('div','margin-top:10px;color:#c00000;font-size:12px;white-space:pre-line');
  eb.textContent='読み取れなかった人:\n'+errs.map(function(r){return'・'+r.name+'：'+r.error;}).join('\n');
  box.appendChild(eb);
 }
 var trunc=results.filter(function(r){return r.truncated;});
 if(trunc.length){
  box.appendChild(mk('div','margin-top:6px;color:#c00000;font-size:12px','※途中で停止/打ち切りされた人がいます(結果は一部のみの可能性があります)'));
 }
 if(geo&&geo.total>0){
  if(geo.fail===geo.total){
   box.appendChild(mk('div','margin-top:8px;color:#c00000;font-size:12px','※住所を取得できませんでした(通信がブロックされた可能性があります)。「Googleマップ」のリンクで場所を確認してください。'));
  }else if(geo.fail>0){
   box.appendChild(mk('div','margin-top:8px;color:#c00000;font-size:12px','※一部の住所を取得できませんでした。「Googleマップ」のリンクで場所を確認してください。'));
  }
 }
 box.appendChild(mk('div','margin-top:12px;font-size:12px;color:#666;white-space:pre-line','住所は国土地理院の住所検索サービスで、座標(小数点以下4桁に丸めた値のみ。氏名・時刻は送りません)から取得しています。町丁目までの目安で、正確な場所は「Googleマップ」のリンクで確認できます。\nノリで作成したので間違っているかもしれません。'));
 document.body.appendChild(box);
}

async function run(){
 window.__dakokuRunning=true;
 window.__dakokuStop=false;
 try{
  removeUi();
  var onLog=/ContentsTimecardLogPage/.test(location.pathname);
  var hasLink=!!document.querySelector('a[onclick*="loadTimecardLog"]');
  var canDept=!onLog&&hasPickerButton();
  if(!onLog&&!hasLink&&!canDept){
   alert('X\'sionのタイムカード画面(または打刻データ画面)で実行してください。');
   return;
  }
  var st=await askSettings({onLog:onLog,canDept:canDept});
  if(!st)return;
  var o={from:st.from,to:st.to};
  var results=[],scopeLabel='';

  if(st.scope==='one'){
   showLoading('打刻データを読み取っています...');
   var res;
   if(onLog){
    res=await extractFromDoc(document,window,o);
   }else{
    var fr=await loadLogFrame();
    if(fr.error){hideLoading();alert(fr.error);return;}
    res=await extractFromDoc(fr.doc,fr.win,o);
    fr.remove();
   }
   hideLoading();
   if(res.error){alert(res.error);return;}
   var nm=(res.names&&res.names[0])||'(氏名不明)';
   res.name=nm;
   results.push(res);
   scopeLabel=nm;
  }else{
   if(!await openUserPickerModal()){alert('システム設定→タイムカード画面で実行してください。');return;}
   var deptNames=await waitFor(function(){var n=getDepartmentNames();return n.length>0?n:null;},8000);
   if(!deptNames){alert('部署一覧が取得できませんでした。');return;}
   var path=[],ALL='ALL';
   while(true){
    if(path.length===0){
     var first=await chooseDepartment(deptNames,undefined,false);
     if(!first)return;
     path=[first];
     continue;
    }
    var children=await expandDeptIfNeeded(path[path.length-1]);
    if(children.length===0)break;
    var label=path[path.length-1];
    var options=[{label:label+'(全体)',value:ALL,isAll:true}].concat(shortenChildLabels(label,children));
    var next=await chooseDepartment(options,label+'の中から選んでください',true);
    if(next===BACK_SENTINEL){path.pop();continue;}
    if(!next)return;
    if(next===ALL){await collapseIfExpanded(label);break;}
    path.push(next);
   }
   scopeLabel=path[path.length-1];
   var prevInit=snapshotRadios();
   if(!await selectScopePath(path)){alert('部署「'+scopeLabel+'」の選択に失敗しました。');return;}
   if(!await waitForRowsRefreshed(prevInit,8000)){alert('「'+scopeLabel+'」の社員一覧が読み込めませんでした。');return;}
   var targets=getUserRows().map(function(r){return{name:r.name,role:r.role};});
   if(!targets.length){alert('「'+scopeLabel+'」に社員が見つかりませんでした。');return;}

   for(var idx=0;idx<targets.length;idx++){
    if(window.__dakokuStop)break;
    var name=targets[idx].name;
    showLoading((idx+1)+'/'+targets.length+'人目\n'+name+' を処理中...');
    var fail=await navigateToUser(path,name);
    if(fail){results.push({name:name,error:fail});continue;}
    var fr2=await loadLogFrame();
    if(fr2.error){results.push({name:name,error:fr2.error});continue;}
    var r2=await extractFromDoc(fr2.doc,fr2.win,{from:o.from,to:o.to,expectName:name});
    fr2.remove();
    if(r2.error){results.push({name:name,error:r2.error});continue;}
    r2.name=name;
    results.push(r2);
   }
   hideLoading();
   if(window.__dakokuStop)scopeLabel+='(途中で停止)';
  }
  showLoading('住所を取得しています...');
  var geo=await fillAddresses(results,function(d,t){setLoadingText('住所を取得しています... '+d+'/'+t);});
  hideLoading();
  showResult(scopeLabel,st,results,geo);
 }catch(e){
  hideLoading();
  alert('エラー:'+e.message);
 }finally{
  window.__dakokuRunning=false;
 }
}

run();
})();
