/** 9-point grid options for object-position (x% y%) */
export const THUMBNAIL_FOCUS_OPTIONS = [
  { value: "0% 0%", label: "Gore lijevo" },
  { value: "50% 0%", label: "Gore sredina" },
  { value: "100% 0%", label: "Gore desno" },
  { value: "0% 50%", label: "Sredina lijevo" },
  { value: "50% 50%", label: "Sredina" },
  { value: "100% 50%", label: "Sredina desno" },
  { value: "0% 100%", label: "Dolje lijevo" },
  { value: "50% 100%", label: "Dolje sredina" },
  { value: "100% 100%", label: "Dolje desno" },
] as const;

export const DEFAULT_THUMBNAIL_FOCUS = "50% 50%";
