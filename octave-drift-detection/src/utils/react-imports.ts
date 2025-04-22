export const addReactImport = (content: string): string => {
  if (!content.includes("import React") && !content.includes("from 'react'")) {
    return `import React from 'react';\n${content}`;
  }
  return content;
};

export const ensureReactImport = (filePath: string, content: string): string => {
  // Skip files that already have React imported
  if (content.includes("import React") || content.includes("from 'react'")) {
    return content;
  }

  // Only add to TSX/JSX files
  if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
    return addReactImport(content);
  }

  return content;
};
