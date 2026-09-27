export const COLOR_OPTIONS = [
  "Black",
  "Brown",
  "Tan",
  "Cognac",
  "Red",
  "White",
  "Green",
  "Blue",
  "Pink",
  "Yellow",
  "Orange",
  "Purple",
  "Cream",
  "Navy",
  "Multi",
];

export const SIZE_PRESETS = ["One Size", "S", "M", "L", "XL", "XXL"];

export function emptyMatrixRow(size = "One Size") {
  return { size, price: "", oldPrice: "", qty: "" };
}

export function matrixFromSizes(sizes, prevMatrix = []) {
  const list = sizes.length ? sizes : ["One Size"];
  return list.map((size) => {
    const existing = prevMatrix.find((row) => row.size === size);
    return existing || emptyMatrixRow(size);
  });
}
