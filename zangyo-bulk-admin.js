(function(){
function g(e){return e?e.innerText:''}
function h(e){return e?e.innerHTML:''}
function t(s){s=(s.match(/\d?\d[:：]\d\d/g)||[]).pop();return s?(s=s.split(/[:：]/),60*s[0]+ +s[1]):-1}
function z(x,y){return x>=0?x:y}
function o(s,e,a,b){var x=0,k;for(k=-1;k<2;k++)x+=Math.max(0,Math.min(e,b+1440*k)-Math.max(s,a+1440*k));return x}
function c(s,e,p){
 if(s<0||e<0)return 0;
 if(e<s)e+=1440;
 var r=p
  ? '1065,1110,1260,1275,1380,1395,1500,1515,1635,1650,1770,1785,1860,1875,525,540'
  : '525,540,735,780,1065,1080,1260,1275,60,75,195,210,330,345,420,435';
 var a=r.split(','),n=e-s,i;
 for(i=0;i<a.length;)n-=o(s,e,+a[i++],+a[i++]);
 return n;
}
function night(s,e,p){
 if(s<0||e<0)return 0;
 if(e<s)e+=1440;
 if(e<=1320)return 0;
 return c(Math.max(s,1320),e,p);
}
function hours(minutes){
 return (minutes/60).toFixed(2)+'h';
}
function leaveMinutes(j){
 var m=j.match(/(\d+(?:\.\d+)?)\s*[hHｈＨ]\s*有/);
 return m?Math.round(parseFloat(m[1])*60):0;
}
function roundUp15(min){return Math.ceil(min/15)*15;}
function roundDown15(min){return Math.floor(min/15)*15;}
function fmt(min){
 min=(min%1440+1440)%1440;
 return String(Math.floor(min/60)).padStart(2,'0')+':'+String(min%60).padStart(2,'0');
}
function endForWorkMinutes(start,workMinutes,p){
 var end=start+workMinutes;
 for(var i=0;i<10;i++){
  var diff=workMinutes-c(start,end,p);
  if(diff===0)break;
  end+=diff;
 }
 return end;
}
function startForWorkMinutes(end,workMinutes,p){
 var start=end-workMinutes;
 for(var i=0;i<10;i++){
  var diff=workMinutes-c(start,end,p);
  if(diff===0)break;
  start-=diff;
 }
 return start;
}
function isManagerRole(role){
 return /部長|課長|次長|本部長|取締役|社長|工場長|所長/.test(role||'');
}

function showLoading(msg){
 var old=document.getElementById('__zangyo_loading');
 if(old)old.remove();
 var box=document.createElement('div');
 box.id='__zangyo_loading';
 box.style='position:fixed;top:12px;right:12px;z-index:999999;background:white;color:#333;border:2px solid #333;padding:10px 14px;font:14px Meiryo,sans-serif;box-shadow:0 4px 16px #0005;white-space:pre-line';
 var text=document.createElement('div');
 text.textContent=msg;
 box.appendChild(text);
 var stopBtn=document.createElement('button');
 stopBtn.textContent='停止';
 stopBtn.style='margin-top:8px;padding:4px 12px;color:#c00000';
 stopBtn.onclick=function(){
  window.__zangyoBulkStopRequested=true;
  stopBtn.disabled=true;
  stopBtn.textContent='停止中...';
 };
 box.appendChild(stopBtn);
 document.body.appendChild(box);
}
function hideLoading(){
 var old=document.getElementById('__zangyo_loading');
 if(old)old.remove();
}

function buildPersonDetailBox(details,total,henkeiTotal){
 var box=document.createElement('div');
 box.style='margin-top:4px;padding:8px;background:#f5f5f5;border:1px solid #ccc;font-size:12px;text-align:left;color:#000';

 if(!details.length){
  var noneMsg=document.createElement('div');
  noneMsg.textContent='残業・調整はありません。';
  box.appendChild(noneMsg);
  return box;
 }
 var hasWarning=false;
 details.forEach(function(entry){
  var line=document.createElement('div');
  line.textContent=entry.text;
  if(entry.color)line.style.color=entry.color;
  if(entry.gapValue){
   line.appendChild(document.createTextNode('（再出入差引済　'));
   var gapSpan=document.createElement('span');
   gapSpan.style.color='#c00000';
   gapSpan.textContent='-'+entry.gapValue;
   line.appendChild(gapSpan);
   line.appendChild(document.createTextNode('）'));
  }
  if(entry.warning){
   hasWarning=true;
   var mark=document.createElement('span');
   mark.textContent=' [!]';
   mark.title='クリックで詳細表示';
   mark.style='color:#c00000;font-weight:700;cursor:pointer';
   var warnBox=document.createElement('div');
   warnBox.textContent='⚠ '+entry.warning;
   warnBox.style='display:none;color:#c00000;white-space:pre-line;margin:2px 0 6px 12px;font-size:12px';
   mark.onclick=function(e){
    e.stopPropagation();
    warnBox.style.display=warnBox.style.display==='none'?'block':'none';
   };
   line.appendChild(mark);
   box.appendChild(line);
   box.appendChild(warnBox);
  }else{
   box.appendChild(line);
  }
 });
 if(henkeiTotal){
  var normalTotal=total-henkeiTotal;
  var sign=henkeiTotal>=0?'+':'';
  var henkeiSummary=document.createElement('div');
  henkeiSummary.style='color:#0645ad;margin-top:8px';
  henkeiSummary.innerHTML=
   '変形時差合計：'+sign+hours(henkeiTotal)+'（残業扱い）'+
   (henkeiTotal<0?' <span style="color:#c00000;font-weight:700">⚠</span>':'')+
   '<hr style="border:none;border-top:1px solid #bcd;margin:4px 0">'+
   '残業　'+hours(normalTotal)+'　+　変形　'+sign+hours(henkeiTotal)+'　＝　合計　'+hours(total);
  box.appendChild(henkeiSummary);
 }
 if(hasWarning){
  var legend=document.createElement('div');
  legend.textContent='[！]＝クリックで詳細表示';
  legend.style='color:#c00000;margin-top:6px';
  box.appendChild(legend);
 }
 return box;
}
function showSummary(path,scopeLabel,results){
 var old=document.getElementById('__zangyo_result');
 if(old)old.remove();

 var box=document.createElement('div');
 box.id='__zangyo_result';
 box.style='position:fixed;top:12px;right:12px;z-index:999999;background:white;color:black;border:2px solid #333;padding:14px 16px;width:420px;max-width:92vw;max-height:88vh;overflow:auto;box-shadow:0 4px 16px #0005;font:15px Meiryo,sans-serif;line-height:1.7';

 var close=document.createElement('button');
 close.textContent='閉じる';
 close.style='float:right';
 close.onclick=function(){box.remove()};

 var heading=document.createElement('div');
 heading.textContent='【'+scopeLabel+' 一括残業チェック】';
 heading.style='font-weight:700;font-size:17px;margin-bottom:10px';

 var table=document.createElement('table');
 table.style='width:100%;border-collapse:collapse;font-size:14px';
 var head=document.createElement('tr');
 head.innerHTML='<th style="text-align:left;border-bottom:1px solid #ccc;padding:4px">氏名</th><th style="text-align:right;border-bottom:1px solid #ccc;padding:4px">残業時間</th>';
 table.appendChild(head);

 results.forEach(function(r){
  var tr=document.createElement('tr');
  var tdName=document.createElement('td');
  tdName.style='padding:4px;border-bottom:1px solid #eee';

  var nameLink=document.createElement('span');
  nameLink.textContent=r.name+(isManagerRole(r.role)?'('+r.role+')':'');
  nameLink.style='color:#0645ad;text-decoration:underline;cursor:pointer';
  nameLink.title='クリックでこの人のタイムカードを開く';
  nameLink.onclick=async function(){
   showLoading(r.name+'のタイムカードを開いています...');
   var failReason=await navigateToUser(path,r.name);
   hideLoading();
   if(failReason)alert(r.name+'の画面を開けませんでした:\n'+failReason);
  };
  tdName.appendChild(nameLink);

  var tdVal=document.createElement('td');
  tdVal.style='padding:4px;border-bottom:1px solid #eee;text-align:right';

  var detailRow=null;
  if(!r.error&&r.details){
   var hasWarn=r.details.some(function(e){return e.warning;})||(r.henkeiTotal&&r.henkeiTotal<0);
   var detailBtn=document.createElement('button');
   detailBtn.textContent='内訳';
   detailBtn.style='margin-left:8px;padding:1px 8px;font-size:11px';
   tdName.appendChild(detailBtn);

   var detailTd=document.createElement('td');
   detailTd.colSpan=2;
   detailTd.style='padding:0 4px 8px 4px;border-bottom:1px solid #eee';
   var detailBox=buildPersonDetailBox(r.details,r.total,r.henkeiTotal);
   detailBox.style.display='none';
   detailTd.appendChild(detailBox);
   detailRow=document.createElement('tr');
   detailRow.appendChild(detailTd);

   var toggleDetail=function(){
    var open=detailBox.style.display!=='none';
    detailBox.style.display=open?'none':'block';
    detailBtn.textContent=open?'内訳':'内訳を閉じる';
   };
   detailBtn.onclick=toggleDetail;

   if(hasWarn){
    var mark=document.createElement('span');
    mark.textContent=' [!]';
    mark.title='クリックで詳細表示';
    mark.style='color:#c00000;font-weight:700;cursor:pointer';
    mark.onclick=function(e){
     e.stopPropagation();
     toggleDetail();
    };
    tdVal.appendChild(document.createTextNode(hours(r.total)));
    tdVal.appendChild(mark);
   }
  }

  if(r.error){
   tdVal.textContent=r.error;
   tdVal.style.color='#c00000';
  }else if(!tdVal.hasChildNodes()){
   tdVal.textContent=hours(r.total);
  }
  if(!r.error&&r.total/60>34.75)tdVal.style.color='#c00000';

  tr.appendChild(tdName);
  tr.appendChild(tdVal);
  table.appendChild(tr);
  if(detailRow)table.appendChild(detailRow);
 });

 var legend=document.createElement('div');
 if(results.some(function(r){return(r.details&&r.details.some(function(e){return e.warning;}))||(r.henkeiTotal&&r.henkeiTotal<0);})){
  legend.textContent='[！]＝クリックで詳細表示';
  legend.style='color:#c00000;margin-top:10px;font-size:12px';
 }

 var notice=document.createElement('div');
 notice.textContent='ノリで作成したので間違っているかもしれません。\n係長以下＝社員用ロジック、課長以上＝課長用ロジック(深夜のみ)で自動判定しています。\n氏名をクリックするとその人のタイムカードを開けます。\n苦情・修正依頼は気分がいいときに受け付けます。山田';
 notice.style='white-space:pre-line;margin-top:12px;font-size:12px;color:#666';

 var changelog=document.createElement('div');
 changelog.textContent='※時間有給に対応しました。26/08/27';
 changelog.style='color:#0645ad;margin-top:4px;font-size:12px';

 box.appendChild(close);
 box.appendChild(heading);
 box.appendChild(table);
 box.appendChild(legend);
 box.appendChild(notice);
 box.appendChild(changelog);
 document.body.appendChild(box);
}

function isReasonTable(tb){
 return !!tb&&tb.rows.length>3&&/事由1/.test(tb.innerText)&&/事由2/.test(tb.innerText);
}
function findReasonTable(){
 var tables=document.getElementsByTagName('table');
 for(var i=0;i<tables.length;i++)if(isReasonTable(tables[i]))return tables[i];
 return null;
}
function isGapTable(tb){
 return !!tb&&tb.rows.length>1&&/外出1/.test(tb.innerText)&&/再入1/.test(tb.innerText);
}
function findGapTable(){
 var tables=document.getElementsByTagName('table');
 for(var i=0;i<tables.length;i++)if(isGapTable(tables[i]))return tables[i];
 return null;
}
function findMainTable(){
 var tb=document.getElementsByTagName('table')[2];
 return(tb&&!isReasonTable(tb)&&!isGapTable(tb))?tb:null;
}
function clickTabByText(re){
 var anchors=document.querySelectorAll('a');
 for(var i=0;i<anchors.length;i++){
  var tx=(anchors[i].textContent||'').trim();
  if(re.test(tx)&&tx.length<20){anchors[i].click();return true;}
 }
 var all=document.querySelectorAll('li,button');
 for(var j=0;j<all.length;j++){
  var tx2=(all[j].textContent||'').trim();
  if(re.test(tx2)&&tx2.length<20){all[j].click();return true;}
 }
 return false;
}
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
function sleep(ms){
 return new Promise(function(r){setTimeout(r,ms);});
}
function snapshotRadios(){
 return getUserRows().map(function(r){return r.radio;});
}
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
function buildReasonMap(tb){
 var map={};
 for(var r=0;r<tb.rows.length;r++){
  var cells=tb.rows[r].cells;
  if(cells.length>10&&/^\d\d月\d\d日/.test(g(cells[0]))){
   var d=g(cells[0]);
   var reasons=[];
   for(var ci=4;ci<=8;ci++){
    var txt=cells[ci]?g(cells[ci]).trim():'';
    if(txt)reasons.push(txt);
   }
   map[d]={reasons:reasons.join(' / '),kubun:cells[2]?g(cells[2]).trim():''};
  }
 }
 return map;
}
function buildGapMap(tb){
 var map={};
 for(var r=0;r<tb.rows.length;r++){
  var cells=tb.rows[r].cells;
  if(cells.length>10&&/^\d\d月\d\d日/.test(g(cells[0]))){
   var d=g(cells[0]);
   var pairs=[];
   for(var ci=3;ci<=9;ci+=2){
    var out=t(g(cells[ci]));
    var back=t(g(cells[ci+1]));
    if(out>=0&&back>=0){
     if(back<out)back+=1440;
     pairs.push([out,back]);
    }
   }
   if(pairs.length)map[d]=pairs;
  }
 }
 return map;
}

function calcUserTotal(reasonMap,isManager,gapMap){
 var mainTable=findMainTable()||document.getElementsByTagName('table')[2];
 var R=mainTable.rows;
 var u=0,last=0,i,v,d,j,kubun,ea,os0,os,er,oe0,oe,st,en,p,m,w,sc,ec,wait,sub,lv,need,actualIn,actualOut,expected,lateStart,earlyEnd,hasAttendance,dayWarnings,isHenkei,henkeiTotal=0,gap,gapPairs,isNightDuty;
 var details=[];

 for(i=1;i<R.length;i++){
  v=R[i].cells;
  if(v.length>10&&/^\d\d月\d\d日/.test(d=g(v[0]))){
   j=g(v[2]);
   kubun='';
   if(reasonMap&&reasonMap[d]){
    if(reasonMap[d].reasons)j+=' / '+reasonMap[d].reasons;
    kubun=reasonMap[d].kubun||'';
   }
   dayWarnings=[];
   isHenkei=false;
   isNightDuty=false;
   gapPairs=(gapMap&&gapMap[d])||[];

   if(/振替休日/.test(j)){
    sub=Math.min(last,465);
    u-=sub;
    last-=sub;
    if(sub!==0)details.push({text:d+'　振替休日調整：-'+hours(sub)});
    continue;
   }

   ea=z(t(g(v[4])),t(g(v[3])));
   sc=g(v[7]);
   ec=g(v[8]);
   os0=t(sc);
   os=z(t(g(v[9])),os0);
   er=t(g(v[10]));
   oe0=t(ec);
   oe=z(er,oe0);
   wait=/事後報告\s*入力待ち|進行中|xs-tc-badge-orange/.test(sc+ec+h(v[7])+h(v[8]));
   actualIn=t(g(v[5]));
   actualOut=t(g(v[6]));
   lv=leaveMinutes(j);
   isHenkei=/変形/.test(kubun);
   lateStart=lv>0&&ea<0&&actualIn>=0&&actualIn>540+30;
   earlyEnd=lv>0&&er<0&&actualOut>=0&&actualOut<1050-30;
   hasAttendance=ea>=0||er>=0||actualIn>=0||actualOut>=0;

   p=(ea>=0?ea:(isHenkei&&actualIn>=0?actualIn:540))>734;
   st=ea>=0?ea:(isHenkei&&actualIn>=0?roundUp15(actualIn):(lateStart?roundUp15(actualIn):540));
   en=er>=0?er:(isHenkei&&actualOut>=0?roundDown15(actualOut):(earlyEnd?roundDown15(actualOut):(wait&&oe0>=0?oe0:1050)));
   gap=0;
   for(var gi=0;gi<gapPairs.length;gi++)gap+=c(gapPairs[gi][0],gapPairs[gi][1],p);

   if(/\(土\)|\(日\)|休日|出勤登録/.test(d+j)){
    w=c(ea<0?os:ea,oe,p)-gap;
    if(w<0)w=0;
    m=/代付/.test(j)?Math.max(0,w-465):w;
   }else if(isNightDuty=/ナイト当番|緊急/.test(j)&&gapPairs.length>0){
    var nFirstExit=gapPairs[0][0];
    var nLastReentry=gapPairs[gapPairs.length-1][1];
    var nNormal=isManager?night(st,nFirstExit,p):Math.max(0,c(st,nFirstExit,p)-465);
    var nDuty=Math.max(0,en-nLastReentry);
    m=nNormal+nDuty;
    gap=0;
   }else if(isManager){
    var nightGap=0;
    for(var gj=0;gj<gapPairs.length;gj++)nightGap+=night(gapPairs[gj][0],gapPairs[gj][1],p);
    m=Math.max(0,night(st,en,p)-nightGap);
   }else if(isHenkei){
    w=c(st,en,p)-gap;
    m=w-465;
   }else{
    w=c(st,en,p)-gap;
    need=(lv>0&&hasAttendance)?Math.max(0,465-lv):465;
    if(lv>0&&w<need)dayWarnings.push('実働+有給が7.75hに届きません：実働'+hours(w)+'＋有給'+hours(lv)+'＝'+hours(w+lv));
    if(lateStart){
     expected=endForWorkMinutes(540,lv,p);
     if(roundUp15(actualIn)!==expected)dayWarnings.push('有給終了予定('+fmt(expected)+')と出勤時刻('+fmt(roundUp15(actualIn))+')が一致しません');
    }
    if(earlyEnd){
     expected=startForWorkMinutes(1050,lv,p);
     if(roundDown15(actualOut)!==expected)dayWarnings.push('退勤時刻('+fmt(roundDown15(actualOut))+')と有給開始予定('+fmt(expected)+')が一致しません');
    }
    m=Math.max(0,w-need);
   }

   u+=m;
   if(isHenkei)henkeiTotal+=m;
   if(m!==0||dayWarnings.length){
    var label=isHenkei?'変形：'+(m>=0?'+':'')+hours(m):'残業：'+hours(m);
    if(isNightDuty)label+='(ナイト'+hours(nDuty)+')';
    details.push({text:d+'　'+label,warning:dayWarnings.length?'打刻ミスの可能性：\n'+dayWarnings.join('\n'):null,color:isHenkei?'#0645ad':null,gapValue:gap>0?hours(gap):null});
   }
   if(m>0)last=m;
  }
 }

 return{total:u,details:details,henkeiTotal:henkeiTotal};
}

function clickExact(selector,text,root){
 root=root||document;
 var els=root.querySelectorAll(selector);
 for(var i=0;i<els.length;i++){
  if((els[i].textContent||'').trim()===text){els[i].click();return true;}
 }
 return false;
}
function clickDepartmentByName(name){
 var anchors=document.querySelectorAll('li[class*="jstree-node"] > a');
 for(var i=0;i<anchors.length;i++){
  var tx=(anchors[i].textContent||'').trim();
  if(tx===name||tx.indexOf(name)===0){anchors[i].click();return true;}
 }
 return false;
}
function findDeptAnchor(name){
 var anchors=document.querySelectorAll('li[class*="jstree-node"] > a');
 for(var i=0;i<anchors.length;i++){
  var tx=(anchors[i].textContent||'').trim();
  if(tx===name||tx.indexOf(name)===0)return anchors[i];
 }
 return null;
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
function hasDeptTree(){
 return document.querySelectorAll('li[class*="jstree-node"] > a').length>0;
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
function findModalContainer(){
 var heading=null;
 document.querySelectorAll('*').forEach(function(el){
  if(!heading&&el.children.length===0&&(el.textContent||'').trim()==='ユーザーを選択して下さい。')heading=el;
 });
 return heading;
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
function getDepartmentNames(){
 var names=[],seen={};
 var anchors=document.querySelectorAll('li[class*="jstree-node"] > a');
 for(var i=0;i<anchors.length;i++){
  var tx=(anchors[i].textContent||'').trim();
  if(tx&&tx!=='すべて'&&!seen[tx]){seen[tx]=true;names.push(tx);}
 }
 return names;
}
var BACK_SENTINEL='__BACK__';
function chooseDepartment(options,titleText,showBack){
 var normalized=options.map(function(o){return(typeof o==='string')?{label:o,value:o}:o;});
 return new Promise(function(resolve){
  var old=document.getElementById('__zangyo_deptchooser');
  if(old)old.remove();
  var box=document.createElement('div');
  box.id='__zangyo_deptchooser';
  box.style='position:fixed;top:12px;right:12px;z-index:999999;background:white;color:black;border:2px solid #333;padding:14px 16px;width:280px;max-width:90vw;max-height:80vh;overflow:auto;box-shadow:0 4px 16px #0005;font:15px Meiryo,sans-serif;line-height:1.6';

  var title=document.createElement('div');
  title.textContent=titleText||'一括チェックする部署を選んでください';
  title.style='font-weight:700;margin-bottom:10px';
  box.appendChild(title);

  if(showBack){
   var back=document.createElement('button');
   back.textContent='← 戻る';
   back.style='display:block;width:100%;text-align:left;padding:8px;margin-bottom:10px;color:#555';
   back.onclick=function(){box.remove();resolve(BACK_SENTINEL);};
   box.appendChild(back);
  }

  normalized.forEach(function(opt){
   var btn=document.createElement('button');
   btn.textContent=opt.label;
   btn.style=opt.isAll
    ?'display:block;width:100%;text-align:left;padding:8px;margin-bottom:10px;font-weight:700;background:#fff3cd;border:1px solid #e0c060'
    :'display:block;width:100%;text-align:left;padding:8px;margin-bottom:6px';
   btn.onclick=function(){box.remove();resolve(opt.value);};
   box.appendChild(btn);
  });

  var cancel=document.createElement('button');
  cancel.textContent='キャンセル';
  cancel.style='display:block;width:100%;text-align:left;padding:8px;margin-top:6px;color:#c00000';
  cancel.onclick=function(){box.remove();resolve(null);};
  box.appendChild(cancel);

  document.body.appendChild(box);
 });
}
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
function escapeRegex(s){
 return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
}
function userLoaded(name){
 var re=new RegExp(escapeRegex(name)+'\\s*さんのタイムカードです');
 return re.test(document.body.innerText)&&!!findMainTable();
}
async function run(){
if(window.__zangyoBulkRunning){alert('すでに一括チェックが実行中です。完了までお待ちください。');return;}
window.__zangyoBulkRunning=true;
window.__zangyoBulkStopRequested=false;
var prevResult=document.getElementById('__zangyo_result');
if(prevResult)prevResult.remove();
try{
 if(!await openUserPickerModal()){alert('システム設定→タイムカード一覧画面で実行してください。');return;}

 var deptNames=await waitFor(function(){var n=getDepartmentNames();return n.length>0?n:null;},8000);
 if(!deptNames){alert('部署一覧が取得できませんでした。');return;}

 var path=[];
 var ALL_SENTINEL='ALL';
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
  var options=[{label:label+'（全体）',value:ALL_SENTINEL,isAll:true}].concat(shortenChildLabels(label,children));
  var next=await chooseDepartment(options,label+'の中から選んでください',true);
  if(next===BACK_SENTINEL){
   path.pop();
   continue;
  }
  if(!next)return;
  if(next===ALL_SENTINEL){
   await collapseIfExpanded(label);
   break;
  }
  path.push(next);
 }
 var scopeLabel=path[path.length-1];

 var prevRadiosInit=snapshotRadios();
 if(!await selectScopePath(path)){alert('部署「'+scopeLabel+'」の選択に失敗しました。');return;}
 var ready=await waitForRowsRefreshed(prevRadiosInit,8000);
 if(!ready){alert('「'+scopeLabel+'」の社員一覧が読み込めませんでした。');return;}

 var initialRows=getUserRows();
 if(initialRows.length===0){alert('「'+scopeLabel+'」に社員が見つかりませんでした。');return;}
 var targets=initialRows.map(function(r){return{name:r.name,role:r.role};});

 var results=[];

 for(var idx=0;idx<targets.length;idx++){
  if(window.__zangyoBulkStopRequested)break;
  var name=targets[idx].name;
  var role=targets[idx].role;
  showLoading((idx+1)+'/'+targets.length+'人目\n'+name+(isManagerRole(role)?'('+role+')':'')+' を処理中...');

  var failReason=await navigateToUser(path,name);
  if(failReason){results.push({name:name,role:role,error:failReason});continue;}

  var reasonMap=null;
  if(clickTabByText(/^事由申請/)){
   var reasonTable=await waitFor(findReasonTable,8000);
   if(reasonTable)reasonMap=buildReasonMap(reasonTable);
   clickTabByText(/^勤怠申請/);
   await waitFor(findMainTable,8000);
  }

  var gapMap=null;
  if(clickTabByText(/^再出動管理/)){
   var gapTable=await waitFor(findGapTable,8000);
   if(gapTable)gapMap=buildGapMap(gapTable);
   clickTabByText(/^勤怠申請/);
   await waitFor(findMainTable,8000);
  }

  var calcResult=calcUserTotal(reasonMap,isManagerRole(role),gapMap);
  results.push({name:name,role:role,total:calcResult.total,details:calcResult.details,henkeiTotal:calcResult.henkeiTotal});
 }

 hideLoading();
 if(window.__zangyoBulkStopRequested)scopeLabel+='(途中で停止)';
 showSummary(path,scopeLabel,results);
}catch(e){
 hideLoading();
 alert('エラー:'+e.message);
}finally{
 window.__zangyoBulkRunning=false;
}
}

run();
})();
