import landenEuropaData from './landen_europa.json'
import landenEuropaImage from './landen_europa.jpeg'
import hoofdstedenEuropaData from './hoofdsteden_europa.json'
import hoofdstedenEuropaImage from './hoofdsteden_europa.jpeg'
import rivierenVanEuropaData from './rivieren_van_europa.json'
import rivierenVanEuropaImage from './rivieren_van_europa.jpeg'
import gebergtenEnWaterenEuropaData from './gebergten_en_wateren_europa.json'
import gebergtenEnWaterenEuropaImage from './gebergten_en_wateren_europa.jpeg'
import zeeenEnMerenEuropaData from './zeeen_en_meren_europa.json'
import zeeenEnMerenEuropaImage from './zeeen_en_meren_europa.jpeg'

export const TOPO_PACKS = [
  { id: 'landen_europa', data: landenEuropaData, image: landenEuropaImage },
  { id: 'hoofdsteden_europa', data: hoofdstedenEuropaData, image: hoofdstedenEuropaImage },
  { id: 'rivieren_van_europa', data: rivierenVanEuropaData, image: rivierenVanEuropaImage },
  { id: 'gebergten_en_wateren_europa', data: gebergtenEnWaterenEuropaData, image: gebergtenEnWaterenEuropaImage },
  { id: 'zeeen_en_meren_europa', data: zeeenEnMerenEuropaData, image: zeeenEnMerenEuropaImage },
]
