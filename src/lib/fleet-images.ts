import heroCuracaoAgyaPanorama from "@/assets/optimized/hero-curacao-agya-panorama.png";
import heroCuracaoAgyaPanorama640 from "@/assets/optimized/hero-curacao-agya-panorama-640w.webp";
import heroCuracaoAgyaPanorama1024 from "@/assets/optimized/hero-curacao-agya-panorama-1024w.webp";
import heroCuracaoAgyaPanorama1536 from "@/assets/optimized/hero-curacao-agya-panorama-1536w.webp";
import heroCuracaoAgyaPanorama2048 from "@/assets/optimized/hero-curacao-agya-panorama-2048w.webp";
import heroCuracaoAgyaPanorama2560 from "@/assets/optimized/hero-curacao-agya-panorama-2560w.webp";
import heroCuracaoAgyaWaterfront from "@/assets/optimized/hero-curacao-agya-waterfront.png";
import heroAgyaReal from "@/assets/optimized/hero-agya-real.png";
import agyaCoast from "@/assets/optimized/fleet-agya-coast.webp";
import agyaCoastThumb from "@/assets/optimized/fleet-agya-coast-thumb.webp";
import agyaFront from "@/assets/optimized/fleet-agya-front.webp";
import heroMockupExactPhoto from "@/assets/optimized/hero-mockup-exact-photo.webp";
import heroMockupWillemstadYaris from "@/assets/optimized/hero-mockup-willemstad-yaris.webp";
import heroBrandWillemstad from "@/assets/optimized/hero-brand-willemstad.webp";
import heroConcept3 from "@/assets/optimized/hero-concept-3-coastal-drive-cinema.webp";
import heroConcept3Scene from "@/assets/optimized/hero-concept-3-scene.webp";
import yarisFront from "@/assets/optimized/fleet-yaris-front.webp";
import yarisFrontThumb from "@/assets/optimized/fleet-yaris-front-thumb.webp";
import yarisShowroom from "@/assets/optimized/fleet-yaris-showroom.webp";
import yarisStreet from "@/assets/optimized/fleet-yaris-street.webp";
import yarisStreetThumb from "@/assets/optimized/fleet-yaris-street-thumb.webp";
import yarisAirportCur from "@/assets/optimized/fleet-yaris-airport-cur.webp";
import yarisAirportCurThumb from "@/assets/optimized/fleet-yaris-airport-cur-thumb.webp";
import agyaVilla from "@/assets/optimized/fleet-agya-villa.webp";
import agyaVillaThumb from "@/assets/optimized/fleet-agya-villa-thumb.webp";
import agyaCuracaoSign from "@/assets/optimized/fleet-agya-curacao-sign.webp";
import agyaCuracaoSignThumb from "@/assets/optimized/fleet-agya-curacao-sign-thumb.webp";
import agyaAirportCur from "@/assets/optimized/fleet-agya-airport-cur.webp";
import agyaAirportCurThumb from "@/assets/optimized/fleet-agya-airport-cur-thumb.webp";
import momentBeachMambo from "@/assets/optimized/moment-beach-mambo.webp";
import momentWillemstad from "@/assets/optimized/moment-willemstad.webp";
import momentCoastline from "@/assets/optimized/moment-coastline.webp";
import destinationWestpunt from "@/assets/optimized/destination-westpunt.webp";
import destinationWestpuntThumb from "@/assets/optimized/destination-westpunt-thumb.webp";
import destinationJanThiel from "@/assets/optimized/destination-jan-thiel.webp";
import destinationJanThielThumb from "@/assets/optimized/destination-jan-thiel-thumb.webp";
import destinationWillemstad from "@/assets/optimized/destination-willemstad.webp";
import destinationWillemstadThumb from "@/assets/optimized/destination-willemstad-thumb.webp";
import curacaoSatelliteMap from "@/assets/optimized/curacao-satellite-map.webp";

/** Native 2560×1270 master — same 1024×508 composition, no crop. */
export const HERO_PANORAMA = {
  src: heroCuracaoAgyaPanorama2560,
  srcSet: [
    `${heroCuracaoAgyaPanorama640} 640w`,
    `${heroCuracaoAgyaPanorama1024} 1024w`,
    `${heroCuracaoAgyaPanorama1536} 1536w`,
    `${heroCuracaoAgyaPanorama2048} 2048w`,
    `${heroCuracaoAgyaPanorama2560} 2560w`,
  ].join(", "),
  width: 2560,
  height: 1270,
  legacy: heroCuracaoAgyaPanorama,
} as const;

/** Optimized WebP fleet imagery (generated via `bun run optimize:images`). */
export const FLEET_IMAGES = {
  heroCuracaoAgyaPanorama,
  heroCuracaoAgyaPanorama640,
  heroCuracaoAgyaPanorama1024,
  heroCuracaoAgyaPanorama1536,
  heroCuracaoAgyaPanorama2048,
  heroCuracaoAgyaPanorama2560,
  heroCuracaoAgyaWaterfront,
  heroAgyaReal,
  hero: agyaCoast,
  heroMockupExactPhoto,
  heroMockupWillemstadYaris,
  heroBrandWillemstad,
  heroConcept3,
  heroConcept3Scene,
  coastThumb: agyaCoastThumb,
  agyaFront,
  yarisFront,
  yarisFrontThumb,
  yarisStreet,
  yarisStreetThumb,
  yarisShowroom,
  yarisAirportCur,
  yarisAirportCurThumb,
  agyaVilla,
  agyaVillaThumb,
  agyaCuracaoSign,
  agyaCuracaoSignThumb,
  agyaAirportCur,
  agyaAirportCurThumb,
  momentBeachMambo,
  momentWillemstad,
  momentCoastline,
  destinationWestpunt,
  destinationWestpuntThumb,
  destinationJanThiel,
  destinationJanThielThumb,
  destinationWillemstad,
  destinationWillemstadThumb,
  curacaoSatelliteMap,
} as const;

export const HERO_LCP_IMAGE = HERO_PANORAMA.src;
