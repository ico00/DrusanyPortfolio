"use client";

import {
  FormattingToolbar,
  getFormattingToolbarItems,
  FormattingToolbarController,
} from "@blocknote/react";
import { CustomCreateLinkButton } from "./CustomCreateLinkButton";

/** Formatting Toolbar s custom CreateLinkButton koji otvara naš modal s predlošcima i "Otvori u novom tabu". */
export function CustomFormattingToolbar() {
  const items = getFormattingToolbarItems().map((item) =>
    item.key === "createLinkButton" ? (
      <CustomCreateLinkButton key="createLinkButton" />
    ) : (
      item
    )
  );

  return (
    <FormattingToolbarController
      formattingToolbar={() => <FormattingToolbar>{items}</FormattingToolbar>}
    />
  );
}
