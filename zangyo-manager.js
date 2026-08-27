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
function roundUp15(min){return Math.ceil(min/15)*15;}
function roundDown15(min){return Math.floor(min/15)*15;}
function leaveMinutes(j){
 var m=j.match(/(\d+(?:\.\d+)?)\s*[hHｈＨ]\s*有/);
 return m?Math.round(parseFloat(m[1])*60):0;
}
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
function show(title,u,details){
 var rem=44.75-u/60;
 var old=document.getElementById('__zangyo_result');
 if(old)old.remove();

 var box=document.createElement('div');
 var close=document.createElement('button');
 var heading=document.createElement('div');
 var total=document.createElement('div');
 var remaining=document.createElement('div');
 var detailButton=document.createElement('button');
 var detailBox=document.createElement('div');
 var notice=document.createElement('div');

 box.id='__zangyo_result';
 box.style='position:fixed;top:12px;right:12px;z-index:999999;background:white;color:black;border:2px solid #333;padding:14px 16px;width:430px;max-width:92vw;max-height:88vh;overflow:auto;box-shadow:0 4px 16px #0005;font:15px Meiryo,sans-serif;line-height:1.7';

 close.textContent='閉じる';
 close.style='float:right';
 close.onclick=function(){box.remove()};

 heading.textContent='【'+title+' 残業チェック】';
 heading.style='font-weight:700;font-size:17px;margin-bottom:8px';

 total.textContent='残業合計：'+hours(u);

 remaining.textContent='45h超リミット＝44.75hまで残り：'+rem.toFixed(2)+'h';
 if(rem<10)remaining.style='color:#c00000;font-weight:700';

 detailButton.textContent='内訳';
 detailButton.style='margin-top:10px;padding:4px 14px';

 var hasWarning=details.some(function(entry){return entry.warning;});
 var warnLabel=document.createElement('span');
 if(hasWarning){
  warnLabel.textContent=' ⚠注意事項あり[！]';
  warnLabel.style='color:#c00000;font-weight:700;margin-left:8px';
 }

 detailBox.style='display:none;margin-top:8px;padding:8px;background:#f5f5f5;border:1px solid #ccc;font-size:13px';
 if(!details.length){
  detailBox.textContent='残業・調整はありません。';
 }else{
  details.forEach(function(entry){
   var line=document.createElement('div');
   line.textContent=entry.text;
   if(entry.warning){
    var mark=document.createElement('span');
    mark.textContent=' [!]';
    mark.title='クリックで詳細表示';
    mark.style='color:#c00000;font-weight:700;cursor:pointer';
    var warnBox=document.createElement('div');
    warnBox.textContent='⚠ '+entry.warning;
    warnBox.style='display:none;color:#c00000;white-space:pre-line;margin:2px 0 6px 12px;font-size:12px';
    mark.onclick=function(){
     warnBox.style.display=warnBox.style.display==='none'?'block':'none';
    };
    line.appendChild(mark);
    detailBox.appendChild(line);
    detailBox.appendChild(warnBox);
   }else{
    detailBox.appendChild(line);
   }
  });
  if(hasWarning){
   var legend=document.createElement('div');
   legend.textContent='[！]＝クリックで詳細表示';
   legend.style='color:#c00000;margin-top:6px';
   detailBox.appendChild(legend);
  }
 }

 detailButton.onclick=function(){
  var open=detailBox.style.display!=='none';
  detailBox.style.display=open?'none':'block';
  detailButton.textContent=open?'内訳':'内訳を閉じる';
 };

 notice.textContent='ノリで作成したので間違っているかもしれません。\nややこしい勤務形態には対応できていません。\n苦情・修正依頼は気分がいいときに受け付けます。山田';
 notice.style='white-space:pre-line;margin-top:12px';

 var changelog=document.createElement('div');
 changelog.textContent='※8/27 変形時差・時間有給に対応しました。(たぶん)';
 changelog.style='color:#0645ad;margin-top:4px';

 box.appendChild(close);
 box.appendChild(heading);
 box.appendChild(total);
 box.appendChild(remaining);
 box.appendChild(detailButton);
 box.appendChild(warnLabel);
 box.appendChild(detailBox);
 box.appendChild(notice);
 box.appendChild(changelog);
 document.body.appendChild(box);
}

function showLoading(msg){
 var old=document.getElementById('__zangyo_loading');
 if(old)old.remove();
 var box=document.createElement('div');
 box.id='__zangyo_loading';
 box.style='position:fixed;top:12px;right:12px;z-index:999999;background:white;color:#333;border:2px solid #333;padding:10px 14px;font:14px Meiryo,sans-serif;box-shadow:0 4px 16px #0005';
 box.textContent=msg;
 document.body.appendChild(box);
}
function hideLoading(){
 var old=document.getElementById('__zangyo_loading');
 if(old)old.remove();
}

function isReasonTable(tb){
 return !!tb&&tb.rows.length>3&&/事由1/.test(tb.innerText)&&/事由2/.test(tb.innerText);
}
function findReasonTable(){
 var tables=document.getElementsByTagName('table');
 for(var i=0;i<tables.length;i++)if(isReasonTable(tables[i]))return tables[i];
 return null;
}
function findMainTable(){
 var tb=document.getElementsByTagName('table')[2];
 return(tb&&!isReasonTable(tb))?tb:null;
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

function runCalc(reasonMap){
 var mainTable=findMainTable()||document.getElementsByTagName('table')[2];
 var R=mainTable.rows;
 var u=0,last=0,i,v,d,j,ea,os0,os,er,oe0,oe,st,en,p,m,w,sc,ec,wait,sub,lv,need,actualIn,actualOut,expected,dayWarnings,lateStart,earlyEnd,hasAttendance,isHenkei,henkeiTotal=0;
 var details=[];

 for(i=1;i<R.length;i++){
  v=R[i].cells;
  if(v.length>10&&/^\d\d月\d\d日/.test(d=g(v[0]))){
   j=g(v[2]);
   if(reasonMap&&reasonMap[d]&&reasonMap[d].reasons)j+=' / '+reasonMap[d].reasons;
   dayWarnings=[];
   isHenkei=false;

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
   wait=/事後報告\s*入力待ち|xs-tc-badge-orange/.test(sc+ec+h(v[7])+h(v[8]));
   actualIn=t(g(v[5]));
   actualOut=t(g(v[6]));
   lv=leaveMinutes(j);
   lateStart=lv>0&&ea<0&&actualIn>=0&&actualIn>540+30;
   earlyEnd=lv>0&&er<0&&actualOut>=0&&actualOut<1050-30;
   hasAttendance=ea>=0||er>=0||actualIn>=0||actualOut>=0;

   p=(ea>=0?ea:540)>734;
   st=ea>=0?ea:(lateStart?roundUp15(actualIn):540);
   en=er>=0?er:(earlyEnd?roundDown15(actualOut):(wait&&oe0>=0?oe0:1050));

   if(/\(土\)|\(日\)|休日|出勤登録/.test(d+j)){
    w=c(ea<0?os:ea,oe,p);
    if(w<0)w=0;
    m=/代付/.test(j)?Math.max(0,w-465):w;
   }else{
    w=c(st,en,p);
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
    m=night(st,en,p);
   }

   u+=m;
   if(m!==0||dayWarnings.length)details.push({text:d+'　残業：'+hours(m),warning:dayWarnings.length?'打刻ミスの可能性：\n'+dayWarnings.join('\n'):null});
   if(m>0)last=m;
  }
 }

 show('課長用',u,details);
}

async function run(){
try{
 var reasonMap=null;

 if(clickTabByText(/^事由申請/)){
  showLoading('事由申請データを読み込み中...');
  var reasonTable=await waitFor(findReasonTable,8000);
  if(reasonTable)reasonMap=buildReasonMap(reasonTable);

  clickTabByText(/^勤怠申請/);
  await waitFor(findMainTable,8000);
  hideLoading();
 }

 runCalc(reasonMap);
}catch(e){
 hideLoading();
 alert('エラー:'+e.message);
}
}

run();
})();
