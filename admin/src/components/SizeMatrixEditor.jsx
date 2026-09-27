import React from "react";
import { SIZE_PRESETS, emptyMatrixRow, matrixFromSizes } from "../constants/catalog";

const SizeMatrixEditor = ({ selectedSizes, sizeMatrix, setSizeMatrix, setSelectedSizes }) => {
  const toggleSize = (size) => {
    const nextSizes = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    const normalized = nextSizes.length ? nextSizes : ["One Size"];
    setSelectedSizes(normalized);
    setSizeMatrix(matrixFromSizes(normalized, sizeMatrix));
  };

  const updateRow = (index, field, value) => {
    setSizeMatrix((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addCustomSize = () => {
    const label = window.prompt("Custom size label (e.g. 32, Free Size)");
    if (!label?.trim()) return;
    const size = label.trim();
    if (selectedSizes.includes(size)) return;
    const nextSizes = selectedSizes.includes("One Size") && size !== "One Size"
      ? selectedSizes.filter((s) => s !== "One Size").concat(size)
      : [...selectedSizes, size];
    setSelectedSizes(nextSizes);
    setSizeMatrix([...sizeMatrix, emptyMatrixRow(size)]);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Available sizes</p>
        <div className="flex flex-wrap gap-2">
          {SIZE_PRESETS.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => toggleSize(size)}
              className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-all ${
                selectedSizes.includes(size)
                  ? "bg-tz-navy text-white"
                  : "bg-white border border-tz-pink-soft text-tz-navy/80"
              }`}
            >
              {size}
            </button>
          ))}
          <button
            type="button"
            onClick={addCustomSize}
            className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-dashed border-gray-300 text-gray-600"
          >
            + Custom
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Size</th>
              <th className="text-left px-3 py-2 font-medium">Price (₹)</th>
              <th className="text-left px-3 py-2 font-medium">Old price (₹)</th>
              <th className="text-left px-3 py-2 font-medium">Qty</th>
            </tr>
          </thead>
          <tbody>
            {sizeMatrix.map((row, index) => (
              <tr key={row.size} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium">{row.size}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    required
                    value={row.price}
                    onChange={(e) => updateRow(index, "price", e.target.value)}
                    className="w-full max-w-[120px] px-2 py-1 border rounded"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    value={row.oldPrice}
                    onChange={(e) => updateRow(index, "oldPrice", e.target.value)}
                    className="w-full max-w-[120px] px-2 py-1 border rounded"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    required
                    value={row.qty}
                    onChange={(e) => updateRow(index, "qty", e.target.value)}
                    className="w-full max-w-[100px] px-2 py-1 border rounded"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-gray-500 mt-2">
          Price can differ by size. Same colour variants share style name; stock is per colour × size.
        </p>
      </div>
    </div>
  );
};

export default SizeMatrixEditor;
