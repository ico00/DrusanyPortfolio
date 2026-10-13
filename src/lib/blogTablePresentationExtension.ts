import { Extension } from "@tiptap/core";

/**
 * Mora biti registriran u TipTap shemi: inače PM odbaci nepoznate attrs s čvora `table`
 * i blogTableBlockSpec propSchema ne utječe na DOM niti na export.
 */
export const BlogTablePresentationExtension = Extension.create({
  name: "blogTablePresentation",
  addGlobalAttributes() {
    return [
      {
        types: ["table"],
        attributes: {
          striped: {
            default: false,
            parseHTML: (element) =>
              element.getAttribute("data-striped") === "true",
            renderHTML: (attributes) =>
              attributes.striped ? { "data-striped": "true" } : {},
          },
        },
      },
    ];
  },
});
