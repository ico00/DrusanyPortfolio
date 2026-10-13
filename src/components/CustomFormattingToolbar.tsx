"use client";

import {
  FormattingToolbar,
  getFormattingToolbarItems,
} from "@blocknote/react";
import { CustomCreateLinkButton } from "./CustomCreateLinkButton";
import { CustomListButtons } from "./CustomListButtons";
import { BlockTopFormattingToolbarController } from "./BlockTopFormattingToolbarController";

/** Formatting Toolbar s custom CreateLinkButton i pozicioniranjem na vrh bloka. */
export function CustomFormattingToolbar() {
  const rawItems = getFormattingToolbarItems();
  const items = rawItems.map((item) =>
    item.key === "createLinkButton" ? (
      <CustomCreateLinkButton key="createLinkButton" />
    ) : (
      item
    )
  );
  /**
   * Raspored kao u uobičajenim editorima (npr. Google Docs): tip bloka → B/I/U → poravnanje → boja
   * → liste → uvlaka/izvlaka → link. U BlockNoteu je `nestBlockButton` prvi gumb u grupi uvlake.
   */
  const nestIdx = rawItems.findIndex((i) => i.key === "nestBlockButton");
  const beforeListButtons = nestIdx >= 0 ? items.slice(0, nestIdx) : items;
  const afterListButtons = nestIdx >= 0 ? items.slice(nestIdx) : [];

  return (
    <BlockTopFormattingToolbarController
      formattingToolbar={() => (
        <FormattingToolbar>
          {beforeListButtons}
          <CustomListButtons key="custom-list-buttons" />
          {nestIdx >= 0 ? afterListButtons : null}
        </FormattingToolbar>
      )}
    />
  );
}
