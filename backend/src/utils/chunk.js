export const chunkText = (text, size = 1000, overlap = 150) => {
  // 1. Guard against non-string inputs
  if (typeof text !== "string") {
    throw new Error("Invalid input: text must be a string.");
  }

  // 2. Guard against infinite loops
  if (size <= 0 || overlap >= size) {
    throw new Error(
      "Invalid parameters: size must be greater than 0, and overlap must be less than size.",
    );
  }

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = start + size;

    chunks.push(text.slice(start, end));

    start += size - overlap;
  }

  return chunks;
};