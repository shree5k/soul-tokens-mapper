figma.showUI(__html__, { width: 340, height: 380, themeColors: true });

// Store spacing tokens
let spacingTokens: any[] = [];
let totalMappedTokens = 0;

// Find a matching spacing token
function findMatchingToken(value: number): any | null {
  if (!spacingTokens.length) return null;
  return spacingTokens.find(token => {
    if (!token || token.value === undefined) return false;
    const tokenValue = parseFloat(String(token.value).replace('px', ''));
    return !isNaN(tokenValue) && Math.abs(tokenValue - value) < 0.001;
  });
}

// Process a single spacing property
async function processSpacingProperty(node: FrameNode | ComponentNode, prop: keyof FrameNode): Promise<number> {
  const rawValue = node[prop as keyof FrameNode];

  // Ensure it's a valid number before processing
  const currentValue = typeof rawValue === 'number' ? rawValue : NaN;
  if (isNaN(currentValue) || node.boundVariables?.[prop as keyof typeof node.boundVariables]) return 0;

  const matchingToken = findMatchingToken(currentValue);
  if (!matchingToken) return 0;

  const variable = await figma.variables.importVariableByKeyAsync(matchingToken.key);
  if (!variable) return 0;

  node.setBoundVariable(prop as VariableBindableNodeField, variable);
  console.log(`✅ Mapped ${String(prop)}: ${currentValue} → ${matchingToken.name}`);
  return 1;
}

// Process Auto Layout Spacing
async function processAutoLayoutSpacing(node: FrameNode | ComponentNode): Promise<number> {
  let replacements = 0;

  if (node.layoutMode !== 'NONE') {
    replacements += await processSpacingProperty(node, 'itemSpacing');

    const paddingProperties: (keyof FrameNode)[] = ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom'];
    for (const prop of paddingProperties) {
      replacements += await processSpacingProperty(node, prop);
    }
  }
  return replacements;
}

// Recursively process children
async function processChildren(node: FrameNode | ComponentNode): Promise<number> {
  let replacements = 0;
  if (!node.children) return 0;

  for (const child of node.children) {
    if (child.type === 'FRAME' || child.type === 'COMPONENT') {
      replacements += await processAutoLayoutSpacing(child);
      replacements += await processChildren(child);
    }
  }
  return replacements;
}

// Process selected nodes
async function processSelection(): Promise<{ processed: number; replacements: number }> {
  let processed = 0, replacements = 0;
  totalMappedTokens = 0;

  const selectedNodes = figma.currentPage.selection;
  if (!selectedNodes.length) {
    figma.notify("👀 Please select an Auto Layout frame or component.");
    return { processed: 0, replacements: 0 };
  }

  for (const node of selectedNodes) {
    if (node.type === 'FRAME' || node.type === 'COMPONENT') {
      processed++;
      const nodeReplacements = await processAutoLayoutSpacing(node) + await processChildren(node);
      replacements += nodeReplacements;
      totalMappedTokens += nodeReplacements;
    }
  }

  console.log(`📊 Final Mapped Tokens: ${totalMappedTokens}`);
  figma.ui.postMessage({ type: 'mapped-count', mappedTotal: totalMappedTokens });
  return { processed, replacements };
}

// Fetch published spacing tokens
async function fetchPublishedVariables(): Promise<void> {
  try {
    const libraryCollections = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
    let allTokens: any[] = [];

    for (const collection of libraryCollections) {
      const variables = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(collection.key);
      for (const variable of variables) {
        if (/spacing|space|gap|margin|padding/.test(variable.name.toLowerCase())) {
          allTokens.push({ key: variable.key, name: variable.name, value: undefined });
        }
      }
    }

    let validTokens: any[] = [];
    for (const token of allTokens) {
      try {
        const variable = await figma.variables.importVariableByKeyAsync(token.key);
        if (!variable) continue;

        const collection = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
        if (!collection || !collection.modes.length) continue;

        const modeId = collection.modes[0].modeId;
        const variableInstance = await figma.variables.getVariableByIdAsync(variable.id);
        const value = variableInstance?.valuesByMode?.[modeId];

        if (typeof value === 'number' || !isNaN(parseFloat(String(value)))) {
          validTokens.push({ key: token.key, name: token.name, value });
        }
      } catch (error) {
        console.error(`❌ Error processing token ${token.name}: ${error}`);
      }
    }

    spacingTokens = validTokens;
    figma.ui.postMessage({ type: 'tokens', tokens: spacingTokens, total: spacingTokens.length });
  } catch (error) {
    figma.ui.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
}

// Map spacing tokens
async function mapSpaceTokens(): Promise<void> {
  try {
    await fetchPublishedVariables();
    if (spacingTokens.length > 0) {
      const result = await processSelection();
      figma.ui.postMessage({ type: 'tokens', tokens: spacingTokens, total: spacingTokens.length });
      figma.ui.postMessage({ type: 'mapped-count', mappedTotal: totalMappedTokens });
    } else {
      figma.ui.postMessage({ type: 'error', message: '⚠️ No spacing tokens found in the design system' });
    }
  } catch (error) {
    figma.ui.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
}

// Handle UI Messages
figma.ui.onmessage = async msg => {
  if (msg.type === 'map-tokens') {
    await mapSpaceTokens();
  }
};