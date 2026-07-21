When TritonGPT generates a schedule, it posts it to a separate, unauthenticated website with section (["event"](https://blink.ucsd.edu/instructors/resources/tss/glossary/index.html)) IDs encoded in the URL.

Proof of concept:

<!-- prettier-ignore -->
```js
//console.log('CS2' + btoa(JSON.stringify({"s":["E 00000961","E 00001627","E 00001631","E 00003983"],"t":"FA26"})))
s = []
for (let i = 1000; i <= 1100; i++) s .push( `E ${i.toString().padStart(8, 0)}`)
console.log(s)
location = 'https://courseschedule.tritonai.ucsd.edu/course-schedule/view/CS2' + btoa(JSON.stringify({s,"t":"FA26"})).replace(/=+$/,'')
```
