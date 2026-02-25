"use client";

import {
  FormattingToolbar,
  getFormattingToolbarItems,
} from "@blocknote/react";
import { CustomCreateLinkButton } from "./CustomCreateLinkButton";
import { BlockTopFormattingToolbarController } from "./BlockTopFormattingToolbarController";

/** Formatting Toolbar s custom CreateLinkButton i pozicioniranjem na vrh bloka. */
export function CustomFormattingToolbar() {
  const items = getFormattingToolbarItems().map((item) =>
    item.key === "createLinkButton" ? (
      <CustomCreateLinkButton key="createLinkButton" />
    ) : (
      item
    )
  );

  return (
    <BlockTopFormattingToolbarController
      formattingToolbar={() => <FormattingToolbar>{items}</FormattingToolbar>}
    />
  );
}
