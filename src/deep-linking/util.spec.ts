import { join } from 'path';
import * as util from './util';

describe('util', () => {
  describe('extractDeepLinkPathData', () => {
    it('should return the parsed deep link metadata', () => {
      const fileContent = `
import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';

import * as Constants from '../util/constants';

@NgModule({
  declarations: [
    MyApp,
    HomePage
  ],
  imports: [
    getSharedIonicModule()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage
  ],
  providers: []
})
export class AppModule {}

export function getSharedIonicModule() {
  return IonicModule.forRoot(MyApp, {}, {
    links: [
      { loadChildren: '../pages/home/home.module#HomePageModule', name: 'Home' },
      { name: "PageOne", loadChildren: "../pages/page-one/page-one.module#PageOneModule" },
      { loadChildren: \`../pages/page-two/page-two.module#PageTwoModule\`, name: \`PageTwo\` },
      { Component: MyComponent, name: 'SomePage'},
      { name: 'SomePage2', Component: MyComponent2 }
    ]
  });
}
      `;
      const results = util.extractDeepLinkPathData(fileContent);
      expect(results).toBeTruthy();

      expect(results[0].component).toEqual(null);
      expect(results[0].name).toBe('Home');
      expect(results[0].modulePath).toBe('../pages/home/home.module');
      expect(results[0].namedExport).toBe('HomePageModule');

      expect(results[1].component).toEqual(null);
      expect(results[1].name).toBe('PageOne');
      expect(results[1].modulePath).toBe('../pages/page-one/page-one.module');
      expect(results[1].namedExport).toBe('PageOneModule');

      expect(results[2].component).toEqual(null);
      expect(results[2].name).toBe('PageTwo');
      expect(results[2].modulePath).toBe('../pages/page-two/page-two.module');
      expect(results[2].namedExport).toBe('PageTwoModule');

      expect(results[3].component).toEqual('MyComponent');
      expect(results[3].name).toBe('SomePage');
      expect(results[3].modulePath).toBe(null);
      expect(results[3].namedExport).toBe(null);

      expect(results[4].component).toEqual('MyComponent2');
      expect(results[4].name).toBe('SomePage2');
      expect(results[4].modulePath).toBe(null);
      expect(results[4].namedExport).toBe(null);
    });

    it('should handle configs with arrays in them', () => {
      const knownContent = `
        @NgModule({
  declarations: [
    E2EApp,
    FirstPage,
    RedirectPage,
    AnotherPage,
    MyCmpTest,
    MyCmpTest2,
    PrimaryHeaderPage,
    TabsPage,
    Tab1,
    Tab2,
    Tab3,
    TabItemPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(E2EApp, {
      swipeBackEnabled: true
    }, {
      links: [
        { component: FirstPage, name: 'first-page' },
        { component: AnotherPage, name: 'another-page' },
        { component: MyCmpTest, name: 'tab1-page1' },

        { loadChildren: './pages/full-page/full-page.module#LinkModule', name: 'full-page', defaultHistory: ['first-page', 'another-page'] },

        { component: PrimaryHeaderPage, name: 'primary-header-page', defaultHistory: ['first-page', 'full-page'] },
        { component: Tabs, name: 'tabs' },
        { component: Tab1, name: 'tab1' },
        { component: TabItemPage, name: 'item' }
      ]
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    E2EApp,
    FirstPage,
    RedirectPage,
    AnotherPage,
    PrimaryHeaderPage,
    TabsPage,
    Tab1,
    Tab2,
    Tab3,
    TabItemPage
  ]
})
export class AppModule {}
      `;

      const results = util.extractDeepLinkPathData(knownContent);

      expect(results[0].component).toEqual('FirstPage');
      expect(results[0].name).toEqual('first-page');
      expect(results[0].modulePath).toEqual(null);
      expect(results[0].namedExport).toEqual(null);

      expect(results[1].component).toEqual('AnotherPage');
      expect(results[1].name).toEqual('another-page');
      expect(results[1].modulePath).toEqual(null);
      expect(results[1].namedExport).toEqual(null);

      expect(results[2].component).toEqual('MyCmpTest');
      expect(results[2].name).toEqual('tab1-page1');
      expect(results[2].modulePath).toEqual(null);
      expect(results[2].namedExport).toEqual(null);

      expect(results[3].component).toEqual(null);
      expect(results[3].name).toEqual('full-page');
      expect(results[3].modulePath).toEqual('./pages/full-page/full-page.module');
      expect(results[3].namedExport).toEqual('LinkModule');

      expect(results[4].component).toEqual('PrimaryHeaderPage');
      expect(results[4].name).toEqual('primary-header-page');
      expect(results[4].modulePath).toEqual(null);
      expect(results[4].namedExport).toEqual(null);

      expect(results[5].component).toEqual('Tabs');
      expect(results[5].name).toEqual('tabs');
      expect(results[5].modulePath).toEqual(null);
      expect(results[5].namedExport).toEqual(null);

      expect(results[6].component).toEqual('Tab1');
      expect(results[6].name).toEqual('tab1');
      expect(results[6].modulePath).toEqual(null);
      expect(results[6].namedExport).toEqual(null);

      expect(results[7].component).toEqual('TabItemPage');
      expect(results[7].name).toEqual('item');
      expect(results[7].modulePath).toEqual(null);
      expect(results[7].namedExport).toEqual(null);
    });

    it('should throw an exception when there is an invalid deep link config', () => {
      // arrange
      const fileContent = `
import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';

import * as Constants from '../util/constants';

@NgModule({
  declarations: [
    MyApp,
    HomePage
  ],
  imports: [
    getSharedIonicModule()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage
  ],
  providers: []
})
export class AppModule {}

export function getSharedIonicModule() {
  return IonicModule.forRoot(MyApp, {}, {
    links: [
      { loadChildren: '../pages/home/home.module#HomePageModule'},
      { name: "PageOne", loadChildren: "../pages/page-one/page-one.module#PageOneModule" },
      { loadChildren: \`../pages/page-two/page-two.module#PageTwoModule\`, name: \`PageTwo\` },
      { Component: MyComponent, name: 'SomePage'},
      { name: 'SomePage2', Component: MyComponent2 }
    ]
  });
}
      `;
      // act
      const knownMessage = 'Should never get here';
      try {
        util.extractDeepLinkPathData(fileContent);
        throw new Error(knownMessage);
      } catch (ex) {
        // assert
        expect(ex.message).not.toEqual(knownMessage);
      }
    });
  });

  describe('getDeepLinkData', () => {
    it('should return an empty list when no valid deep links are found', () => {

      const fileContent = `
import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';

import * as Constants from '../util/constants';

@NgModule({
  declarations: [
    MyApp,
    HomePage
  ],
  imports: [
    getSharedIonicModule()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage
  ],
  providers: []
})
export class AppModule {}

export function getSharedIonicModule() {
  return IonicModule.forRoot(MyApp, {});
}
      `;

      const srcDir = '/Users/dan/Dev/myApp/src';
      const result = util.getDeepLinkData(join(srcDir, 'app/app.module.ts'), fileContent, false);
      expect(result).toBeTruthy();
      expect(result.length).toEqual(0);
    });

    it('should return a hydrated deep link config', () => {

      const fileContent = `
import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';

import * as Constants from '../util/constants';

@NgModule({
  declarations: [
    MyApp,
    HomePage
  ],
  imports: [
    getSharedIonicModule()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage
  ],
  providers: []
})
export class AppModule {}

export function getSharedIonicModule() {
  return IonicModule.forRoot(MyApp, {}, {
    links: [
      { loadChildren: '../pages/home/home.module#HomePageModule', name: 'Home' },
      { name: "PageOne", loadChildren: "../pages/page-one/page-one.module#PageOneModule" },
      { loadChildren: \`../pages/page-two/page-two.module#PageTwoModule\`, name: \`PageTwo\` },
      { Component: MyComponent, name: 'SomePage'},
    ]
  });
}
      `;

      const srcDir = '/Users/dan/Dev/myApp/src';
      const result = util.getDeepLinkData(join(srcDir, 'app/app.module.ts'), fileContent, false);
      expect(result[0].modulePath).toEqual('../pages/home/home.module');
      expect(result[0].namedExport).toEqual('HomePageModule');
      expect(result[0].name).toEqual('Home');
      expect(result[0].component).toEqual(null);
      expect(result[0].absolutePath).toEqual('/Users/dan/Dev/myApp/src/pages/home/home.module.ts');

      expect(result[1].modulePath).toEqual('../pages/page-one/page-one.module');
      expect(result[1].namedExport).toEqual('PageOneModule');
      expect(result[1].name).toEqual('PageOne');
      expect(result[1].component).toEqual(null);
      expect(result[1].absolutePath).toEqual('/Users/dan/Dev/myApp/src/pages/page-one/page-one.module.ts');

      expect(result[2].modulePath).toEqual('../pages/page-two/page-two.module');
      expect(result[2].namedExport).toEqual('PageTwoModule');
      expect(result[2].name).toEqual('PageTwo');
      expect(result[2].component).toEqual(null);
      expect(result[2].absolutePath).toEqual('/Users/dan/Dev/myApp/src/pages/page-two/page-two.module.ts');

      expect(result[3].modulePath).toEqual(null);
      expect(result[3].namedExport).toEqual(null);
      expect(result[3].name).toEqual('SomePage');
      expect(result[3].component).toEqual('MyComponent');
      expect(result[3].absolutePath).toEqual(null);
    });

    it('should return a deep link data adjusted for AoT', () => {

      const fileContent = `
import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';

import * as Constants from '../util/constants';

@NgModule({
  declarations: [
    MyApp,
    HomePage
  ],
  imports: [
    getSharedIonicModule()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage
  ],
  providers: []
})
export class AppModule {}

export function getSharedIonicModule() {
  return IonicModule.forRoot(MyApp, {}, {
    links: [
      { loadChildren: '../pages/home/home.module#HomePageModule', name: 'Home' },
      { name: "PageOne", loadChildren: "../pages/page-one/page-one.module#PageOneModule" },
      { loadChildren: \`../pages/page-two/page-two.module#PageTwoModule\`, name: \`PageTwo\` },
      { Component: MyComponent, name: 'SomePage'},
    ]
  });
}
      `;

      const srcDir = '/Users/dan/Dev/myApp/src';
      const result = util.getDeepLinkData(join(srcDir, 'app/app.module.ts'), fileContent, true);
      expect(result[0].modulePath).toEqual('../pages/home/home.module.ngfactory');
      expect(result[0].namedExport).toEqual('HomePageModuleNgFactory');
      expect(result[0].name).toEqual('Home');
      expect(result[0].component).toEqual(null);
      expect(result[0].absolutePath).toEqual('/Users/dan/Dev/myApp/src/pages/home/home.module.ngfactory.ts');

      expect(result[1].modulePath).toEqual('../pages/page-one/page-one.module.ngfactory');
      expect(result[1].namedExport).toEqual('PageOneModuleNgFactory');
      expect(result[1].name).toEqual('PageOne');
      expect(result[1].component).toEqual(null);
      expect(result[1].absolutePath).toEqual('/Users/dan/Dev/myApp/src/pages/page-one/page-one.module.ngfactory.ts');

      expect(result[2].modulePath).toEqual('../pages/page-two/page-two.module.ngfactory');
      expect(result[2].namedExport).toEqual('PageTwoModuleNgFactory');
      expect(result[2].name).toEqual('PageTwo');
      expect(result[2].component).toEqual(null);
      expect(result[2].absolutePath).toEqual('/Users/dan/Dev/myApp/src/pages/page-two/page-two.module.ngfactory.ts');

      expect(result[3].modulePath).toEqual(null);
      expect(result[3].namedExport).toEqual(null);
      expect(result[3].name).toEqual('SomePage');
      expect(result[3].component).toEqual('MyComponent');
      expect(result[3].absolutePath).toEqual(null);
    });
  });

  describe('validateDeepLinks', () => {
    it('should return false when one entry is missing name', () => {
      // arrange
      const invalidDeepLinkConfig: any = {
       name: null,
       component: {}
      };
      // act
      const result = util.validateDeepLinks([invalidDeepLinkConfig]);

      // assert
      expect(result).toEqual(false);
    });

    it('should return false when one entry has empty name', () => {
      // arrange
      const invalidDeepLinkConfig: any = {
       name: '',
       component: {}
      };
      // act
      const result = util.validateDeepLinks([invalidDeepLinkConfig]);

      // assert
      expect(result).toEqual(false);
    });

    it('should return false when missing component and (modulePath or namedExport)', () => {
      // arrange
      const invalidDeepLinkConfig: any = {
       name: 'someName',
       component: null,
       modulePath: null
      };

      // act
      const result = util.validateDeepLinks([invalidDeepLinkConfig]);

      // assert
      expect(result).toEqual(false);
    });

    it('should return false when missing component and (modulePath or namedExport)', () => {
      // arrange
      const invalidDeepLinkConfig: any = {
       name: 'someName',
       component: '',
       modulePath: ''
      };

      // act
      const result = util.validateDeepLinks([invalidDeepLinkConfig]);

      // assert
      expect(result).toEqual(false);
    });

    it('should return false when missing component and has valid modulePath but missing namedExport', () => {
      // arrange
      const invalidDeepLinkConfig: any = {
       name: 'someName',
       component: '',
       modulePath: 'somePath',
       namedExport: ''
      };

      // act
      const result = util.validateDeepLinks([invalidDeepLinkConfig]);

      // assert
      expect(result).toEqual(false);
    });

    it('should return true when it has a valid modulePath and namedExport', () => {
      // arrange
      const invalidDeepLinkConfig: any = {
       name: 'someName',
       component: '',
       modulePath: 'somePath',
       namedExport: 'someNamedExport'
      };

      // act
      const result = util.validateDeepLinks([invalidDeepLinkConfig]);

      // assert
      expect(result).toEqual(true);
    });

    it('should return true when it has a valid component', () => {
      // arrange
      const invalidDeepLinkConfig: any = {
       name: 'someName',
       component: 'MyComponent',
       modulePath: null,
       namedExport: null
      };

      // act
      const result = util.validateDeepLinks([invalidDeepLinkConfig]);

      // assert
      expect(result).toEqual(true);
    });
  });
});
