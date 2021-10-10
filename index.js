(function(){var MINUTES_PER_DAY,MINUTES_PER_WEEK,colourPalette,colours,currentTime,currentTimeMarker,dayLength,dayNames,displayDuration,displayTime,earliestTime,getTimeUntilNext,latestTime,meetingses,parseTime,renderAxisMarker,renderCurrentTime,renderDay,renderMeeting,schedule,timeToPosition,modulo=function(a,b){return(+a%(b=+b)+b)%b};parseTime=function(time){var amPm,hour,minute;[,hour,minute,amPm]=time.match(/(\d+):(\d+)([ap])/);return(amPm==="a"?+hour:hour==="12"?12:+hour+12)*60+ +minute};schedule=[{id:"MATH18",type:"lecture",name:"MATH18 B00 @ RCLAS (LE)",day:1,start:780,end:830,zoom:window.location.hash.slice(1)},{id:"CSE11",type:"discussion",name:"CSE11 C01 @ PCYNH120 (DI)",day:1,start:900,end:950,disabled:true},{id:"CSE11",type:"lecture",name:"CSE11 C00 @ CENTR119 (LE)",day:1,start:960,end:1010},{id:"MATH20C",type:"lecture",name:"MATH20C E00 @ CENTR115 (LE)",day:1,start:1020,end:1070},{id:"CAT1",type:"lecture",name:"CAT1 D00 @ MOS0114 (LE)",day:2,start:570,end:650},{id:"MATH18",type:"discussion",name:"MATH18 B21 @ YORK3000A (DI)",day:2,start:720,end:770},{id:"MATH18",type:"lecture",name:"MATH18 B00 @ RCLAS (LE)",day:3,start:780,end:830,zoom:window.location.hash.slice(1)},{id:"CSE11",type:"lecture",name:"CSE11 C00 @ CENTR119 (LE)",day:3,start:960,end:1010},{id:"MATH20C",type:"lecture",name:"MATH20C E00 @ CENTR115 (LE)",day:3,start:1020,end:1070},{id:"CAT1",type:"lecture",name:"CAT1 D00 @ MOS0114 (LE)",day:4,start:570,end:650},{id:"MATH20C",type:"discussion",name:"MATH20C E06 @ YORK3000A (DI)",day:4,start:660,end:710},{id:"CAT1",type:"discussion",name:"CAT1 D07 @ MANDEB-146 (DI)",day:4,start:720,end:770},{id:"MATH18",type:"lecture",name:"MATH18 B00 @ RCLAS (LE)",day:5,start:780,end:830,zoom:window.location.hash.slice(1)},{id:"CSE11",type:"lecture",name:"CSE11 C00 @ CENTR119 (LE)",day:5,start:960,end:1010},{id:"MATH20C",type:"lecture",name:"MATH20C E00 @ CENTR115 (LE)",day:5,start:1020,end:1070}];displayTime=function(time){return[Math.floor(time/60),time%60].map((function(num){return num.toString().padStart(2,"0")})).join(":")};earliestTime=schedule.reduce((function(acc,curr){if(acc.start<curr.start){return acc}else{return curr}})).start;latestTime=schedule.reduce((function(acc,curr){if(acc.end>curr.end){return acc}else{return curr}})).end;dayLength=latestTime-earliestTime;timeToPosition=function(time,percent=true){return(time-earliestTime)/dayLength*100+(percent?"%":"")};colourPalette=["red","orange","yellow","lime","cyan","blue","purple","magenta"];colours=new Map;renderMeeting=function({id:id,type:type,name:name,start:start,end:end,zoom:zoom,disabled:disabled}){var colour,meeting;colour=colours.get(id);if(colour==null){colours.set(id,colour=colourPalette.pop())}meeting=$("<div>").addClass(["meeting",type]).append($("<p>").addClass("name").text(name)).append($("<p>").addClass("time").text(`${displayTime(start)}–${displayTime(end)}`)).css("top",timeToPosition(start)).css("bottom",`${(dayLength-(end-earliestTime))/dayLength*100}%`).css("border-left-color",colour);if(zoom!=null){meeting.append($("<a>").attr("href",zoom).attr("target","_blank").addClass("zoom").text("züm"))}if(disabled){meeting.addClass("disabled")}return meeting};meetingses=[];dayNames=["sunday","nonday","tuesday","wensday","thursday","fridee","saturday"];renderDay=function(day){var meeting;return[$("<h2>").addClass("day-name").text(dayNames[day]),meetingses[day]=$("<div>").addClass("meetings").append(function(){var i,len,results;results=[];for(i=0,len=schedule.length;i<len;i++){meeting=schedule[i];if(meeting.day===day){results.push(renderMeeting(meeting))}}return results}())]};renderAxisMarker=function(hour){return $("<div>").addClass("axis-marker").text(`${hour.toString().padStart(2,"0")}:00`).css("top",timeToPosition(hour*60))};currentTime=function(){var timeZoneFormatter;timeZoneFormatter=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",hour12:false,weekday:"short",era:"short",year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric",second:"numeric"});return function(){var date,datetime,day,era,fullYear,hour,minute,month,now,second,time,weekday,year;datetime=timeZoneFormatter.format(now=new Date);[weekday,date,fullYear,time]=datetime.split(/,\s+/);[month,day]=date.split(" ");[year,era]=fullYear.split(" ");[hour,minute,second]=time.split(":");hour=hour==="24"?0:+hour;return{date:{year:era==="BC"?-year+1:+year,month:+month-1,day:+day},weekday:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(weekday),minutes:hour*60+ +minute+(+second+now.getMilliseconds()/1e3)/60}}}();currentTimeMarker=$("<div>").addClass("current-time");renderCurrentTime=function(){var minutes,position,weekday;({weekday:weekday,minutes:minutes}=currentTime());if(meetingses[weekday]&&meetingses[weekday].has(currentTimeMarker).length===0){meetingses[weekday].append(currentTimeMarker)}position=timeToPosition(minutes,false);if(position<-10||position>110){return currentTimeMarker.css("display","none")}else{currentTimeMarker.css("display","");currentTimeMarker.css("top",position+"%");return currentTimeMarker.css("opacity",function(){switch(position){case position<0:return(10+position)/10;case position>100:return(110-position)/10;default:return 1}}())}};MINUTES_PER_DAY=24*60;MINUTES_PER_WEEK=MINUTES_PER_DAY*7;displayDuration=function(duration){var days,hours,mins;switch(false){case duration!==0:return"no time";case!(duration<1):return(duration*60).toFixed(3+"s");case!(duration<MINUTES_PER_DAY):hours=Math.floor(duration/60);mins=Math.floor(duration%60);return`${hours}h ${mins}m`;default:days=Math.floor(duration/MINUTES_PER_DAY);hours=Math.floor(duration/60%24);return`${days}d ${hours}h`}};getTimeUntilNext=function(){var enabledMeetings,meeting,minutes,nextMeetingIndex,now,weekday;({weekday:weekday,minutes:minutes}=now=currentTime());enabledMeetings=schedule.filter((function({disabled:disabled}){return!disabled}));nextMeetingIndex=enabledMeetings.findIndex((function({day:day,end:end}){return day>weekday||day===weekday&&end>minutes}));meeting=nextMeetingIndex===-1?enabledMeetings[0]:enabledMeetings[nextMeetingIndex];if(nextMeetingIndex!==-1&&weekday===meeting.day&&minutes>=meeting.start){return{meeting:meeting,type:"end",time:meeting.day*MINUTES_PER_DAY+meeting.end,now:now}}else{return{meeting:meeting,type:"start",time:meeting.day*MINUTES_PER_DAY+meeting.start,now:now}}};$(document).ready((function(){var NOTIF_TIME,PERIOD,day,hour,lastNotif,lastTitle,paint,tick,weekdays;weekdays=[1,2,3,4,5];if(schedule.find((function(meeting){return meeting.day===0||meeting.day===6}))){weekdays.push(6,0)}$("#days").append(function(){var i,len,results;results=[];for(i=0,len=weekdays.length;i<len;i++){day=weekdays[i];results.push(renderDay(day))}return results}().flat()).css("--rows",weekdays.length).append($("<div>").addClass("axis").append(function(){var i,ref,ref1,results;results=[];for(hour=i=ref=Math.floor(earliestTime/60),ref1=Math.floor(latestTime/60);ref<=ref1?i<=ref1:i>=ref1;hour=ref<=ref1?++i:--i){results.push(renderAxisMarker(hour))}return results}()));$("#notif-perm").click((function(){return Notification.requestPermission().then((function(){return $("#notif-perm").hide()})).catch(console.error)}));if(Notification.permission==="granted"){$("#notif-perm").hide()}lastTitle=null;lastNotif=null;NOTIF_TIME=5;(tick=function(){var meeting,minutes,notification,time,timeUntil,title,type,weekday;({meeting:meeting,type:type,time:time,now:{weekday:weekday,minutes:minutes}}=getTimeUntilNext());timeUntil=modulo(time-(weekday*MINUTES_PER_DAY+minutes),MINUTES_PER_WEEK);title=`${displayDuration(timeUntil)} until ${meeting.name} ${type}s · uxdy`;if(title!==lastTitle){document.title=lastTitle=title;$("#status").text(title)}if(Notification.permission==="granted"){if(meeting.zoom!=null&&type==="start"){if(timeUntil<=NOTIF_TIME){if(lastNotif!==meeting){lastNotif=meeting;notification=new Notification(title,{body:"click to open linkk"});return notification.addEventListener("click",(function(){return window.open(meeting.zoom,"_blank").focus()}))}}else{return lastNotif=null}}}})();setInterval(tick,1e3);PERIOD=6e4/89;return(paint=function(){var t;renderCurrentTime();t=Date.now()*Math.PI/PERIOD;$("#vibing").css("transform",`skewX(${3*Math.atan(5*Math.cos(t))}deg) scaleY(${1-Math.sin(t)**20*.1})`);return window.requestAnimationFrame(paint)})()}))}).call(this);(function(){window.schedule=[{END_MM_TIME:50,LONG_DESC:"                              ",TERM_CODE:"FA21",SECT_CREDIT_HRS:4,BEGIN_HH_TIME:9,SECTION_NUMBER:50710,SUBJ_CODE:"CAT ",GRADE_OPTN_CD_PLUS:" ",WT_POS:"",PRIMARY_INSTR_FLAG:"Y",ROOM_CODE:"0114 ",FK_PCH_INTRL_REFID:2122934,CRSE_TITLE:"Culture, Art & Technology 1   ",END_HH_TIME:10,GRADE_OPTION:"L",START_DATE:"2021-09-23",CRSE_CODE:"  1  ",DAY_CODE:"2",BEGIN_MM_TIME:30,NEED_HEADROW:false,PERSON_FULL_NAME:"Chodorow, Stanley A.               ",FK_SPM_SPCL_MTG_CD:"  ",PERSON_ID:"A16948219",BLDG_CODE:"MOS  ",SECT_CREDIT_HRS_PL:" ",SECTION_HEAD:50717,ENROLL_STATUS:"EN",FK_CDI_INSTR_TYPE:"LE",SECT_CODE:"D00",FK_SEC_SCTN_NUM:50717},{END_MM_TIME:50,LONG_DESC:"                              ",TERM_CODE:"FA21",SECT_CREDIT_HRS:4,BEGIN_HH_TIME:9,SECTION_NUMBER:50710,SUBJ_CODE:"CAT ",GRADE_OPTN_CD_PLUS:" ",WT_POS:"",PRIMARY_INSTR_FLAG:"Y",ROOM_CODE:"0114 ",FK_PCH_INTRL_REFID:2122934,CRSE_TITLE:"Culture, Art & Technology 1   ",END_HH_TIME:10,GRADE_OPTION:"L",START_DATE:"2021-09-23",CRSE_CODE:"  1  ",DAY_CODE:"4",BEGIN_MM_TIME:30,NEED_HEADROW:false,PERSON_FULL_NAME:"Chodorow, Stanley A.               ",FK_SPM_SPCL_MTG_CD:"  ",PERSON_ID:"A16948219",BLDG_CODE:"MOS  ",SECT_CREDIT_HRS_PL:" ",SECTION_HEAD:50717,ENROLL_STATUS:"EN",FK_CDI_INSTR_TYPE:"LE",SECT_CODE:"D00",FK_SEC_SCTN_NUM:50717},{END_MM_TIME:50,LONG_DESC:"                              ",SCTN_CPCTY_QTY:17,TERM_CODE:"FA21",SCTN_ENRLT_QTY:17,SECT_CREDIT_HRS:4,BEGIN_HH_TIME:12,END_DATE:"2021-12-03",SECTION_NUMBER:50717,STP_ENRLT_FLAG:"N",SUBJ_CODE:"CAT ",GRADE_OPTN_CD_PLUS:" ",WT_POS:"",COUNT_ON_WAITLIST:null,PRIMARY_INSTR_FLAG:"Y",ROOM_CODE:"B-146",FK_PCH_INTRL_REFID:2122934,CRSE_TITLE:"Culture, Art & Technology 1   ",END_HH_TIME:12,GRADE_OPTION:"L",START_DATE:"2021-09-23",CRSE_CODE:"  1  ",DAY_CODE:"4",BEGIN_MM_TIME:0,NEED_HEADROW:false,PERSON_FULL_NAME:"Chodorow, Stanley A.               ",FK_SPM_SPCL_MTG_CD:"  ",PERSON_ID:"A16948219",BLDG_CODE:"MANDE",SECT_CREDIT_HRS_PL:" ",SECTION_HEAD:50717,ENROLL_STATUS:"EN",FK_CDI_INSTR_TYPE:"DI",SECT_CODE:"D07",FK_SEC_SCTN_NUM:50717},{END_MM_TIME:59,LONG_DESC:"                              ",TERM_CODE:"FA21",SECT_CREDIT_HRS:4,BEGIN_HH_TIME:8,SECTION_NUMBER:50710,SUBJ_CODE:"CAT ",GRADE_OPTN_CD_PLUS:" ",WT_POS:"",PRIMARY_INSTR_FLAG:"Y",ROOM_CODE:"0114 ",FK_PCH_INTRL_REFID:2122934,CRSE_TITLE:"Culture, Art & Technology 1   ",END_HH_TIME:10,GRADE_OPTION:"L",START_DATE:"2021-12-09",CRSE_CODE:"  1  ",DAY_CODE:"4",BEGIN_MM_TIME:0,NEED_HEADROW:false,PERSON_FULL_NAME:"Chodorow, Stanley A.               ",PB_FRIEND:true,FK_SPM_SPCL_MTG_CD:"FI",PERSON_ID:"A16948219",BLDG_CODE:"MOS  ",SECT_CREDIT_HRS_PL:" ",SECTION_HEAD:50717,ENROLL_STATUS:"EN",FK_CDI_INSTR_TYPE:"FI",SECT_CODE:"D00",FK_SEC_SCTN_NUM:50717},{END_MM_TIME:50,LONG_DESC:"                              ",TERM_CODE:"FA21",SECT_CREDIT_HRS:4,BEGIN_HH_TIME:16,SECTION_NUMBER:53085,SUBJ_CODE:"CSE ",GRADE_OPTN_CD_PLUS:"+",WT_POS:"",PRIMARY_INSTR_FLAG:"Y",ROOM_CODE:"119  ",FK_PCH_INTRL_REFID:2122934,CRSE_TITLE:"Accel. Intro to Programming   ",END_HH_TIME:16,GRADE_OPTION:"L",START_DATE:"2021-09-23",CRSE_CODE:" 11  ",DAY_CODE:"1",BEGIN_MM_TIME:0,NEED_HEADROW:false,PERSON_FULL_NAME:"Miranda, Gregory Joseph            ",FK_SPM_SPCL_MTG_CD:"  ",PERSON_ID:"A16948219",BLDG_CODE:"CENTR",SECT_CREDIT_HRS_PL:" ",SECTION_HEAD:53086,ENROLL_STATUS:"EN",FK_CDI_INSTR_TYPE:"LE",SECT_CODE:"C00",FK_SEC_SCTN_NUM:53086},{END_MM_TIME:50,LONG_DESC:"                              ",TERM_CODE:"FA21",SECT_CREDIT_HRS:4,BEGIN_HH_TIME:16,SECTION_NUMBER:53085,SUBJ_CODE:"CSE ",GRADE_OPTN_CD_PLUS:"+",WT_POS:"",PRIMARY_INSTR_FLAG:"Y",ROOM_CODE:"119  ",FK_PCH_INTRL_REFID:2122934,CRSE_TITLE:"Accel. Intro to Programming   ",END_HH_TIME:16,GRADE_OPTION:"L",START_DATE:"2021-09-23",CRSE_CODE:" 11  ",DAY_CODE:"3",BEGIN_MM_TIME:0,NEED_HEADROW:false,PERSON_FULL_NAME:"Miranda, Gregory Joseph            ",FK_SPM_SPCL_MTG_CD:"  ",PERSON_ID:"A16948219",BLDG_CODE:"CENTR",SECT_CREDIT_HRS_PL:" ",SECTION_HEAD:53086,ENROLL_STATUS:"EN",FK_CDI_INSTR_TYPE:"LE",SECT_CODE:"C00",FK_SEC_SCTN_NUM:53086},{END_MM_TIME:50,LONG_DESC:"                              ",TERM_CODE:"FA21",SECT_CREDIT_HRS:4,BEGIN_HH_TIME:16,SECTION_NUMBER:53085,SUBJ_CODE:"CSE ",GRADE_OPTN_CD_PLUS:"+",WT_POS:"",PRIMARY_INSTR_FLAG:"Y",ROOM_CODE:"119  ",FK_PCH_INTRL_REFID:2122934,CRSE_TITLE:"Accel. Intro to Programming   ",END_HH_TIME:16,GRADE_OPTION:"L",START_DATE:"2021-09-23",CRSE_CODE:" 11  ",DAY_CODE:"5",BEGIN_MM_TIME:0,NEED_HEADROW:false,PERSON_FULL_NAME:"Miranda, Gregory Joseph            ",FK_SPM_SPCL_MTG_CD:"  ",PERSON_ID:"A16948219",BLDG_CODE:"CENTR",SECT_CREDIT_HRS_PL:" ",SECTION_HEAD:53086,ENROLL_STATUS:"EN",FK_CDI_INSTR_TYPE:"LE",SECT_CODE:"C00",FK_SEC_SCTN_NUM:53086},{END_MM_TIME:50,LONG_DESC:"                              ",SCTN_CPCTY_QTY:49,TERM_CODE:"FA21",SCTN_ENRLT_QTY:49,SECT_CREDIT_HRS:4,BEGIN_HH_TIME:15,END_DATE:"2021-12-03",SECTION_NUMBER:53086,STP_ENRLT_FLAG:"Y",SUBJ_CODE:"CSE ",GRADE_OPTN_CD_PLUS:"+",WT_POS:"",COUNT_ON_WAITLIST:10,PRIMARY_INSTR_FLAG:"Y",ROOM_CODE:"120  ",FK_PCH_INTRL_REFID:2122934,CRSE_TITLE:"Accel. Intro to Programming   ",END_HH_TIME:15,GRADE_OPTION:"L",START_DATE:"2021-09-23",CRSE_CODE:" 11  ",DAY_CODE:"1",BEGIN_MM_TIME:0,NEED_HEADROW:false,PERSON_FULL_NAME:"Miranda, Gregory Joseph            ",FK_SPM_SPCL_MTG_CD:"  ",PERSON_ID:"A16948219",BLDG_CODE:"PCYNH",SECT_CREDIT_HRS_PL:" ",SECTION_HEAD:53086,ENROLL_STATUS:"EN",FK_CDI_INSTR_TYPE:"DI",SECT_CODE:"C01",FK_SEC_SCTN_NUM:53086},{END_MM_TIME:59,LONG_DESC:"                              ",TERM_CODE:"FA21",SECT_CREDIT_HRS:4,BEGIN_HH_TIME:15,SECTION_NUMBER:53085,SUBJ_CODE:"CSE ",GRADE_OPTN_CD_PLUS:"+",WT_POS:"",PRIMARY_INSTR_FLAG:"Y",ROOM_CODE:"115  ",FK_PCH_INTRL_REFID:2122934,CRSE_TITLE:"Accel. Intro to Programming   ",END_HH_TIME:17,GRADE_OPTION:"L",START_DATE:"2021-12-04",CRSE_CODE:" 11  ",DAY_CODE:"6",BEGIN_MM_TIME:0,NEED_HEADROW:false,PERSON_FULL_NAME:"Miranda, Gregory Joseph            ",PB_FRIEND:true,FK_SPM_SPCL_MTG_CD:"FI",PERSON_ID:"A16948219",BLDG_CODE:"CENTR",SECT_CREDIT_HRS_PL:" ",SECTION_HEAD:53086,ENROLL_STATUS:"EN",FK_CDI_INSTR_TYPE:"FI",SECT_CODE:"C00",FK_SEC_SCTN_NUM:53086},{END_MM_TIME:50,LONG_DESC:"                              ",TERM_CODE:"FA21",SECT_CREDIT_HRS:4,BEGIN_HH_TIME:13,SECTION_NUMBER:51423,SUBJ_CODE:"MATH",GRADE_OPTN_CD_PLUS:"+",WT_POS:"",PRIMARY_INSTR_FLAG:"Y",ROOM_CODE:"R107 ",FK_PCH_INTRL_REFID:2122934,CRSE_TITLE:"Linear Algebra                ",END_HH_TIME:13,GRADE_OPTION:"L",START_DATE:"2021-09-23",CRSE_CODE:" 18  ",DAY_CODE:"1",BEGIN_MM_TIME:0,NEED_HEADROW:false,PERSON_FULL_NAME:"Zelmanov, Efim I                   ",FK_SPM_SPCL_MTG_CD:"  ",PERSON_ID:"A16948219",BLDG_CODE:"RCLAS",SECT_CREDIT_HRS_PL:" ",SECTION_HEAD:59172,ENROLL_STATUS:"EN",FK_CDI_INSTR_TYPE:"LE",SECT_CODE:"B00",FK_SEC_SCTN_NUM:59172},{END_MM_TIME:50,LONG_DESC:"                              ",TERM_CODE:"FA21",SECT_CREDIT_HRS:4,BEGIN_HH_TIME:13,SECTION_NUMBER:51423,SUBJ_CODE:"MATH",GRADE_OPTN_CD_PLUS:"+",WT_POS:"",PRIMARY_INSTR_FLAG:"Y",ROOM_CODE:"R107 ",FK_PCH_INTRL_REFID:2122934,CRSE_TITLE:"Linear Algebra                ",END_HH_TIME:13,GRADE_OPTION:"L",START_DATE:"2021-09-23",CRSE_CODE:" 18  ",DAY_CODE:"3",BEGIN_MM_TIME:0,NEED_HEADROW:false,PERSON_FULL_NAME:"Zelmanov, Efim I                   ",FK_SPM_SPCL_MTG_CD:"  ",PERSON_ID:"A16948219",BLDG_CODE:"RCLAS",SECT_CREDIT_HRS_PL:" ",SECTION_HEAD:59172,ENROLL_STATUS:"EN",FK_CDI_INSTR_TYPE:"LE",SECT_CODE:"B00",FK_SEC_SCTN_NUM:59172},{END_MM_TIME:50,LONG_DESC:"                              ",TERM_CODE:"FA21",SECT_CREDIT_HRS:4,BEGIN_HH_TIME:13,SECTION_NUMBER:51423,SUBJ_CODE:"MATH",GRADE_OPTN_CD_PLUS:"+",WT_POS:"",PRIMARY_INSTR_FLAG:"Y",ROOM_CODE:"R107 ",FK_PCH_INTRL_REFID:2122934,CRSE_TITLE:"Linear Algebra                ",END_HH_TIME:13,GRADE_OPTION:"L",START_DATE:"2021-09-23",CRSE_CODE:" 18  ",DAY_CODE:"5",BEGIN_MM_TIME:0,NEED_HEADROW:false,PERSON_FULL_NAME:"Zelmanov, Efim I                   ",FK_SPM_SPCL_MTG_CD:"  ",PERSON_ID:"A16948219",BLDG_CODE:"RCLAS",SECT_CREDIT_HRS_PL:" ",SECTION_HEAD:59172,ENROLL_STATUS:"EN",FK_CDI_INSTR_TYPE:"LE",SECT_CODE:"B00",FK_SEC_SCTN_NUM:59172},{END_MM_TIME:50,LONG_DESC:"                              ",SCTN_CPCTY_QTY:26,TERM_CODE:"FA21",SCTN_ENRLT_QTY:26,SECT_CREDIT_HRS:4,BEGIN_HH_TIME:12,END_DATE:"2021-12-03",SECTION_NUMBER:59172,STP_ENRLT_FLAG:"Y",SUBJ_CODE:"MATH",GRADE_OPTN_CD_PLUS:"+",WT_POS:"",COUNT_ON_WAITLIST:1,PRIMARY_INSTR_FLAG:"Y",ROOM_CODE:"3000A",FK_PCH_INTRL_REFID:2122934,CRSE_TITLE:"Linear Algebra                ",END_HH_TIME:12,GRADE_OPTION:"L",START_DATE:"2021-09-23",CRSE_CODE:" 18  ",DAY_CODE:"2",BEGIN_MM_TIME:0,NEED_HEADROW:false,PERSON_FULL_NAME:"Zelmanov, Efim I                   ",FK_SPM_SPCL_MTG_CD:"  ",PERSON_ID:"A16948219",BLDG_CODE:"YORK ",SECT_CREDIT_HRS_PL:" ",SECTION_HEAD:59172,ENROLL_STATUS:"EN",FK_CDI_INSTR_TYPE:"DI",SECT_CODE:"B21",FK_SEC_SCTN_NUM:59172},{END_MM_TIME:0,LONG_DESC:"                              ",TERM_CODE:"FA21",SECT_CREDIT_HRS:4,BEGIN_HH_TIME:0,SECTION_NUMBER:51442,SUBJ_CODE:"MATH",GRADE_OPTN_CD_PLUS:"+",WT_POS:"",PRIMARY_INSTR_FLAG:"Y",ROOM_CODE:"TBA",FK_PCH_INTRL_REFID:2122934,CRSE_TITLE:"Linear Algebra                ",END_HH_TIME:0,GRADE_OPTION:"L",START_DATE:"TBA",CRSE_CODE:" 18  ",DAY_CODE:"TBA",BEGIN_MM_TIME:0,NEED_HEADROW:false,PERSON_FULL_NAME:"Zelmanov, Efim I                   ",PB_FRIEND:true,FK_SPM_SPCL_MTG_CD:"",PERSON_ID:"A16948219",BLDG_CODE:"TBA",SECT_CREDIT_HRS_PL:" ",SECTION_HEAD:59172,ENROLL_STATUS:"EN",FK_CDI_INSTR_TYPE:"LA",SECT_CODE:"B50",FK_SEC_SCTN_NUM:59172},{END_MM_TIME:50,LONG_DESC:"                              ",TERM_CODE:"FA21",SECT_CREDIT_HRS:4,BEGIN_HH_TIME:20,SECTION_NUMBER:51423,SUBJ_CODE:"MATH",GRADE_OPTN_CD_PLUS:"+",WT_POS:"",PRIMARY_INSTR_FLAG:"Y",ROOM_CODE:"R07  ",FK_PCH_INTRL_REFID:2122934,CRSE_TITLE:"Linear Algebra                ",END_HH_TIME:21,GRADE_OPTION:"L",START_DATE:"2021-11-01",CRSE_CODE:" 18  ",DAY_CODE:"1",BEGIN_MM_TIME:0,NEED_HEADROW:false,PERSON_FULL_NAME:"Zelmanov, Efim I                   ",PB_FRIEND:true,FK_SPM_SPCL_MTG_CD:"MI",PERSON_ID:"A16948219",BLDG_CODE:"RCLAS",SECT_CREDIT_HRS_PL:" ",SECTION_HEAD:59172,ENROLL_STATUS:"EN",FK_CDI_INSTR_TYPE:"MI",SECT_CODE:"B00",FK_SEC_SCTN_NUM:59172},{END_MM_TIME:59,LONG_DESC:"                              ",TERM_CODE:"FA21",SECT_CREDIT_HRS:4,BEGIN_HH_TIME:19,SECTION_NUMBER:51423,SUBJ_CODE:"MATH",GRADE_OPTN_CD_PLUS:"+",WT_POS:"",PRIMARY_INSTR_FLAG:"Y",ROOM_CODE:"R01  ",FK_PCH_INTRL_REFID:2122934,CRSE_TITLE:"Linear Algebra                ",END_HH_TIME:21,GRADE_OPTION:"L",START_DATE:"2021-12-04",CRSE_CODE:" 18  ",DAY_CODE:"6",BEGIN_MM_TIME:0,NEED_HEADROW:false,PERSON_FULL_NAME:"Zelmanov, Efim I                   ",PB_FRIEND:true,FK_SPM_SPCL_MTG_CD:"FI",PERSON_ID:"A16948219",BLDG_CODE:"RCLAS",SECT_CREDIT_HRS_PL:" ",SECTION_HEAD:59172,ENROLL_STATUS:"EN",FK_CDI_INSTR_TYPE:"FI",SECT_CODE:"B00",FK_SEC_SCTN_NUM:59172},{END_MM_TIME:50,LONG_DESC:"                              ",TERM_CODE:"FA21",SECT_CREDIT_HRS:4,BEGIN_HH_TIME:17,SECTION_NUMBER:51573,SUBJ_CODE:"MATH",GRADE_OPTN_CD_PLUS:"+",WT_POS:"",PRIMARY_INSTR_FLAG:"TBA",ROOM_CODE:"115  ",FK_PCH_INTRL_REFID:2122934,CRSE_TITLE:"Calculus&Analyt Geom/Sci&Engnr",END_HH_TIME:17,GRADE_OPTION:"L",START_DATE:"2021-09-23",CRSE_CODE:" 20C ",DAY_CODE:"1",BEGIN_MM_TIME:0,NEED_HEADROW:false,PERSON_FULL_NAME:"Staff",FK_SPM_SPCL_MTG_CD:"  ",PERSON_ID:"A16948219",BLDG_CODE:"CENTR",SECT_CREDIT_HRS_PL:" ",SECTION_HEAD:51579,ENROLL_STATUS:"EN",FK_CDI_INSTR_TYPE:"LE",SECT_CODE:"E00",FK_SEC_SCTN_NUM:51579},{END_MM_TIME:50,LONG_DESC:"                              ",TERM_CODE:"FA21",SECT_CREDIT_HRS:4,BEGIN_HH_TIME:17,SECTION_NUMBER:51573,SUBJ_CODE:"MATH",GRADE_OPTN_CD_PLUS:"+",WT_POS:"",PRIMARY_INSTR_FLAG:"TBA",ROOM_CODE:"115  ",FK_PCH_INTRL_REFID:2122934,CRSE_TITLE:"Calculus&Analyt Geom/Sci&Engnr",END_HH_TIME:17,GRADE_OPTION:"L",START_DATE:"2021-09-23",CRSE_CODE:" 20C ",DAY_CODE:"3",BEGIN_MM_TIME:0,NEED_HEADROW:false,PERSON_FULL_NAME:"Staff",FK_SPM_SPCL_MTG_CD:"  ",PERSON_ID:"A16948219",BLDG_CODE:"CENTR",SECT_CREDIT_HRS_PL:" ",SECTION_HEAD:51579,ENROLL_STATUS:"EN",FK_CDI_INSTR_TYPE:"LE",SECT_CODE:"E00",FK_SEC_SCTN_NUM:51579},{END_MM_TIME:50,LONG_DESC:"                              ",TERM_CODE:"FA21",SECT_CREDIT_HRS:4,BEGIN_HH_TIME:17,SECTION_NUMBER:51573,SUBJ_CODE:"MATH",GRADE_OPTN_CD_PLUS:"+",WT_POS:"",PRIMARY_INSTR_FLAG:"TBA",ROOM_CODE:"115  ",FK_PCH_INTRL_REFID:2122934,CRSE_TITLE:"Calculus&Analyt Geom/Sci&Engnr",END_HH_TIME:17,GRADE_OPTION:"L",START_DATE:"2021-09-23",CRSE_CODE:" 20C ",DAY_CODE:"5",BEGIN_MM_TIME:0,NEED_HEADROW:false,PERSON_FULL_NAME:"Staff",FK_SPM_SPCL_MTG_CD:"  ",PERSON_ID:"A16948219",BLDG_CODE:"CENTR",SECT_CREDIT_HRS_PL:" ",SECTION_HEAD:51579,ENROLL_STATUS:"EN",FK_CDI_INSTR_TYPE:"LE",SECT_CODE:"E00",FK_SEC_SCTN_NUM:51579},{END_MM_TIME:50,LONG_DESC:"                              ",SCTN_CPCTY_QTY:33,TERM_CODE:"FA21",SCTN_ENRLT_QTY:12,SECT_CREDIT_HRS:4,BEGIN_HH_TIME:11,END_DATE:"2021-12-03",SECTION_NUMBER:51579,STP_ENRLT_FLAG:"N",SUBJ_CODE:"MATH",GRADE_OPTN_CD_PLUS:"+",WT_POS:"",COUNT_ON_WAITLIST:null,PRIMARY_INSTR_FLAG:"TBA",ROOM_CODE:"3000A",FK_PCH_INTRL_REFID:2122934,CRSE_TITLE:"Calculus&Analyt Geom/Sci&Engnr",END_HH_TIME:11,GRADE_OPTION:"L",START_DATE:"2021-09-23",CRSE_CODE:" 20C ",DAY_CODE:"4",BEGIN_MM_TIME:0,NEED_HEADROW:false,PERSON_FULL_NAME:"Staff",FK_SPM_SPCL_MTG_CD:"  ",PERSON_ID:"A16948219",BLDG_CODE:"YORK ",SECT_CREDIT_HRS_PL:" ",SECTION_HEAD:51579,ENROLL_STATUS:"EN",FK_CDI_INSTR_TYPE:"DI",SECT_CODE:"E06",FK_SEC_SCTN_NUM:51579},{END_MM_TIME:50,LONG_DESC:"                              ",TERM_CODE:"FA21",SECT_CREDIT_HRS:4,BEGIN_HH_TIME:20,SECTION_NUMBER:51573,SUBJ_CODE:"MATH",GRADE_OPTN_CD_PLUS:"+",WT_POS:"",PRIMARY_INSTR_FLAG:"TBA",ROOM_CODE:"0113 ",FK_PCH_INTRL_REFID:2122934,CRSE_TITLE:"Calculus&Analyt Geom/Sci&Engnr",END_HH_TIME:21,GRADE_OPTION:"L",START_DATE:"2021-11-02",CRSE_CODE:" 20C ",DAY_CODE:"2",BEGIN_MM_TIME:0,NEED_HEADROW:false,PERSON_FULL_NAME:"Staff",PB_FRIEND:true,FK_SPM_SPCL_MTG_CD:"MI",PERSON_ID:"A16948219",BLDG_CODE:"MOS  ",SECT_CREDIT_HRS_PL:" ",SECTION_HEAD:51579,ENROLL_STATUS:"EN",FK_CDI_INSTR_TYPE:"MI",SECT_CODE:"E00",FK_SEC_SCTN_NUM:51579},{END_MM_TIME:59,LONG_DESC:"                              ",TERM_CODE:"FA21",SECT_CREDIT_HRS:4,BEGIN_HH_TIME:8,SECTION_NUMBER:51573,SUBJ_CODE:"MATH",GRADE_OPTN_CD_PLUS:"+",WT_POS:"",PRIMARY_INSTR_FLAG:"TBA",ROOM_CODE:"0113 ",FK_PCH_INTRL_REFID:2122934,CRSE_TITLE:"Calculus&Analyt Geom/Sci&Engnr",END_HH_TIME:10,GRADE_OPTION:"L",START_DATE:"2021-12-04",CRSE_CODE:" 20C ",DAY_CODE:"6",BEGIN_MM_TIME:0,NEED_HEADROW:false,PERSON_FULL_NAME:"Staff",PB_FRIEND:true,FK_SPM_SPCL_MTG_CD:"FI",PERSON_ID:"A16948219",BLDG_CODE:"MOS  ",SECT_CREDIT_HRS_PL:" ",SECTION_HEAD:51579,ENROLL_STATUS:"EN",FK_CDI_INSTR_TYPE:"FI",SECT_CODE:"E00",FK_SEC_SCTN_NUM:51579}]}).call(this);
