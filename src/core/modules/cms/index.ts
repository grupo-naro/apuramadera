/**
 * Módulo CMS — API pública.
 *
 * Fase 5 · M5.1 — bloques de la home. El storefront consume
 * `getHomeBlocks`; el editor del panel (M5.2) sumará el CRUD.
 */
export { getHomeBlocks } from "./cms.use-cases";

export type { HomeBlock } from "./cms.types";

export {
  HOME_BLOCK_TYPES,
  HOME_BLOCK_TYPE_LABELS,
  type HomeBlockType,
  type HeroBannerData,
  type ProductCarouselData,
  type CategoryGridData,
} from "./cms.schemas";
