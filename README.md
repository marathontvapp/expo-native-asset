# expo-native-asset

TK

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

To test that the project works, set up an example project app using [`create-expo-app`](https://www.npmjs.com/package/create-expo-app) and follow these steps:

1. In this repo, link the project:

   ```bash
   yarn link
   ```

2. In your example project repo, link the dependency:

   ```bash
   yarn link expo-native-fonts
   ```

3. In your example project repo, run the prebuild command:

   ```bash
   yarn expo prebuild --clean
   ```

## Credits

Major props to [@jsamr](https://github.com/jsamr) for their documentation on supporting fonts natively: https://github.com/jsamr/react-native-font-demo
