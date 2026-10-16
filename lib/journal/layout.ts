// Larguras dos blocos de mídia/interativos (compartilhado entre servidor e cliente).
export const widthClass = {
  column: "w-full max-w-[720px]",
  wide: "w-full max-w-[880px]",
  full: "w-full max-w-[1200px]",
} as const;

export type BlockWidth = keyof typeof widthClass;
