# await fetch('https://act.ucsd.edu/webreg2/svc/wradapter/secure/get-class?schedname=&final=&sectnum=&termcode=FA21&_=1632715852456').then(r => r.json())

parseTime = (time) ->
  [, hour, minute, amPm] = time.match /(\d+):(\d+)([ap])/
  (if amPm is 'a' then +hour else if hour is '12' then 12 else +hour + 12) * 60 + +minute

rawSchedule =
  '''
  CAT1    D07 Chodorow 24  9:30a-10:50a MOS0114  4 12:00p-12:50p MANDEB-146
  CSE11   C01 Miranda  135 4:00p-4:50p  CENTR119
  MATH18  B21 Zelmanov 135 1:00p-1:50p  RCLAS    2 12:00p-12:50p YORK3000A
  MATH20C E06 Jin      135 5:00p-5:50p  CENTR115 4 11:00a-11:50a YORK3000A
  '''
schedule = []
for course in rawSchedule.split /\r?\n/
  [courseName, sectionCode, teacher, lectDays, lectTime, lectLoc, discDays, discTime, discLoc] = course.split /\ +/

  [start, end] = lectTime.split '-'
    .map parseTime
  for day from lectDays
    schedule.push
      name: "#{courseName} @ #{lectLoc} (lecture)"
      day: +day
      start: start
      end: end

  if discTime?
    [start, end] = discTime.split '-'
      .map parseTime
    for day from discDays
      schedule.push
        name: "#{courseName} @ #{discLoc} (discussion)"
        day: +day
        start: start
        end: end
schedule.sort (a, b) -> a.start - b.start

console.log schedule

dayNames = ['sunday', 'nonday', 'tuesday', 'wensday', 'thursday', 'fridee', 'saturday']
showDay = (dayNum) ->
  $ '#day'
  .text dayNames[dayNum]

  $ '#periods'
  .empty()
  .append (($ '<li>').text name for {name, day} in schedule when day == dayNum)

currentDay = (new Date).getDay()

$ document
.ready ->
  showDay currentDay

  $ '#prev-day'
  .click ->
    currentDay = (currentDay - 1) %% 7
    showDay currentDay

  $ '#next-day'
  .click ->
    currentDay = (currentDay + 1) %% 7
    showDay currentDay
