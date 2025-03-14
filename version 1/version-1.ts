// figma.showUI(__html__, { width: 340, height: 380, themeColors: true });

// // Store the retrieved tokens
// let spacingTokens: any[] = [];
// let totalMappedTokens = 0; // Stores the count of mapped tokens

// // Function to find the matching token for a given spacing value
// function findMatchingToken(value: number): any | null {
//   if (!spacingTokens || spacingTokens.length === 0) {
//     return null;
//   }

//   return spacingTokens.find(token => {
//     if (!token || token.value === undefined) return false;
//     const tokenValue = parseFloat(String(token.value).replace('px', ''));
//     const targetValue = parseFloat(String(value).replace('px', ''));
//     return !isNaN(tokenValue) && Math.abs(tokenValue - targetValue) < 0.001;
//   });
// }

// // Function to process auto layout spacing
// async function processAutoLayoutSpacing(node: FrameNode | ComponentNode): Promise<number> {
//   let replacements = 0;

//   if (node.layoutMode !== 'NONE') {
//     const currentSpacing = node.itemSpacing;
//     if (currentSpacing !== undefined && !node.boundVariables?.itemSpacing) {
//       const matchingToken = findMatchingToken(currentSpacing);
//       if (matchingToken) {
//         const variable = await figma.variables.importVariableByKeyAsync(matchingToken.key);
//         if (variable) {
//           node.setBoundVariable('itemSpacing', variable);
//           replacements++;
//           console.log(`Mapped itemSpacing: ${currentSpacing} to ${matchingToken.name}`);
//         }
//       }
//     }

//     const paddingProperties = ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom'] as const;
//     for (const prop of paddingProperties) {
//       const currentPadding = node[prop];
//       if (currentPadding !== undefined && !node.boundVariables?.[prop]) {
//         const matchingToken = findMatchingToken(currentPadding);
//         if (matchingToken) {
//           const variable = await figma.variables.importVariableByKeyAsync(matchingToken.key);
//           if (variable) {
//             node.setBoundVariable(prop, variable);
//             replacements++;
//             console.log(`Mapped ${prop}: ${currentPadding} to ${matchingToken.name}`);
//           }
//         }
//       }
//     }
//   }
//   console.log(`Checked node: ${node.name}, replacements: ${replacements}`);
//   return replacements;
// }

// // Function to process selected nodes
// async function processSelection(): Promise<{ processed: number; replacements: number }> {
//   let processed = 0;
//   let replacements = 0;
//   totalMappedTokens = 0; // Reset before processing

//   const selectedNodes = figma.currentPage.selection;
//   if (selectedNodes.length === 0) {
//     figma.notify("👀 Please select an autolayout or component to map tokens.");
//     return { processed: 0, replacements: 0 };
//   }

//   for (const node of selectedNodes) {
//     if (node.type === 'FRAME' || node.type === 'COMPONENT') {
//       processed++;
//       const autoLayoutReplacements = await processAutoLayoutSpacing(node);
//       const childReplacements = await processChildren(node);

//       const nodeTotal = autoLayoutReplacements + childReplacements;
//       replacements += nodeTotal;
//       totalMappedTokens += nodeTotal;
      
//       console.log(`Processed node: ${node.name}, replacements: ${nodeTotal}, total so far: ${totalMappedTokens}`);
//     }
//   }

//   console.log(`Final total mapped tokens: ${totalMappedTokens}`);
//   figma.ui.postMessage({ type: 'mapped-count', mappedTotal: totalMappedTokens });
//   return { processed, replacements };
// }


// // Function to process child nodes recursively
// async function processChildren(node: FrameNode | ComponentNode): Promise<number> {
//   let replacements = 0;
//   if (!node.children) return 0;

//   for (const child of node.children) {
//     if (child.type === 'FRAME' || child.type === 'COMPONENT') {
//       const autoLayoutReplacements = await processAutoLayoutSpacing(child);
//       const childReplacements = await processChildren(child);

//       replacements += autoLayoutReplacements + childReplacements;
//       console.log(`Processed child node: ${child.name}, replacements: ${autoLayoutReplacements}`);
//     }
//   }
//   return replacements;
// }

// // Function to fetch published variables
// async function fetchPublishedVariables(): Promise<void> {
//   try {
//     const libraryCollections = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
//     let allSpacingTokens: any[] = [];

//     for (const collection of libraryCollections) {
//       const variables = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(collection.key);

//       for (const variable of variables) {
//         const name = variable.name.toLowerCase();
//         const isSpacing = name.includes('spacing') || name.includes('space') || 
//                          name.includes('gap') || name.includes('margin') || 
//                          name.includes('padding');

//         if (isSpacing) {
//           allSpacingTokens.push({
//             key: variable.key,
//             name: variable.name,
//             value: undefined
//           });
//         }
//       }
//     }

//     let validTokens: any[] = [];
//     for (const token of allSpacingTokens) {
//       try {
//         const variable = await figma.variables.importVariableByKeyAsync(token.key);
//         if (variable) {
//           const collection = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
//           if (collection && collection.modes.length > 0) {
//             const modeId = collection.modes[0].modeId;
//             const variableInstance = await figma.variables.getVariableByIdAsync(variable.id);
//             if (variableInstance?.valuesByMode) {
//               const value = variableInstance.valuesByMode[modeId];
//               if (typeof value === 'number' || !isNaN(parseFloat(String(value)))) {
//                 validTokens.push({ key: token.key, name: token.name, value: value });
//               }
//             }
//           }
//         }
//       } catch (error) {
//         console.error(`Error processing token ${token.name}: ${error}`);
//       }
//     }

//     spacingTokens = validTokens;
//     figma.ui.postMessage({ type: 'tokens', tokens: spacingTokens, total: spacingTokens.length });

//   } catch (error) {
//     figma.ui.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
//   }
// }

// // Function to map space tokens
// async function mapSpaceTokens(): Promise<void> {
//   try {
//     await fetchPublishedVariables();
//     if (spacingTokens.length > 0) {
//       const result = await processSelection();
//       figma.ui.postMessage({ type: 'tokens', tokens: spacingTokens, total: spacingTokens.length });
//       figma.ui.postMessage({ type: 'mapped-count', mappedTotal: totalMappedTokens });
//     } else {
//       figma.ui.postMessage({ type: 'error', message: 'No spacing tokens were found in the design system' });
//     }
//   } catch (error) {
//     figma.ui.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
//   }
// }

// // Handle messages from the UI
// figma.ui.onmessage = async msg => {
//   if (msg.type === 'map-tokens') {
//     await mapSpaceTokens();
//   }
// };