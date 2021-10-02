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
      name: "#{courseName} #{sectionCode[0]}00 @ #{lectLoc} (LE)"
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
        name: "#{courseName} #{sectionCode} @ #{discLoc} (DI)"
        day: +day
        start: start
        end: end
schedule.sort (a, b) -> a.day - b.day or a.start - b.start

displayTime = (time) ->
  [time // 60, time % 60]
  .map (num) ->
    (do num.toString)
    .padStart 2, '0'
  .join ':'

earliestTime = schedule.reduce (acc, curr) ->
  if acc.start < curr.start then acc else curr
.start
latestTime = schedule.reduce (acc, curr) ->
  if acc.end > curr.end then acc else curr
.end
dayLength = latestTime - earliestTime
timeToPosition = (time) ->
  "#{(time - earliestTime) / dayLength * 100}%"

colourPalette = ['red', 'orange', 'yellow', 'lime', 'cyan', 'blue', 'purple', 'magenta']
colours = new Map
renderMeeting = ({id, type, name, start, end}) ->
  colour = colours.get id
  if not colour?
    colours.set id, colour = do colourPalette.pop
  $ '<div>'
  .addClass ['meeting', type]
  .append (
    $ '<p>'
    .addClass 'name'
    .text name
  )
  .append (
    $ '<p>'
    .addClass 'time'
    .text "#{displayTime start}–#{displayTime end}"
  )
  .css 'top', timeToPosition start
  .css 'bottom', "#{(dayLength - (end - earliestTime)) / dayLength * 100}%"
  .css 'border-left-color', colour

meetingses = []
dayNames = ['sunday', 'nonday', 'tuesday', 'wensday', 'thursday', 'fridee', 'saturday']
renderDay = (day) -> [
  $ '<h2>'
  .addClass 'day-name'
  .text dayNames[day]

  meetingses[day] = $ '<div>'
  .addClass 'meetings'
  .append (renderMeeting meeting for meeting in schedule when meeting.day == day)
]

renderAxisMarker = (hour) ->
  $ '<div>'
  .addClass 'axis-marker'
  .text "#{(do hour.toString).padStart 2, '0'}:00"
  .css 'top', timeToPosition hour * 60

# From https://github.com/Orbiit/gunn-web-app/blob/master/js/utils.js#L85-L152
currentTime = do ->
  timeZoneFormatter = new Intl.DateTimeFormat 'en-US',
    timeZone: 'America/Los_Angeles'
    hour12: off
    weekday: 'short'
    era: 'short'
    year: 'numeric'
    month: 'numeric'
    day: 'numeric'
    hour: 'numeric'
    minute: 'numeric'
    second: 'numeric'
  ->
    datetime = timeZoneFormatter.format now = new Date
    [weekday, date, fullYear, time] = datetime.split /,\s+/
    [month, day] = date.split ' '
    [year, era] = fullYear.split ' '
    [hour, minute, second] = time.split ':'
    hour = if hour is '24' then 0 else +hour
    {
      date:
        year: if era is 'BC' then -year + 1 else +year
        month: +month - 1
        day: +day
      weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf weekday
      minutes: hour * 60 + +minute + (+second + do now.getMilliseconds / 1000) / 60
    }

currentTimeMarker = $ '<div>'
  .addClass 'current-time'
renderCurrentTime = ->
  { weekday, minutes } = do currentTime
  if (meetingses[weekday].has currentTimeMarker).length is 0
    meetingses[weekday].append currentTimeMarker
  currentTimeMarker.css 'top', timeToPosition minutes

getTimeUntil = ->
  { weekday, minutes } = do currentTime
  nextMeetingIndex = schedule.findIndex ({ day, start }) ->
    day > weekday or day is weekday and start > minutes
console.log do getTimeUntil
$ document
.ready ->
  $ '#days'
  .append do (renderDay day for day in [0...7]).flat
  .append (
    $ '<div>'
    .addClass 'axis'
    .append (renderAxisMarker hour for hour in [earliestTime // 60 .. latestTime // 60])
  )

  do paint = ->
    do renderCurrentTime
    window.requestAnimationFrame paint