# expo-native-asset

> Bundle images to the native iOS `Images.xcassets` asset catalog

## Motivation

When using [Expo Router](https://expo.github.io/router/docs/) (or the underlying [React Navigation](https://reactnavigation.org/) library), you have the option to swap out the native header back image.

The recommended way to add a custom back image is via Expo's official [expo-asset](https://docs.expo.dev/versions/latest/sdk/asset/) package. However, I've found that on iOS builds there is an FONC (Flash of Native Content) before the custom image is swapped in.

This config plugin bundles your images natively in your asset catalog, so they are available at build time for your app to use. No more FONC!

## Installation

1. Install the `expo-native-asset` library:

   ```bash
   yarn add expo-native-asset
   ```

2. Add the desired assets to your project repo (we recommend in `assets`):

   ```
   |- assets/
      |- images/
         |- chevron-left.png
         |- chevron-left@2x.png
         |- chevron-left@3x.png
         |- chevron-right.png
   ```

3. Add the desired assets to your `app.json` (or `app.config.js`) file:

   ```js
   {
      "plugins": [
         [
            "expo-native-asset",
            {
               "assets": [
                  {
                     "type": "imageset",
                     // The plugin will automatically pick up your @2x and @3x files if they both exist
                     "path": "./assets/images/chevron-left.png"
                  },
                  {
                     "type": "imageset",
                     "path": "./assets/images/chevron-right.png"
                  }
               ]
            }
         ]
      ]
   }
   ```

4. Rebuild your app as described in the ["Adding custom native code"](https://docs.expo.io/workflow/customizing/) guide

5. Start using the newly defined asset in your code:

   ```tsx
   <Stack
     screenOptions={{
       headerBackImageSource: { uri: "chevron-left", width: 20, height: 20 },
     }}>
   ```

## Contributing

Check out our [Contributing](.github/CONTRIBUTING.md) guide for more information on reporting issues, submitting feedback, or contributing code.

### Setup

To set up the repository locally on your machine, follow these steps:

1. Install the project dependencies:

   ```bash
   yarn
   ```

2. Create a new build:

   ```bash
   yarn build
   ```

### Testing

To test that the project works, use the example app in the `example` directory:

1. In the root of this repo, run the build server:

   ```bash
   yarn build
   ```

2. In the `example` directory, rerun the prebuild process:

   ```bash
   EXPO_DEBUG=1 expo prebuild --clean
   ```

3. Confirm the plugin works as expected!
