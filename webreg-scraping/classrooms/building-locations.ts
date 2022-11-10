export type Location = [latitude: number, longitude: number]

// https://registrar.ucsd.edu/StudentLink/bldg_codes.html

// Go onto Google Maps, right click on approximate center of building, click on
// coordinates to copy

const revelle: Record<string, Location> = {
  BONN: [32.876084946774036, -117.24038814500676],
  GH: [32.87374584111353, -117.24092662366324],
  MAYER: [32.87528696893803, -117.24019479635555],
  'MYR-A': [32.87536189399691, -117.23970412241734], // Mayer Hall Addition
  NSB: [32.87527130105447, -117.24282324774462], // Natural Sciences
  PACIF: [32.87595284128824, -117.24210006678864],
  REV: [32.87480385710217, -117.24096166711239], // Revelle Plaza
  RVCOM: [32.87457496393089, -117.2425008415767], // Revelle Commons?
  TATA: [32.876460769081355, -117.24152230144844],
  UREY: [32.875555403867246, -117.2412962102085],
  YORK: [32.87454593562147, -117.24000502137861]
}
const muir: Record<string, Location> = {
  APM: [32.87900949086575, -117.24105009713044],
  BIO: [32.878428690703146, -117.24103674033825], // Muir Biology
  HSS: [32.87834508545459, -117.24168835799722],
  LEDDN: [32.87876783002103, -117.24168242455174],
  MANDE: [32.877812337766414, -117.23998508397895],
  MCGIL: [32.87900601797463, -117.24205773606351],
  MNDLR: [32.87928595670899, -117.24214505416418]
}
const sixth: Record<string, Location> = {
  CTL: [32.880720265920914, -117.24142517100402],
  JEANN: [32.8799296621332, -117.24119652096547],
  MOS: [32.88001190738399, -117.24163094823878],
  RWAC: [32.880374742852574, -117.24106684310492]
}
const marshall: Record<string, Location> = {
  CSB: [32.880517237245954, -117.23939317415764],
  ECON: [32.88235588485967, -117.24040328432459],
  PETER: [32.879984046654364, -117.2402525268966],
  SEQUO: [32.88203974495475, -117.24103633144476],
  SOLIS: [32.880935740253626, -117.23964750230745],
  SSRB: [32.88075657728253, -117.240142743495], // Social Sciences Research Bldg
  TM102: [32.88134401507817, -117.23933111579409] // Marshall portable 102
}
const erc: Record<string, Location> = {
  ASANT: [32.88423744331073, -117.24213984468823],
  ERCA: [32.886087113975414, -117.24205254723678], // ERC Admin
  GREAT: [32.883944240936444, -117.24193249617227],
  LASB: [32.88557327735999, -117.2413567320843], // Latin American Studies Bldg
  RBC: [32.88427044449085, -117.2408680383893], // Robinson Auditorium
  SSB: [32.88391338508008, -117.24045720071513]
}
const seventh: Record<string, Location> = {
  OTRSN: [32.88665760836001, -117.24102406579628],
  SEVW2: [32.8880285561251, -117.24255222849888],
  SEVE3: [32.88825009555447, -117.24173440393453],
  SEVE4: [32.88807303667593, -117.2417902045747], // I think?
  WFH: [32.886967814911024, -117.24173638805067] // Wells Fargo Hall
}
const warren: Record<string, Location> = {
  EBU1: [32.88168612813114, -117.2352758424052], // Jacob's
  EBU2: [32.88116494369773, -117.23334050065942], // MAE
  EBU3B: [32.8817383470234, -117.23358830529953], // CSE
  FAH: [32.883557123107536, -117.23496426482438],
  PFBH: [32.88173836638747, -117.2343791731388], // Powell-Focht Bioeng Hall
  WARR: [32.88114818094256, -117.23504265009306],
  WLH: [32.88059104682919, -117.23436049332548],
  WSAC: [32.88246082957613, -117.23329893891902]
}
const pepperCanyon: Record<string, Location> = {
  DIB: [32.87937650181871, -117.23229157766367], // Design & Innovation
  PCYNH: [32.878341870703316, -117.23391147692307],
  SME: [32.879887628129154, -117.23275634017203],
  VAF: [32.879139240878324, -117.23396876625009] // Visual Arts Facility
}
const universityCenter: Record<string, Location> = {
  CENTR: [32.87797399985619, -117.237243418587],
  CSC: [32.87840034888087, -117.23791254127356], // Career Services (Center)
  CPMC: [32.87808507377693, -117.23466682590514],
  P416: [32.87775532737337, -117.23812995691154],
  PRICE: [32.879954671864304, -117.23711807270978],
  SERF: [32.87969838069206, -117.23507094146997], // Sci & Eng Research Facility
  U201: [32.87750663014029, -117.23672981527089],
  U301: [32.87773977889938, -117.23584205327144]
}
const med: Record<string, Location> = {
  BRF2: [32.874320265698685, -117.2350725903077], // Biomed Research Facility II
  BSB: [32.87583620115867, -117.23610217780087], // Biomed Sciences Bldg
  CMME: [32.876369320524, -117.23767828382417], // Cell and Molec Med East
  CNCB: [32.87569310599253, -117.23819914713752], // Ctr for Neural Circ & Behav
  KECK: [32.87504438926279, -117.23617314958287], // W. M. Keck Building
  LFFB: [32.87668499513593, -117.23686452737942], // Leichtag Biomed Research
  MET: [32.875220419083554, -117.23478623990438], // Med Edu and Telemedicine
  MTF: [32.87559622253949, -117.23543639784786], // Medical Teaching Facility
  PSB: [32.874209066736114, -117.23571795183558], // Pharmaceutical Sci Bldg
  SCRB: [32.8758549279704, -117.23394815633426] // Stein Clinical Research Bldg
}
const health: Record<string, Location> = {
  MCC: [32.87832294065095, -117.22294309501584] // Moores Cancer Center
}
const playhouse: Record<string, Location> = {
  DANCE: [32.87186729617818, -117.24003377110412], // Wagner Dance Bldg
  MWEIS: [32.87095079844769, -117.24121579783444], // Mandell Weiss Theatre
  POTKR: [32.87110810161448, -117.24052277636109] // Potiker Theatre
}
const sio: Record<string, Location> = {
  ECKRT: [32.8672217685922, -117.25258463073409], // Eckart
  HUBBS: [32.86744021132684, -117.25344551951103],
  HYDRO: [32.86889985285985, -117.25226455555327], // Hydraulics Laboratory
  IGPP: [32.86830699100889, -117.25287278628777],
  NIERN: [32.86846701354387, -117.25120611888595], // Nierenberg Hall
  OAR: [32.86949599612524, -117.25063208743448], // Oceano and Atmo Research
  RITTR: [32.86529347606621, -117.25357019529167], // Ritter Hall
  SPIES: [32.86909245015263, -117.25095900205372], // Spiess Hall
  SUMNR: [32.86488587494083, -117.2529119246211], // Sumner Auditorium
  VAUGN: [32.86531011859729, -117.25300219413253] // Vaughan Hall
}
// Maps building -> coordinates
export const locations = {
  ...revelle,
  ...muir,
  ...sixth,
  ...marshall,
  ...erc,
  ...seventh,
  ...warren,
  ...pepperCanyon,
  ...universityCenter,
  ...med,
  ...health,
  ...playhouse,
  ...sio
}

function locationToCollegeMapping (
  college: Record<string, Location>,
  collegeName: string
): Record<string, string> {
  return Object.fromEntries(
    Object.keys(college).map(building => [building, collegeName])
  )
}
// Maps building -> college
export const colleges = {
  ...locationToCollegeMapping(revelle, 'revelle'),
  ...locationToCollegeMapping(muir, 'muir'),
  ...locationToCollegeMapping(sixth, 'sixth'),
  ...locationToCollegeMapping(marshall, 'marshall'),
  ...locationToCollegeMapping(erc, 'erc'),
  ...locationToCollegeMapping(seventh, 'seventh'),
  ...locationToCollegeMapping(warren, 'warren'),
  ...locationToCollegeMapping(pepperCanyon, 'pepperCanyon'),
  ...locationToCollegeMapping(universityCenter, 'universityCenter'),
  ...locationToCollegeMapping(med, 'med'),
  ...locationToCollegeMapping(health, 'health'),
  ...locationToCollegeMapping(playhouse, 'playhouse'),
  ...locationToCollegeMapping(sio, 'sio')
}

/** maps.ucsd.edu zoom level used for the map image. */
export const ZOOM = 16
/** Number of tiles across in the map image */
export const MAP_TILE_WIDTH = 7
/** Size of each map tile */
export const TILE_SIZE = 256
/** Zoom into the map on the website */
export const MAP_ZOOM = 2
const SCALE = 2 ** (7 + ZOOM) * MAP_ZOOM
export function latLongToPixel ([latitude, longitude]: Location): {
  x: number
  y: number
} {
  return {
    x: SCALE * (longitude / 180 + 1),
    y:
      -SCALE *
      (Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI) / 360)) / Math.PI +
        1)
  }
}

const coords = Object.values(locations)
function getExtremeCoord (index: 0 | 1, max: boolean) {
  return coords.reduce(
    (acc, curr) => (max ? Math.max : Math.min)(acc, curr[index]),
    max ? -Infinity : Infinity
  )
}
export const southwest = latLongToPixel([
  getExtremeCoord(0, false),
  getExtremeCoord(1, false)
])
export const northeast = latLongToPixel([
  getExtremeCoord(0, true),
  getExtremeCoord(1, true)
])

export const PADDING = 50 // px
// Center of map
const center = latLongToPixel([32.877341347399, -117.23531663418])
export const offset = {
  x:
    Math.floor(center.x / 2 ** (25 - ZOOM) - 3) * 2 ** (25 - ZOOM) -
    (southwest.x - PADDING),
  y:
    Math.floor(center.y / 2 ** (25 - ZOOM) - 3) * 2 ** (25 - ZOOM) -
    (northeast.y - PADDING)
}
