export type Spore = { x: number; y: number };

export type Pattern = {
  slug: string;
  name: string;
  description: string;
  category: string[];
  cells: [number, number][];
};

export type SavedField = {
  name: string;
  rle: string;
  createdAt: number;
};
