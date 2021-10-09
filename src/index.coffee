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
timeToPosition = (time, percent = true) ->
  (time - earliestTime) / dayLength * 100 + if percent then '%' else ''

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
  {weekday, minutes} = do currentTime
  if (meetingses[weekday].has currentTimeMarker).length is 0
    meetingses[weekday].append currentTimeMarker
  position = timeToPosition minutes, false
  if position < -10 or position > 110
    currentTimeMarker.css 'display', 'none'
  else
    currentTimeMarker.css 'display', ''
    currentTimeMarker.css 'top', position + '%'
    currentTimeMarker.css 'opacity', switch position
      when position < 0 then (10 + position) / 10
      when position > 100 then (110 - position) / 10
      else 1

MINUTES_PER_DAY = 24 * 60
MINUTES_PER_WEEK = MINUTES_PER_DAY * 7
# `duration` in minutes
displayDuration = (duration) ->
  switch
    when duration is 0
      'no time'
    when duration < 1
      (duration * 60).toFixed 3  + 's'
    when duration < MINUTES_PER_DAY
      hours = Math.floor duration / 60
      mins = Math.floor duration % 60
      [
        if hours > 0 then "#{hours} hour#{if hours is 1 then '' else 's'}" else ''
        if hours > 0 and mins > 0 then ' ' else ''
        if mins > 0 then "#{mins} minute#{if mins is 1 then '' else 's'}" else ''
      ].join ''
    else
      days = Math.floor duration / MINUTES_PER_DAY
      hours = Math.floor duration / 60 % 60
      [
        if days > 0 then "#{days} day#{if days is 1 then '' else 's'}" else ''
        if days > 0 and hours > 0 then ' ' else ''
        if hours > 0 then "#{hours} hour#{if hours is 1 then '' else 's'}" else ''
      ].join ''
getTimeUntilNext = ->
  {weekday, minutes} = now = do currentTime

  # Find the next end time starting from the current time. May be the current
  # meeting, or could be on the next day.
  nextMeetingIndex = schedule.findIndex ({day, end }) ->
    day > weekday or day is weekday and end > minutes
  meeting = if nextMeetingIndex is -1
    schedule[0]
  else
    schedule[nextMeetingIndex]

  if nextMeetingIndex isnt -1 and weekday is meeting.day and minutes >= meeting.start
    # Meeting is currently happening
    meeting: meeting
    type: 'end'
    time: meeting.day * MINUTES_PER_DAY + meeting.end
    now: now
  else
    # Meeting is next
    meeting: meeting
    type: 'start'
    time: meeting.day * MINUTES_PER_DAY + meeting.start
    now: now

$ document
.ready ->
  $ '#days'
  .append do (renderDay day for day in [0...7]).flat
  .append (
    $ '<div>'
    .addClass 'axis'
    .append (renderAxisMarker hour for hour in [earliestTime // 60 .. latestTime // 60])
  )

  lastTitle = null
  do tick = ->
    {meeting, type, time, now: {weekday, minutes}} = do getTimeUntilNext
    title = "#{displayDuration (time - (weekday * MINUTES_PER_DAY + minutes)) %% MINUTES_PER_WEEK} until #{meeting.name} #{type}s · uxdy"
    if title isnt lastTitle
      document.title = lastTitle = title
      $ '#status'
      .text title
  setInterval tick, 1000

  do paint = ->
    do renderCurrentTime
    window.requestAnimationFrame paint
