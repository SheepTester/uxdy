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

## max event ID

for fall 2026 (or any term of possible), I'm trying to figure out if my section IDs are valid. what's the maximum possible section id? it should look like E 0000XXXX; try looking up CSE 11's sections for an example

what is EL00004110? also, what about maximum among E ... (with a space)

> The section ID `EL00004110` corresponds to `DSC-198` (Dir Group Study/Data Science) for Fall 2026.
>
> For section IDs following the `E [number]` format (with a space), the maximum ID currently available for Fall 2026 is `E 00005334`.

> For Fall 2026, the only observed section ID prefixes are "E " and "EL".
