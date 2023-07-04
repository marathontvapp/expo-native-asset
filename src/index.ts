import path from "path";
import fs from "fs/promises";
import {
  ConfigPlugin,
  withDangerousMod,
  IOSConfig,
} from "@expo/config-plugins";

export interface ImagesetAsset {
  type: "imageset";
  path: string;
}

export type Asset = ImagesetAsset;

export interface Props {
  assets: Asset[];
}

/**
 * Checks if there is a file at the given path.
 * @param path the path to check
 * @returns whether the file exists
 */
async function fileExists(path: string) {
  try {
    await fs.access(path, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

const withNativeAssets: ConfigPlugin<Props> = (config, props) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const { projectRoot } = config.modRequest;
      // Get the root project directory
      const project = IOSConfig.XcodeUtils.getPbxproj(projectRoot);
      // Get the main group for XCAssets
      const group = IOSConfig.XcodeUtils.ensureGroupRecursively(
        project,
        "Images.xcassets"
      );

      for await (let asset of props.assets) {
        // TODO: support other asset types
        if (asset.type === "imageset") {
          const dirname = path.dirname(asset.path);
          const extname = path.extname(asset.path);
          const filename = path.basename(asset.path).replace(extname, "");

          // prettier-ignore
          const path1x = path.resolve(projectRoot, dirname, `${filename}${extname}`);
          const path1xExists = await fileExists(path1x);
          if (!path1xExists) {
            console.error(`File ${path1x} does not exist`);
            continue;
          }

          // prettier-ignore
          const path2x = path.resolve(projectRoot, dirname, `${filename}@2x${extname}`);
          const path2xExists = await fileExists(path2x);

          // prettier-ignore
          const path3x = path.resolve(projectRoot, dirname, `${filename}@3x${extname}`);
          const path3xExists = await fileExists(path3x);

          // Create the group for the asset
          const outDir = path.join(
            config.modRequest.projectName!,
            group.name,
            `${filename}.imageset`
          );
          IOSConfig.XcodeUtils.ensureGroupRecursively(project, outDir);

          // Copy the files into the group
          const files = [path1x];
          if (path2xExists && path3xExists) {
            files.push(path2x, path3x);
          }
          for await (let filePath of files) {
            const fileName = path.basename(filePath);
            const outPath = path.join(
              config.modRequest.platformProjectRoot,
              outDir,
              fileName
            );
            await fs.cp(filePath, outPath);
          }

          // Write the Contents.json file into the group
          const contentsJson = {
            images: [
              {
                idiom: "universal",
                filename: path.basename(path1x),
                scale: "1x",
              },
              {
                idiom: "universal",
                ...(path2xExists ? { filename: path.basename(path2x) } : {}),
                scale: "2x",
              },
              {
                idiom: "universal",
                ...(path3xExists ? { filename: path.basename(path3x) } : {}),
                scale: "3x",
              },
            ],
            info: {
              author: "expo",
              version: 1,
            },
          };
          // prettier-ignore
          const contentsJsonPath = path.join(config.modRequest.platformProjectRoot, outDir, "Contents.json");
          await fs.writeFile(
            contentsJsonPath,
            JSON.stringify(contentsJson, null, 2)
          );
        }
      }

      return config;
    },
  ]);
};

export default withNativeAssets;
