import path from "path";
import fs from "fs/promises";
import {
  ConfigPlugin,
  withDangerousMod,
  withXcodeProject,
  withInfoPlist,
  withMainApplication,
  IOSConfig,
} from "@expo/config-plugins";
// @ts-ignore
import pbxFile from "xcode/lib/pbxFile";

export interface ImagesetAsset {
  type: "imageset";
  path: string;
}

export type Asset = ImagesetAsset;

export interface Props {
  assets: Asset[];
}

const withNativeAssets: ConfigPlugin<Props> = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const iosRoot = path.join(
        config.modRequest.platformProjectRoot,
        config.modRequest.projectName!
      );

      const project = IOSConfig.XcodeUtils.getPbxproj(iosRoot);
      const group = IOSConfig.XcodeUtils.ensureGroupRecursively(
        project,
        "Images.xcassets"
      );

      console.log(group);

      // const project = IOSConfig.XcodeUtils.getPbxproj(config.modResults);
      // const mainGroup = IOSConfig.XcodeUtils.getMainGroup(project);
      // const imagesetGroup = IOSConfig.XcodeUtils.findGroup(
      //   project,
      //   mainGroup,
      //   "Images.xcassets"
      // );
      return config;
    },
  ]);
};

// {
//   "images": [
//     {
//       "filename": "chevron-left.png",
//       "idiom": "universal",
//       "scale": "1x"
//     },
//     {
//       "filename": "chevron-left@2x.png",
//       "idiom": "universal",
//       "scale": "2x"
//     },
//     {
//       "filename": "chevron-left@3x.png",
//       "idiom": "universal",
//       "scale": "3x"
//     }
//   ],
//   "info": {
//     "author": "xcode",
//     "version": 1
//   }
// }

export default withNativeAssets;
