# Soul Tokens Mapper

A Figma plugin that helps you map spacing tokens from the published libraries to Auto Layout frames and components in your Figma file.

## Getting Started

Follow these steps to set up the plugin:

1. **Install Node.js**  
   Download Node.js, which includes NPM for managing dependencies.

2. **Install TypeScript**  
   Open your terminal and run:
   ```bash
   npm install -g typescript
   ```

3. **Add Figma Plugin Typings**  
   Fetch the latest type definitions for the Figma Plugin API:
   ```bash
   npm install --save-dev @figma/plugin-typings
   ```

## Features

- **Automatic Token Mapping**  
  Detects and maps spacing tokens from the library to Auto Layout frames and components.

- **Recursive Component Support**  
  Maps tokens to nested components and their properties.

- **Real-time Token Count**  
  Shows the total number of mapped tokens in real-time.

## Usage

1. Select an Auto Layout frame or component in Figma
2. Click the "Map Space Tokens" button in the plugin UI
3. The plugin will:
   - Fetch spacing tokens from the published libraries
   - Map matching tokens to spacing properties
   - Show the total number of mapped tokens

## Supported Properties

The plugin currently supports mapping tokens to:
- Item Spacing (gap)
- Padding (top, right, bottom, left)

## Development Setup

1. **Use Visual Studio Code**  
   Download VS Code for an optimal development environment.

2. **Compile TypeScript to JavaScript**  
   - Open your plugin directory in VS Code.
   - Go to Terminal > Run Build Task… / cmd + shift + B and select npm: watch.