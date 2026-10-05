/**
 * Use cases del CMS.
 *
 * `getHomeBlocks` lee los bloques activos y valida la `data` de cada
 * uno contra el schema de su tipo. Un bloque con `data` inválida se
 * OMITE — un bloque mal configurado no debe romper la home.
 */
import { HOME_BLOCK_SCHEMAS } from "./cms.schemas";
import * as repo from "./cms.repository";
import type { HomeBlock } from "./cms.types";

/**
 * Bloques de la home, validados y listos para renderizar. En modo
 * `preview` (sólo para el admin) se incluyen los programados a futuro.
 */
export async function getHomeBlocks(preview = false): Promise<HomeBlock[]> {
  const rows = await repo.listActiveBlocks(preview);

  const blocks: HomeBlock[] = [];
  for (const row of rows) {
    const schema = HOME_BLOCK_SCHEMAS[row.type];
    const parsed = schema.safeParse(row.data);
    if (!parsed.success) continue;

    blocks.push({
      id: row.id,
      type: row.type,
      sortOrder: row.sortOrder,
      data: parsed.data,
    } as HomeBlock);
  }
  return blocks;
}
