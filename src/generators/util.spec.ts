import { basename, join } from 'path';
import * as fs from 'fs';
import * as Constants from '../util/constants';
import * as helpers from '../util/helpers';
import * as util from './util';
import * as GeneratorConstants from './constants';

describe('util', () => {
  describe('hydrateRequest', () => {
    it('should take a request and return a hydrated request', () => {
      // arrange
      const componentsDir = '/Users/dan/project/src/components';
      const context = {
        componentsDir: componentsDir
      };
      const request = {
        type: Constants.COMPONENT,
        name: 'settings view',
        includeSpec: true,
        includeNgModule: true
      };

      const templateDir = '/Users/dan/project/node_modules/ionic-angular/templates';
      spyOn(helpers, helpers.getPropertyValue.name).and.returnValue(templateDir);

      // act
      const hydratedRequest = util.hydrateRequest(context, request);

      // assert
      expect(hydratedRequest.type).toEqual(Constants.COMPONENT);
      expect(hydratedRequest.name).toEqual(request.name);
      expect(hydratedRequest.includeNgModule).toBeTruthy();
      expect(hydratedRequest.includeSpec).toBeTruthy();
      expect(hydratedRequest.className).toEqual('SettingsView');
      expect(hydratedRequest.fileName).toEqual('settings-view');
      expect(hydratedRequest.dirToRead).toEqual(join(templateDir, Constants.COMPONENT));
      expect(hydratedRequest.dirToWrite).toEqual(join(componentsDir, hydratedRequest.fileName));
    });
  });

  describe('readTemplates', () => {
    it('should get a map of templates and their content back', () => {
      // arrange
      const templateDir = '/Users/dan/project/node_modules/ionic-angular/templates/component';
      const knownValues = ['html.tmpl', 'scss.tmpl', 'spec.ts.tmpl', 'ts.tmpl', 'module.tmpl'];
      const fileContent = 'SomeContent';
      spyOn(fs, 'readdirSync').and.returnValue(knownValues);
      spyOn(helpers, helpers.readFileAsync.name).and.returnValue(Promise.resolve(fileContent));

      // act
      const promise = util.readTemplates(templateDir);

      // assert
      return promise.then((map: Map<string, string>) => {
        expect(map.get(join(templateDir, knownValues[0]))).toEqual(fileContent);
        expect(map.get(join(templateDir, knownValues[1]))).toEqual(fileContent);
        expect(map.get(join(templateDir, knownValues[2]))).toEqual(fileContent);
        expect(map.get(join(templateDir, knownValues[3]))).toEqual(fileContent);
        expect(map.get(join(templateDir, knownValues[4]))).toEqual(fileContent);
      });
    });
  });

  describe('filterOutTemplates', () => {
    it('should preserve all templates', () => {
      const map = new Map<string, string>();
      const templateDir = '/Users/dan/project/node_modules/ionic-angular/templates/component';
      const fileContent = 'SomeContent';
      const knownValues = ['html.tmpl', 'scss.tmpl', 'spec.ts.tmpl', 'ts.tmpl', 'module.tmpl'];
      map.set(join(templateDir, knownValues[0]), fileContent);
      map.set(join(templateDir, knownValues[1]), fileContent);
      map.set(join(templateDir, knownValues[2]), fileContent);
      map.set(join(templateDir, knownValues[3]), fileContent);
      map.set(join(templateDir, knownValues[4]), fileContent);

      const newMap = util.filterOutTemplates({includeNgModule: true, includeSpec: true}, map);
      expect(newMap.size).toEqual(knownValues.length);
    });

    it('should remove spec', () => {
      const map = new Map<string, string>();
      const templateDir = '/Users/dan/project/node_modules/ionic-angular/templates/component';
      const fileContent = 'SomeContent';
      const knownValues = ['html.tmpl', 'scss.tmpl', 'spec.ts.tmpl', 'ts.tmpl', 'module.tmpl'];
      map.set(join(templateDir, knownValues[0]), fileContent);
      map.set(join(templateDir, knownValues[1]), fileContent);
      map.set(join(templateDir, knownValues[2]), fileContent);
      map.set(join(templateDir, knownValues[3]), fileContent);
      map.set(join(templateDir, knownValues[4]), fileContent);

      const newMap = util.filterOutTemplates({includeNgModule: true, includeSpec: false}, map);
      expect(newMap.size).toEqual(4);
      expect(newMap.get(join(templateDir, knownValues[0]))).toBeTruthy();
      expect(newMap.get(join(templateDir, knownValues[1]))).toBeTruthy();
      expect(newMap.get(join(templateDir, knownValues[2]))).toBeFalsy();
      expect(newMap.get(join(templateDir, knownValues[3]))).toBeTruthy();
      expect(newMap.get(join(templateDir, knownValues[4]))).toBeTruthy();
    });

    it('should remove spec and module', () => {
      const map = new Map<string, string>();
      const templateDir = '/Users/dan/project/node_modules/ionic-angular/templates/component';
      const fileContent = 'SomeContent';
      const knownValues = ['html.tmpl', 'scss.tmpl', 'spec.ts.tmpl', 'ts.tmpl', 'module.ts.tmpl'];
      map.set(join(templateDir, knownValues[0]), fileContent);
      map.set(join(templateDir, knownValues[1]), fileContent);
      map.set(join(templateDir, knownValues[2]), fileContent);
      map.set(join(templateDir, knownValues[3]), fileContent);
      map.set(join(templateDir, knownValues[4]), fileContent);

      const newMap = util.filterOutTemplates({includeNgModule: false, includeSpec: false}, map);
      expect(newMap.size).toEqual(3);
      expect(newMap.get(join(templateDir, knownValues[0]))).toBeTruthy();
      expect(newMap.get(join(templateDir, knownValues[1]))).toBeTruthy();
      expect(newMap.get(join(templateDir, knownValues[2]))).toBeFalsy();
      expect(newMap.get(join(templateDir, knownValues[3]))).toBeTruthy();
      expect(newMap.get(join(templateDir, knownValues[4]))).toBeFalsy();
    });
  });

  describe('applyTemplates', () => {
    it('should replace the template content', () => {
      const fileOne = '/Users/dan/fileOne';

      const fileOneContent = `
<!--
  Generated template for the $CLASSNAME component.

  See https://angular.io/docs/ts/latest/api/core/index/ComponentMetadata-class.html
  for more info on Angular 2 Components.
-->

{{text}}

      `;

      const fileTwo = '/Users/dan/fileTwo';
      const fileTwoContent = `
$FILENAME {

}
      `;

      const fileThree = '/Users/dan/fileThree';
      const fileThreeContent = `
describe('$CLASSNAME', () => {
  it('should do something', () => {
    expect(true).toEqual(true);
  });
});
      `;

      const fileFour = '/Users/dan/fileFour';
      const fileFourContent = `
import { Component } from '@angular/core';

/*
  Generated class for the $CLASSNAME component.

  See https://angular.io/docs/ts/latest/api/core/index/ComponentMetadata-class.html
  for more info on Angular 2 Components.
*/
@Component({
  selector: '$FILENAME',
  templateUrl: '$FILENAME.html'
})
export class $CLASSNAMEComponent {

  text: string;

  constructor() {
    console.log('Hello $CLASSNAME Component');
    this.text = 'Hello World';
  }

}

      `;

      const fileFive = '/Users/dan/fileFive';
      const fileFiveContent = `
import { NgModule } from '@angular/core';
import { $CLASSNAME } from './$FILENAME';
import { IonicModule } from 'ionic-angular';

@NgModule({
  declarations: [
    $CLASSNAME,
  ],
  imports: [
    IonicModule.forChild($CLASSNAME)
  ],
  entryComponents: [
    $CLASSNAME
  ],
  providers: []
})
export class $CLASSNAMEModule {}
      `;

      const fileSix = '/Users/dan/fileSix';
      const fileSixContent = `
<!--
  Generated template for the $CLASSNAME page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
-->
<ion-header>

  <ion-navbar>
    <ion-title>$SUPPLIEDNAME</ion-title>
  </ion-navbar>

</ion-header>


<ion-content padding>

</ion-content>
      `;

      const map = new Map<string, string>();
      map.set(fileOne, fileOneContent);
      map.set(fileTwo, fileTwoContent);
      map.set(fileThree, fileThreeContent);
      map.set(fileFour, fileFourContent);
      map.set(fileFive, fileFiveContent);
      map.set(fileSix, fileSixContent);

      const className = 'SettingsView';
      const fileName = 'settings-view';
      const suppliedName = 'settings view';

      const results = util.applyTemplates({ name: suppliedName, className: className, fileName: fileName}, map);
      const modifiedContentOne = results.get(fileOne);
      const modifiedContentTwo = results.get(fileTwo);
      const modifiedContentThree = results.get(fileThree);
      const modifiedContentFour = results.get(fileFour);
      const modifiedContentFive = results.get(fileFive);
      const modifiedContentSix = results.get(fileSix);
      expect(modifiedContentOne.indexOf(GeneratorConstants.CLASSNAME_VARIABLE)).toEqual(-1);
      expect(modifiedContentOne.indexOf(GeneratorConstants.FILENAME_VARIABLE)).toEqual(-1);
      expect(modifiedContentOne.indexOf(GeneratorConstants.SUPPLIEDNAME_VARIABLE)).toEqual(-1);
      expect(modifiedContentTwo.indexOf(GeneratorConstants.CLASSNAME_VARIABLE)).toEqual(-1);
      expect(modifiedContentTwo.indexOf(GeneratorConstants.FILENAME_VARIABLE)).toEqual(-1);
      expect(modifiedContentTwo.indexOf(GeneratorConstants.SUPPLIEDNAME_VARIABLE)).toEqual(-1);
      expect(modifiedContentThree.indexOf(GeneratorConstants.CLASSNAME_VARIABLE)).toEqual(-1);
      expect(modifiedContentThree.indexOf(GeneratorConstants.FILENAME_VARIABLE)).toEqual(-1);
      expect(modifiedContentThree.indexOf(GeneratorConstants.SUPPLIEDNAME_VARIABLE)).toEqual(-1);
      expect(modifiedContentFour.indexOf(GeneratorConstants.CLASSNAME_VARIABLE)).toEqual(-1);
      expect(modifiedContentFour.indexOf(GeneratorConstants.FILENAME_VARIABLE)).toEqual(-1);
      expect(modifiedContentFour.indexOf(GeneratorConstants.SUPPLIEDNAME_VARIABLE)).toEqual(-1);
      expect(modifiedContentFive.indexOf(GeneratorConstants.CLASSNAME_VARIABLE)).toEqual(-1);
      expect(modifiedContentFive.indexOf(GeneratorConstants.FILENAME_VARIABLE)).toEqual(-1);
      expect(modifiedContentFive.indexOf(GeneratorConstants.SUPPLIEDNAME_VARIABLE)).toEqual(-1);
      expect(modifiedContentSix.indexOf(GeneratorConstants.CLASSNAME_VARIABLE)).toEqual(-1);
      expect(modifiedContentSix.indexOf(GeneratorConstants.FILENAME_VARIABLE)).toEqual(-1);
      expect(modifiedContentSix.indexOf(GeneratorConstants.SUPPLIEDNAME_VARIABLE)).toEqual(-1);
    });
  });

  describe('writeGeneratedFiles', () => {
    it('should return the list of files generated', () => {
      const map = new Map<string, string>();
      const templateDir = '/Users/dan/project/node_modules/ionic-angular/templates/component';
      const fileContent = 'SomeContent';
      const knownValues = ['html.tmpl', 'scss.tmpl', 'spec.ts.tmpl', 'ts.tmpl', 'module.tmpl'];
      const fileName = 'settings-view';
      const dirToWrite = join('/Users/dan/project/src/components', fileName);
      map.set(join(templateDir, knownValues[0]), fileContent);
      map.set(join(templateDir, knownValues[1]), fileContent);
      map.set(join(templateDir, knownValues[2]), fileContent);
      map.set(join(templateDir, knownValues[3]), fileContent);
      map.set(join(templateDir, knownValues[4]), fileContent);

      spyOn(helpers, helpers.writeFileAsync.name).and.returnValue(Promise.resolve());

      const promise = util.writeGeneratedFiles({ dirToWrite: dirToWrite, fileName: fileName }, map);

      return promise.then((filesCreated: string[]) => {
        const fileExtensions = knownValues.map(knownValue => basename(knownValue, GeneratorConstants.KNOWN_FILE_EXTENSION));
        expect(filesCreated[0]).toEqual(join(dirToWrite, `${fileName}.${fileExtensions[0]}`));
        expect(filesCreated[1]).toEqual(join(dirToWrite, `${fileName}.${fileExtensions[1]}`));
        expect(filesCreated[2]).toEqual(join(dirToWrite, `${fileName}.${fileExtensions[2]}`));
        expect(filesCreated[3]).toEqual(join(dirToWrite, `${fileName}.${fileExtensions[3]}`));
        expect(filesCreated[4]).toEqual(join(dirToWrite, `${fileName}.${fileExtensions[4]}`));
      });
    });
  });
});
