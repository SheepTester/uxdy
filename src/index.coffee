# await fetch('https://act.ucsd.edu/webreg2/svc/wradapter/secure/get-class?schedname=&final=&sectnum=&termcode=FA21&_=1632715852456').then(r => r.json())

parseTime = (time) ->
  [, hour, minute, amPm] = time.match /(\d+):(\d+)([ap])/
  (if amPm is 'a' then +hour else if hour is '12' then 12 else +hour + 12) * 60 + +minute

schedule = [
  {
    id: 'MATH18'
    type: 'lecture'
    name: 'MATH18 B00 @ RCLAS (LE)'
    day: 1
    start: 780
    end: 830
    # Putting Zoom link in hash so I don't publish it in this repo; don't want
    # to Zoom bomb Zelmanov :P
    zoom: window.location.hash.slice 1
  }
  {
    id: 'CSE11'
    type: 'discussion'
    name: 'CSE11 C01 @ PCYNH120 (DI)'
    day: 1
    start: 900
    end: 950
    disabled: true
  }
  {
    id: 'CSE11'
    type: 'lecture'
    name: 'CSE11 C00 @ CENTR119 (LE)'
    day: 1
    start: 960
    end: 1010
  }
  {
    id: 'MATH20C'
    type: 'lecture'
    name: 'MATH20C E00 @ CENTR115 (LE)'
    day: 1
    start: 1020
    end: 1070
  }
  {
    id: 'CAT1'
    type: 'lecture'
    name: 'CAT1 D00 @ MOS0114 (LE)'
    day: 2
    start: 570
    end: 650
  }
  {
    id: 'MATH18'
    type: 'discussion'
    name: 'MATH18 B21 @ YORK3000A (DI)'
    day: 2
    start: 720
    end: 770
  }
  {
    id: 'MATH18'
    type: 'lecture'
    name: 'MATH18 B00 @ RCLAS (LE)'
    day: 3
    start: 780
    end: 830
    zoom: window.location.hash.slice 1
  }
  {
    id: 'CSE11'
    type: 'lecture'
    name: 'CSE11 C00 @ CENTR119 (LE)'
    day: 3
    start: 960
    end: 1010
  }
  {
    id: 'MATH20C'
    type: 'lecture'
    name: 'MATH20C E00 @ CENTR115 (LE)'
    day: 3
    start: 1020
    end: 1070
  }
  {
    id: 'CAT1'
    type: 'lecture'
    name: 'CAT1 D00 @ MOS0114 (LE)'
    day: 4
    start: 570
    end: 650
  }
  {
    id: 'MATH20C'
    type: 'discussion'
    name: 'MATH20C E06 @ YORK3000A (DI)'
    day: 4
    start: 660
    end: 710
  }
  {
    id: 'CAT1'
    type: 'discussion'
    name: 'CAT1 D07 @ MANDEB-146 (DI)'
    day: 4
    start: 720
    end: 770
  }
  {
    id: 'MATH18'
    type: 'lecture'
    name: 'MATH18 B00 @ RCLAS (LE)'
    day: 5
    start: 780
    end: 830
    zoom: window.location.hash.slice 1
  }
  {
    id: 'CSE11'
    type: 'lecture'
    name: 'CSE11 C00 @ CENTR119 (LE)'
    day: 5
    start: 960
    end: 1010
  }
  {
    id: 'MATH20C'
    type: 'lecture'
    name: 'MATH20C E00 @ CENTR115 (LE)'
    day: 5
    start: 1020
    end: 1070
  }
]

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
renderMeeting = ({id, type, name, start, end, zoom, disabled}) ->
  colour = colours.get id
  if not colour?
    colours.set id, colour = do colourPalette.pop
  meeting = $ '<div>'
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

  if zoom?
    meeting.append (
      $ '<a>'
      .attr 'href', zoom
      .attr 'target', '_blank'
      .addClass 'zoom'
      .text 'züm'
    )

  if disabled
    meeting.addClass 'disabled'

  meeting

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
  if meetingses[weekday] and (meetingses[weekday].has currentTimeMarker).length is 0
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
      "#{hours}h #{mins}m"
    else
      days = Math.floor duration / MINUTES_PER_DAY
      hours = Math.floor duration / 60 % 24
      "#{days}d #{hours}h"
getTimeUntilNext = ->
  {weekday, minutes} = now = do currentTime

  enabledMeetings = schedule.filter ({ disabled }) -> not disabled
  # Find the next end time starting from the current time. May be the current
  # meeting, or could be on the next day.
  nextMeetingIndex = enabledMeetings.findIndex ({day, end }) ->
    day > weekday or day is weekday and end > minutes
  meeting = if nextMeetingIndex is -1
    enabledMeetings[0]
  else
    enabledMeetings[nextMeetingIndex]

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
  weekdays = [1..5]
  # Hide the weekends if there's nothing on it
  if schedule.find (meeting) -> meeting.day is 0 or meeting.day is 6
    # UCSD seems to do weekends at the end, not the ends of the week
    weekdays.push 6, 0

  $ '#days'
  .append do (renderDay day for day in weekdays).flat
  .css '--rows', weekdays.length
  .append (
    $ '<div>'
    .addClass 'axis'
    .append (renderAxisMarker hour for hour in [earliestTime // 60 .. latestTime // 60])
  )

  $ '#notif-perm'
  .click ->
    (do Notification.requestPermission)
    .then ->
      do
        $ '#notif-perm'
        .hide
    .catch console.error
  if Notification.permission is 'granted'
    do
      $ '#notif-perm'
      .hide

  lastTitle = null
  lastNotif = null
  NOTIF_TIME = 5 # minutes before class
  do tick = ->
    {meeting, type, time, now: {weekday, minutes}} = do getTimeUntilNext
    timeUntil = (time - (weekday * MINUTES_PER_DAY + minutes)) %% MINUTES_PER_WEEK
    title = "#{displayDuration timeUntil} until #{meeting.name} #{type}s · uxdy"
    if title isnt lastTitle
      document.title = if timeUntil < 5 * 60 then title else 'uxdy,'
      lastTitle = title
      $ '#status'
      .text title
    if Notification.permission is 'granted'
      if meeting.zoom? and type is 'start'
        if timeUntil <= NOTIF_TIME
          if lastNotif isnt meeting
            lastNotif = meeting
            notification = new Notification title,
              body: 'click to open linkk'
            notification.addEventListener 'click', ->
              do window.open(meeting.zoom, '_blank').focus
        else
          lastNotif = null

  setInterval tick, 1000

  # Despacito BPM
  # Maybe I should set it to 120 bpm and show the current seconds next to the
  # sheep
  PERIOD = 60000 / 89
  do paint = ->
    do renderCurrentTime

    t = (do Date.now * Math.PI / PERIOD)
    $ '#vibing'
    # (-1 + sqrt(4x^2 + 1)) / 2x also works
    .css 'transform', "skewX(#{3 * Math.atan 5 * Math.cos t}deg) scaleY(#{1 - (Math.sin t) ** 20 * 0.1})"
    window.requestAnimationFrame paint
