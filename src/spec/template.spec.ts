import { inlineTemplate, replaceTemplateUrl } from '../template';
import { getTemplateMatch, getTemplateFormat, replaceBundleJsTemplate } from '../template';


describe('template', () => {

  describe('inlineTemplate', () => {

    it('should do nothing for files with incomplete Component', () => {
      const sourceText = `
        // Component this be bork
      `;
      const sourcePath = 'somefile.ts';
      const output = inlineTemplate(sourceText, sourcePath);

      expect(output).toEqual(sourceText);
    });

    it('should do nothing for files with incomplete Component', () => {
      const sourceText = `
        // Component this be bork
      `;
      const sourcePath = 'somefile.ts';
      const output = inlineTemplate(sourceText, sourcePath);

      expect(output).toEqual(sourceText);
    });

    it('should do nothing for files without Component', () => {
      const sourceText = `
        console.log('yeah nothing');
      `;
      const sourcePath = 'somefile.ts';
      const output = inlineTemplate(sourceText, sourcePath);

      expect(output).toEqual(sourceText);
    });

    describe('replaceTemplateUrl', () => {

      it('should turn the template into one line', () => {
        const str = `
          Component({
            templateUrl: "somepage.html"})`;
        const templateContent = `
          <div>\t
            this is "multiline" 'content'
          </div>\r
        `;
        const htmlFilePath = '/full/path/to/somepage.html';
        const match = getTemplateMatch(str);
        const result = replaceTemplateUrl(match, htmlFilePath, templateContent);

        const expected = `Component({template:/*ion-inline-start:"/full/path/to/somepage.html"*/'\\n          <div>\t\\n            this is "multiline" \\'content\\'\\n          </div>\\n\\n        '/*ion-inline-end:"/full/path/to/somepage.html"*/})`;

        expect(result).toEqual(expected);
      });

    });

    describe('replaceBundleJsTemplate', () => {

      it('should replace already inlined template with new content', () => {
        const htmlFilePath = 'c:\\path/to\some/crazy:thing.html;';
        const oldContent = 'some old content';
        const tmplate = getTemplateFormat(htmlFilePath, oldContent);
        const bundleSourceText = `
          @Component({
            selector: 'yo-div',
            /*blah*/${tmplate}/*derp*/
          })
          @Component({
            selector: 'yo-div2',
            /*222*/${tmplate}/*2222*/
          })
        `;
        const newContent = 'some new content';
        const output = replaceBundleJsTemplate(bundleSourceText, newContent, htmlFilePath);
        expect(output.indexOf(newContent)).toEqual(141);
        expect(output.indexOf(newContent, 142)).toEqual(373);
      });

    });

    describe('COMPONENT_REGEX match', () => {

      it('should get Component with template url and selector above', () => {
        const str = `
          Component({
            selector: 'page-home',
            templateUrl: 'home.html'
          })
        `;

        const match = getTemplateMatch(str);
        expect(match.templateUrl).toEqual('home.html');
      });

      it('should get Component with template url and selector below', () => {
        const str = `
          Component({
            templateUrl: 'home.html',
            selector: 'page-home
          })
        `;

        const match = getTemplateMatch(str);
        expect(match.templateUrl).toEqual('home.html');
      });

      it('should get Component with template url, spaces, tabs and new lines', () => {
        const str = `\t\n\r
          Component(
            {

              templateUrl :
                \t\n\r"c:\\some\windows\path.ts"

            }
          )
        `;

        const match = getTemplateMatch(str);
        expect(match.templateUrl).toEqual('c:\\some\windows\path.ts');
      });

      it('should get Component with template url and spaces', () => {
        const str = '  Component  (  {  templateUrl  :  `  hi  `  }  )  ';
        const match = getTemplateMatch(str);
        expect(match.component).toEqual('Component  (  {  templateUrl  :  `  hi  `  }  )');
        expect(match.templateProperty).toEqual('  templateUrl  :  `  hi  `');
        expect(match.templateUrl).toEqual('hi');
      });

      it('should get Component with template url and back-ticks', () => {
        const str = 'Component({templateUrl:`hi`})';
        const match = getTemplateMatch(str);
        expect(match.component).toEqual('Component({templateUrl:`hi`})');
        expect(match.templateProperty).toEqual('templateUrl:`hi`');
        expect(match.templateUrl).toEqual('hi');
      });

      it('should get Component with template url and double quotes', () => {
        const str = 'Component({templateUrl:"hi"})';
        const match = getTemplateMatch(str);
        expect(match.component).toEqual('Component({templateUrl:"hi"})');
        expect(match.templateProperty).toEqual('templateUrl:"hi"');
        expect(match.templateUrl).toEqual('hi');
      });

      it('should get Component with template url and single quotes', () => {
        const str = 'Component({templateUrl:\'hi\'})';
        const match = getTemplateMatch(str);
        expect(match.component).toEqual('Component({templateUrl:\'hi\'})');
        expect(match.templateProperty).toEqual('templateUrl:\'hi\'');
        expect(match.templateUrl).toEqual('hi');
      });

      it('should get null for Component without string for templateUrl', () => {
        const str = 'Component({templateUrl:someVar})';
        const match = getTemplateMatch(str);
        expect(match).toEqual(null);
      });

      it('should get null for Component without templateUrl', () => {
        const str = 'Component({template:"hi"})';
        const match = getTemplateMatch(str);
        expect(match).toEqual(null);
      });

      it('should get null for Component without brackets', () => {
        const str = 'Component()';
        const match = getTemplateMatch(str);
        expect(match).toEqual(null);
      });

      it('should get null for Component without parentheses', () => {
        const str = 'Component';
        const match = getTemplateMatch(str);
        expect(match).toEqual(null);
      });

      it('should get null for Component({})', () => {
        const str = 'Component';
        const match = getTemplateMatch(str);
        expect(match).toEqual(null);
      });

      it('should get null for no Component', () => {
        const str = 'whatever';
        const match = getTemplateMatch(str);
        expect(match).toEqual(null);
      });

    });

  });

});
