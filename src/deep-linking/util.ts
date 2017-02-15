import { dirname, join } from 'path';
import { DeepLinkConfigEntry, HydratedDeepLinkConfigEntry } from '../util/interfaces';

const LOAD_CHILDREN_SPLIT_TOKEN = '#';

/* this is a very temporary approach to extracting deeplink data since the Angular compiler API has changed a bit */

function getLinksArrayContent(appNgModuleFileContent: string) {
  const LINKS_REGEX = /links\s*?:\s*\[([\s|\S]*?)\]/igm;
  const deepLinksContentMatches = LINKS_REGEX.exec(appNgModuleFileContent.toString());
  if (deepLinksContentMatches && deepLinksContentMatches.length === 2) {
    return deepLinksContentMatches[1];
  }
  return null;
}

export function extractDeepLinkPathData(appNgModuleFileContent: string): DeepLinkConfigEntry[] {
  const linksInternalContent = getLinksArrayContent(appNgModuleFileContent);
  if (!linksInternalContent) {
    return null;
  }
  // parse into individual entries
  const results = getIndividualConfigEntries(linksInternalContent);
  // convert each long, multi-element string into it's proper fields
  const deepLinks = results.map(result => convertRawContentStringToParsedDeepLink(result));
  const valid = validateDeepLinks(deepLinks);
  if (!valid) {
    throw new Error('Each deep link entry must contain a "name" entry, and a "component" or "loadChildren" entry');
  }


  return deepLinks;
}

export function validateDeepLinks(deepLinks: DeepLinkConfigEntry[]) {
  for (const deepLink of deepLinks) {
    if (!deepLink.name || deepLink.name.length === 0) {
      return false;
    }
    const missingComponent = !deepLink.component || deepLink.component.length === 0;
    const missingModulePath = !deepLink.modulePath || deepLink.modulePath.length === 0;
    const missingNamedExport = !deepLink.namedExport || deepLink.namedExport.length === 0;

    if (missingComponent && (missingModulePath || missingNamedExport)) {
      return false;
    }
  }
  return true;
}

function convertRawContentStringToParsedDeepLink(input: string): DeepLinkConfigEntry {
  const LOAD_CHILDREN_REGEX = /loadChildren\s*?:\s*?['"`]\s*?(.*?)['"`]/igm;
  const NAME_REGEX = /name\s*?:\s*?['"`]\s*?(.*?)['"`]/igm;
  const COMPONENT_REGEX = /component\s*?:(.*?)[,}]/igm;
  const loadChildrenValue = extractContentWithKnownMatch(input, LOAD_CHILDREN_REGEX);
  const nameValue = extractContentWithKnownMatch(input, NAME_REGEX);
  const componentValue = extractContentWithKnownMatch(input, COMPONENT_REGEX);
  let modulePath = null;
  let namedExport = null;
  if (loadChildrenValue) {
    const tokens = loadChildrenValue.split(LOAD_CHILDREN_SPLIT_TOKEN);
    if (tokens.length === 2) {
      modulePath = tokens[0];
      namedExport = tokens[1];
    }
  }

  return {
    component: componentValue,
    name: nameValue,
    modulePath: modulePath,
    namedExport: namedExport
  };
}

function extractContentWithKnownMatch(input: string, regex: RegExp) {
  const result = regex.exec(input);
  if (result && result.length > 1) {
    return result[1].trim();
  }
  return null;
}

function getIndividualConfigEntries(content: string) {
  let match: RegExpExecArray = null;
  const results: string[] = [];
  const INDIVIDUAL_ENTRIES_REGEX = /({.*?})/igm;
  while ((match = INDIVIDUAL_ENTRIES_REGEX.exec(content))) {
    if (!match) {
      break;
    }
    results.push(match[1].trim());
  }
  return results;
}

export function getDeepLinkData(appNgModuleFilePath: string, appNgModuleFileContent: string, isAot: boolean): HydratedDeepLinkConfigEntry[] {
  const deepLinkConfigList = extractDeepLinkPathData(appNgModuleFileContent);
  if (!deepLinkConfigList) {
    return [];
  }
  const appDirectory = dirname(appNgModuleFilePath);
  const absolutePathSuffix = isAot ? '.ngfactory.ts' : '.ts';
  const modulePathSuffix = isAot ? '.ngfactory' : '';
  const namedExportSuffix = isAot ? 'NgFactory' : '';
  const hydratedDeepLinks = deepLinkConfigList.map((deepLinkConfigEntry: DeepLinkConfigEntry) => {
    return Object.assign({}, deepLinkConfigEntry, {
      modulePath: deepLinkConfigEntry.modulePath ? deepLinkConfigEntry.modulePath + modulePathSuffix : null,
      namedExport: deepLinkConfigEntry.namedExport ? deepLinkConfigEntry.namedExport + namedExportSuffix : null,
      absolutePath: deepLinkConfigEntry.modulePath ? join(appDirectory, deepLinkConfigEntry.modulePath + absolutePathSuffix) : null
    }) as HydratedDeepLinkConfigEntry;
  });
  return hydratedDeepLinks;
}

interface ParsedDeepLink {
  component: string;
  name: string;
  loadChildren: string;
};
