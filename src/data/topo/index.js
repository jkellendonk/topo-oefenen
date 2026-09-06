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
import landenNoordAmerikaData from './landen_noord_amerika.json'
import landenNoordAmerikaImage from './landen_noord_amerika.webp'
import landenMiddenAmerikaData from './landen_midden_amerika.json'
import landenMiddenAmerikaImage from './landen_midden_amerika.webp'
import landenZuidAmerikaData from './landen_zuid_amerika.json'
import landenZuidAmerikaImage from './landen_zuid_amerika.webp'
import landenAzieData from './landen_azie.json'
import landenAzieImage from './landen_azie.webp'
import landenOceanieData from './landen_oceanie.json'
import landenOceanieImage from './landen_oceanie.webp'
import landenAfrika1Data from './landen_afrika_1.json'
import landenAfrika2Data from './landen_afrika_2.json'
import landenAfrikaImage from './landen_afrika.webp'

// Intrinsic pixel size of each map image. Passed through to <img width/height> so
// the browser can reserve the right aspect ratio before the image loads, avoiding
// layout shift. A pack without an explicit `size` falls back to DEFAULT_IMAGE_SIZE.
const DEFAULT_IMAGE_SIZE = { width: 893, height: 1065 }

export const GROUPS = ['Groep 7', 'Groep 8']

export const TOPO_PACKS = [
  {
    id: 'landen_europa',
    data: landenEuropaData,
    image: landenEuropaImage,
    group: 'Groep 7',
    size: { width: 893, height: 1056 },
  },
  {
    id: 'hoofdsteden_europa',
    data: hoofdstedenEuropaData,
    image: hoofdstedenEuropaImage,
    group: 'Groep 7',
    size: { width: 893, height: 1056 },
  },
  { id: 'rivieren_van_europa', data: rivierenVanEuropaData, image: rivierenVanEuropaImage, group: 'Groep 7' },
  {
    id: 'gebergten_en_wateren_europa',
    data: gebergtenEnWaterenEuropaData,
    image: gebergtenEnWaterenEuropaImage,
    group: 'Groep 7',
  },
  { id: 'zeeen_en_meren_europa', data: zeeenEnMerenEuropaData, image: zeeenEnMerenEuropaImage, group: 'Groep 7' },
  {
    id: 'landen_noord_amerika',
    data: landenNoordAmerikaData,
    image: landenNoordAmerikaImage,
    group: 'Groep 8',
    size: { width: 944, height: 553 },
  },
  {
    id: 'landen_midden_amerika',
    data: landenMiddenAmerikaData,
    image: landenMiddenAmerikaImage,
    group: 'Groep 8',
    size: { width: 801, height: 303 },
  },
  {
    id: 'landen_zuid_amerika',
    data: landenZuidAmerikaData,
    image: landenZuidAmerikaImage,
    group: 'Groep 8',
    size: { width: 648, height: 945 },
  },
  {
    id: 'landen_azie',
    data: landenAzieData,
    image: landenAzieImage,
    group: 'Groep 8',
    size: { width: 830, height: 774 },
  },
  {
    id: 'landen_oceanie',
    data: landenOceanieData,
    image: landenOceanieImage,
    group: 'Groep 8',
    size: { width: 660, height: 530 },
  },
  {
    id: 'landen_afrika_1',
    data: landenAfrika1Data,
    image: landenAfrikaImage,
    group: 'Groep 8',
    size: { width: 1400, height: 1531 },
  },
  {
    id: 'landen_afrika_2',
    data: landenAfrika2Data,
    image: landenAfrikaImage,
    group: 'Groep 8',
    size: { width: 1400, height: 1531 },
  },
].map(({ size, ...pack }) => ({
  ...pack,
  imageWidth: (size ?? DEFAULT_IMAGE_SIZE).width,
  imageHeight: (size ?? DEFAULT_IMAGE_SIZE).height,
}))
