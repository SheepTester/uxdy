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
      id: courseName
      type: 'lecture'
      name: "#{courseName} @ #{lectLoc} (lecture)"
      day: +day
      start: start
      end: end

  if discTime?
    [start, end] = discTime.split '-'
      .map parseTime
    for day from discDays
      schedule.push
        id: courseName
        type: 'discussion'
        name: "#{courseName} @ #{discLoc} (discussion)"
        day: +day
        start: start
        end: end
schedule.sort (a, b) -> a.start - b.start

displayTime = (time) ->
  [time // 60, time % 60]
  .map (num) ->
    num
    .toString()
    .padStart 2, '0'
  .join ':'

earliestTime = schedule.reduce (acc, curr) ->
  if acc.start < curr.start then acc else curr
.start
colourPalette = ['red', 'orange', 'yellow', 'lime', 'cyan', 'blue', 'purple', 'magenta']
colours = new Map
renderMeeting = ({id, type, name, start, end}) ->
  colour = colours.get id
  if not colour?
    colours.set id, colour = colourPalette.pop()
  $ '<li>'
  .addClass ['meeting', type]
  .append(
    $ '<p>'
    .addClass 'name'
    .text name
  )
  .append (
    $ '<p>'
    .addClass 'time'
    .text "#{displayTime start}–#{displayTime end}"
  )
  .css '--start', start - earliestTime
  .css '--duration', end - start
  .css '--colour', colour

dayNames = ['sunday', 'nonday', 'tuesday', 'wensday', 'thursday', 'fridee', 'saturday']
renderDay = (day) -> [
  $ '<h2>'
  .addClass 'day-name'
  .text dayNames[day]

  $ '<ul>'
  .addClass 'meetings'
  .append (renderMeeting meeting for meeting in schedule when meeting.day == day)
]

$ document
.ready ->
  $ '#days'
  .append (renderDay day for day in [0...7]).flat()
