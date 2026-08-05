import landenEuropaData from './landen_europa.json'
import landenEuropaImage from './landen_europa.webp'
import hoofdstedenEuropaData from './hoofdsteden_europa.json'
import hoofdstedenEuropaImage from './hoofdsteden_europa.webp'
import rivierenVanEuropaData from './rivieren_van_europa.json'
import rivierenVanEuropaImage from './rivieren_van_europa.webp'
import gebergtenEnWaterenEuropaData from './gebergten_en_wateren_europa.json'
import gebergtenEnWaterenEuropaImage from './gebergten_en_wateren_europa.webp'
import zeeenEnMerenEuropaData from './zeeen_en_meren_europa.json'
import zeeenEnMerenEuropaImage from './zeeen_en_meren_europa.webp'

// Intrinsic pixel size of every map photo (all shot/cropped to the same 1152x1536
// portrait size). Passed through to <img width/height> so the browser can reserve
// the right aspect ratio before the image loads, avoiding layout shift.
const IMAGE_WIDTH = 1152
const IMAGE_HEIGHT = 1536

export const TOPO_PACKS = [
  { id: 'landen_europa', data: landenEuropaData, image: landenEuropaImage },
  { id: 'hoofdsteden_europa', data: hoofdstedenEuropaData, image: hoofdstedenEuropaImage },
  { id: 'rivieren_van_europa', data: rivierenVanEuropaData, image: rivierenVanEuropaImage },
  { id: 'gebergten_en_wateren_europa', data: gebergtenEnWaterenEuropaData, image: gebergtenEnWaterenEuropaImage },
  { id: 'zeeen_en_meren_europa', data: zeeenEnMerenEuropaData, image: zeeenEnMerenEuropaImage },
].map((pack) => ({ ...pack, imageWidth: IMAGE_WIDTH, imageHeight: IMAGE_HEIGHT }))
