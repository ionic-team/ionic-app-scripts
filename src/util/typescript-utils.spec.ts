import * as tsUtils from './typescript-utils';

describe('typescript-utils', () => {
  describe('getNgModuleClassName', () => {
    it('should return the NgModule class name', () => {
      const knownContent = `
import { NgModule } from '@angular/core';
import { DeepLinkModule } from 'ionic-angular';

import { HomePage } from './home';

@NgModule({
  declarations: [
    HomePage,
  ],
  imports: [
    DeepLinkModule.forChild(HomePage),
  ]
})
export class HomePageModule {}
      `;

      const knownPath = '/Users/noone/idk/some-path.module.ts';

      const result = tsUtils.getNgModuleClassName(knownPath, knownContent);
      expect(result).toEqual('HomePageModule');
    });

    it('should return the NgModule class name when there are multiple class declarations but only one is decorated', () => {
      const knownContent = `
import { NgModule } from '@angular/core';
import { DeepLinkModule } from 'ionic-angular';

import { HomePage } from './home';

@NgModule({
  declarations: [
    HomePage,
  ],
  imports: [
    DeepLinkModule.forChild(HomePage),
  ]
})
export class HomePageModule {}

export class TacoBell {
  constructor() {
  }

  ionViewDidEnter() {
    console.log('tacos yo');
  }
}
      `;

      const knownPath = '/Users/noone/idk/some-path.module.ts';

      const result = tsUtils.getNgModuleClassName(knownPath, knownContent);
      expect(result).toEqual('HomePageModule');
    });

    it('should throw an error an NgModule isn\'t found', () => {
      const knownContent = `
import { NgModule } from '@angular/core';
import { DeepLinkModule } from 'ionic-angular';

import { HomePage } from './home';

export class HomePageModule {}

      `;

      const knownPath = '/Users/noone/idk/some-path.module.ts';

      const knownError = 'Should never happen';
      try {
        tsUtils.getNgModuleClassName(knownPath, knownContent);
        throw new Error(knownError);
      } catch (ex) {
        expect(ex.message).not.toEqual(knownError);
      }
    });

    it('should throw an error an multiple NgModules are found', () => {
      const knownContent = `
import { NgModule } from '@angular/core';
import { DeepLinkModule } from 'ionic-angular';

import { HomePage } from './home';

@NgModule({
  declarations: [
    HomePage,
  ],
  imports: [
    DeepLinkModule.forChild(HomePage),
  ]
})
export class HomePageModule {}

@NgModule({
  declarations: [
    HomePage,
  ],
  imports: [
    DeepLinkModule.forChild(HomePage),
  ]
})
export class TacoBellModule {}

      `;

      const knownPath = '/Users/noone/idk/some-path.module.ts';

      const knownError = 'Should never happen';
      try {
        tsUtils.getNgModuleClassName(knownPath, knownContent);
        throw new Error(knownError);
      } catch (ex) {
        expect(ex.message).not.toEqual(knownError);
      }
    });
  });
});
