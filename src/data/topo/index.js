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

export const GROUPS = ['Groep 7', 'Groep 8']

export const TOPO_PACKS = [
  { id: 'landen_europa', data: landenEuropaData, image: landenEuropaImage, group: 'Groep 7' },
  { id: 'hoofdsteden_europa', data: hoofdstedenEuropaData, image: hoofdstedenEuropaImage, group: 'Groep 7' },
  { id: 'rivieren_van_europa', data: rivierenVanEuropaData, image: rivierenVanEuropaImage, group: 'Groep 7' },
  {
    id: 'gebergten_en_wateren_europa',
    data: gebergtenEnWaterenEuropaData,
    image: gebergtenEnWaterenEuropaImage,
    group: 'Groep 7',
  },
  { id: 'zeeen_en_meren_europa', data: zeeenEnMerenEuropaData, image: zeeenEnMerenEuropaImage, group: 'Groep 7' },
  // Groep 8 kaarten volgen nog.
].map((pack) => ({ ...pack, imageWidth: IMAGE_WIDTH, imageHeight: IMAGE_HEIGHT }))
