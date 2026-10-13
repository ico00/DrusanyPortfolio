/**
 * Proširuje default BlockNote tablicu samo `striped` propom (zebra redovi) —
 * to native tablica nema. Zaglavlja (pravi <th>) i širine stupaca rješava
 * native BlockNote (editor opcija `tables.headers` + resize povlačenjem).
 * `striped` se serializira kao data-striped na <table> pri blocksToHTMLLossy.
 */
import { createTableBlockSpec } from "@blocknote/core/blocks";

const baseTable = createTableBlockSpec();

export const blogTableBlockSpec = {
  ...baseTable,
  config: {
    ...baseTable.config,
    propSchema: {
      ...baseTable.config.propSchema,
      striped: { default: false, type: "boolean" as const },
    },
  },
};
