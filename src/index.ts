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

export interface Props {
  [familyName: string]: {
    path: string;
    weight: number;
    style?: string;
  }[];
}

//////////////////////////////
// Android
//////////////////////////////

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/[^\w_]/g, "");
}

// Copies the font files over to the Android project and generates the font family XML
const withFontsXML: ConfigPlugin<Props> = (config, props) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const androidRoot = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/res/font"
      );
      // Ensure font directory exists
      await fs.mkdir(androidRoot, { recursive: true });
      const familyNames = Object.keys(props);
      for (const familyName of familyNames) {
        const fontAssets = props[familyName];
        // Copy over font files
        for (const fontAsset of fontAssets) {
          // prettier-ignore
          const fileName = `${slugify(familyName)}_${fontAsset.weight}_${fontAsset.style ?? 'normal'}`;
          const filePath = path.join(androidRoot, `${fileName}.ttf`);
          await fs.cp(
            path.join(config.modRequest.projectRoot, fontAsset.path),
            filePath
          );
        }
        // Generate font family XML
        const xml = `
<?xml version="1.0" encoding="utf-8"?>
<font-family xmlns:android="http://schemas.android.com/apk/res/android">
  ${fontAssets.map((fontAsset) => {
    // prettier-ignore
    const filename = `${slugify(familyName)}_${fontAsset.weight}_${fontAsset.style ?? 'normal'}`
    // prettier-ignore
    return `<font app:fontStyle="${fontAsset.style ?? 'normal'}" app:fontWeight="${fontAsset.weight}" app:font="@font/${filename}" />`
  })}
</font-family>
`.trim();
        const xmlPath = path.join(androidRoot, `${slugify(familyName)}.xml`);
        await fs.writeFile(xmlPath, xml);
      }

      return config;
    },
  ]);
};

// Updates the MainApplication.java file to load the custom fonts
const withFontsMainApplication: ConfigPlugin<Props> = (config, props) => {
  return withMainApplication(config, async (config) => {
    // Add import statement
    config.modResults.contents = config.modResults.contents.replace(
      "import com.facebook.react.ReactPackage;",
      "import com.facebook.react.ReactPackage;\nimport com.facebook.react.views.text.ReactFontManager;"
    );

    // Add LOC to load custom fonts
    const familyNames = Object.keys(props);
    const createLOC = familyNames.map((familyName) => {
      // prettier-ignore
      return `ReactFontManager.getInstance().addCustomFont(this, "${familyName}", R.font.${slugify(familyName)});`
    });
    config.modResults.contents = config.modResults.contents.replace(
      "super.onCreate();",
      `super.onCreate();\n${createLOC.join("\n")}`
    );

    return config;
  });
};

//////////////////////////////
// iOS
//////////////////////////////

export const outDir = "expo_native_fonts";

// Generates the font files in the iOS project
const withFontResources: ConfigPlugin<Props> = (config, props) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const iosRoot = path.join(
        config.modRequest.platformProjectRoot,
        config.modRequest.projectName!
      );

      const outDirPath = path.join(iosRoot, outDir);
      // Delete all existing assets
      await fs.rm(outDirPath, { recursive: true, force: true });
      // Ensure directory exists
      await fs.mkdir(outDirPath, { recursive: true });
      // Generate new assets
      const familyNames = Object.keys(props);
      for (const familyName of familyNames) {
        const fontAssets = props[familyName];
        for (const fontAsset of fontAssets) {
          const filePath = path.join(outDirPath, path.basename(fontAsset.path));
          await fs.cp(
            path.join(config.modRequest.projectRoot, fontAsset.path),
            filePath
          );
        }
      }

      return config;
    },
  ]);
};

// Adds the font files as resources in the Xcode project
const withFontsXcodeProject: ConfigPlugin<Props> = (config, props) => {
  interface GroupChild {
    comment: string;
    value: string;
  }

  // https://github.com/expo/config-plugins/blob/79d464943b113c4d9bab698c4bb19ef08ff9c89b/packages/react-native-dynamic-app-icon/src/index.ts#L61
  return withXcodeProject(config, async (config) => {
    const groupPath = path.join(config.modRequest.projectName!, outDir);
    const group = IOSConfig.XcodeUtils.ensureGroupRecursively(
      config.modResults,
      groupPath
    );
    const project = config.modResults;
    const opt: any = {};

    // Unlink old assets
    const groupId = Object.keys(project.hash.project.objects.PBXGroup).find(
      (id) => {
        const _group = project.hash.project.objects.PBXGroup[id];
        return _group.name === group.name;
      }
    );
    if (!project.hash.project.objects.PBXVariantGroup) {
      project.hash.project.objects.PBXVariantGroup = {};
    }
    const variantGroupId = Object.keys(
      project.hash.project.objects.PBXVariantGroup
    ).find((id) => {
      const _group = project.hash.project.objects.PBXVariantGroup[id];
      return _group.name === group.name;
    });
    const children: GroupChild[] = [...(group.children ?? [])];
    for (const child of children) {
      const file = new pbxFile(path.join(group.name, child.comment), opt);
      file.target = opt ? opt.target : undefined;

      project.removeFromPbxBuildFileSection(file); // PBXBuildFile
      project.removeFromPbxFileReferenceSection(file); // PBXFileReference
      if (group) {
        if (groupId) {
          project.removeFromPbxGroup(file, groupId); // Group other than Resources (i.e. 'splash')
        } else if (variantGroupId) {
          project.removeFromPbxVariantGroup(file, variantGroupId); // PBXVariantGroup
        }
      }
      project.removeFromPbxResourcesBuildPhase(file); // PBXResourcesBuildPhase
    }

    // Link new assets
    const paths = Object.keys(props).flatMap((familyName) => {
      const fontAssets = props[familyName];
      return fontAssets.map((fontAsset) => {
        return path.basename(fontAsset.path);
      });
    });
    for (const filePath of paths) {
      config.modResults = IOSConfig.XcodeUtils.addResourceFileToGroup({
        filepath: path.join(groupPath, filePath),
        groupName: groupPath,
        project: config.modResults,
        isBuildFile: true,
        verbose: true,
      });
    }

    return config;
  });
};

// Adds the font files to the Info.plist
const withFontsInfoPlist: ConfigPlugin<Props> = (config, props) => {
  return withInfoPlist(config, async (config) => {
    const paths = Object.keys(props).flatMap((familyName) => {
      const fontAssets = props[familyName];
      return fontAssets.map((fontAsset) => {
        return path.basename(fontAsset.path);
      });
    });
    config.modResults.UIAppFonts = [...paths];
    return config;
  });
};

const withNativeFonts: ConfigPlugin<Props> = (config, props) => {
  // Apply Android config
  config = withFontsXML(config, props);
  config = withFontsMainApplication(config, props);
  // Apply iOS config
  config = withFontResources(config, props);
  config = withFontsXcodeProject(config, props);
  config = withFontsInfoPlist(config, props);

  return config;
};

export default withNativeFonts;
