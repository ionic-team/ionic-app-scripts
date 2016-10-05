import { inlineTemplate, replaceTemplateUrl } from '../template';
import { getTemplateMatch } from '../template';


describe('template', () => {

  describe('inlineTemplate', () => {

    it('should do nothing for files with incomplete @Component', () => {
      const sourceText = `
        // @Component this be bork
      `;
      const sourcePath = 'somefile.ts';
      const output = inlineTemplate(sourceText, sourcePath);

      expect(output).toEqual(null);
    });

    it('should do nothing for files with incomplete @Component', () => {
      const sourceText = `
        // @Component this be bork
      `;
      const sourcePath = 'somefile.ts';
      const output = inlineTemplate(sourceText, sourcePath);

      expect(output).toEqual(null);
    });

    it('should do nothing for files without @Component', () => {
      const sourceText = `
        console.log('yeah nothing');
      `;
      const sourcePath = 'somefile.ts';
      const output = inlineTemplate(sourceText, sourcePath);

      expect(output).toEqual(null);
    });

    describe('replaceTemplateUrl', () => {

      it('should turn the template into one line', () => {
        const str = `
          @Component({
            templateUrl: "somepage.html"
          })
        `;
        const templateContent = `
          <div>
            this is multiline content
          </div>
        `;
        const match = getTemplateMatch(str);
        const result = replaceTemplateUrl(match, templateContent);

        expect(result).toEqual(`@Component({template: /* ion-inline-template */ \`
          <div>
            this is multiline content
          </div>
        \`
          })`);
      });

    });

    describe('COMPONENT_REGEX match', () => {

      it('should get @Component with template url and selector above', () => {
        const str = `
          @Component({
            selector: 'page-home',
            templateUrl: 'home.html'
          })
        `;

        const match = getTemplateMatch(str);
        expect(match.templateUrl).toEqual('home.html');
      });

      it('should get @Component with template url and selector below', () => {
        const str = `
          @Component({
            templateUrl: 'home.html',
            selector: 'page-home
          })
        `;

        const match = getTemplateMatch(str);
        expect(match.templateUrl).toEqual('home.html');
      });

      it('should get @Component with template url, spaces, tabs and new lines', () => {
        const str = `\t\n\r
          @Component(
            {

              templateUrl :
                \t\n\r"c:\\some\windows\path.ts"

            }
          )
        `;

        const match = getTemplateMatch(str);
        expect(match.templateUrl).toEqual('c:\\some\windows\path.ts');
      });

      it('should get @Component with template url and spaces', () => {
        const str = '  @Component  (  {  templateUrl  :  `  hi  `  }  )  ';
        const match = getTemplateMatch(str);
        expect(match.component).toEqual('@Component  (  {  templateUrl  :  `  hi  `  }  )');
        expect(match.templateProperty).toEqual('  templateUrl  :  `  hi  `');
        expect(match.templateUrl).toEqual('hi');
      });

      it('should get @Component with template url and back-ticks', () => {
        const str = '@Component({templateUrl:`hi`})';
        const match = getTemplateMatch(str);
        expect(match.component).toEqual('@Component({templateUrl:`hi`})');
        expect(match.templateProperty).toEqual('templateUrl:`hi`');
        expect(match.templateUrl).toEqual('hi');
      });

      it('should get @Component with template url and double quotes', () => {
        const str = '@Component({templateUrl:"hi"})';
        const match = getTemplateMatch(str);
        expect(match.component).toEqual('@Component({templateUrl:"hi"})');
        expect(match.templateProperty).toEqual('templateUrl:"hi"');
        expect(match.templateUrl).toEqual('hi');
      });

      it('should get @Component with template url and single quotes', () => {
        const str = '@Component({templateUrl:\'hi\'})';
        const match = getTemplateMatch(str);
        expect(match.component).toEqual('@Component({templateUrl:\'hi\'})');
        expect(match.templateProperty).toEqual('templateUrl:\'hi\'');
        expect(match.templateUrl).toEqual('hi');
      });

      it('should get null for @Component without string for templateUrl', () => {
        const str = '@Component({templateUrl:someVar})';
        const match = getTemplateMatch(str);
        expect(match).toEqual(null);
      });

      it('should get null for @Component without templateUrl', () => {
        const str = '@Component({template:"hi"})';
        const match = getTemplateMatch(str);
        expect(match).toEqual(null);
      });

      it('should get null for @Component without brackets', () => {
        const str = '@Component()';
        const match = getTemplateMatch(str);
        expect(match).toEqual(null);
      });

      it('should get null for @Component without parentheses', () => {
        const str = '@Component';
        const match = getTemplateMatch(str);
        expect(match).toEqual(null);
      });

      it('should get null for Component({})', () => {
        const str = 'Component';
        const match = getTemplateMatch(str);
        expect(match).toEqual(null);
      });

      it('should get null for no @Component', () => {
        const str = 'whatever';
        const match = getTemplateMatch(str);
        expect(match).toEqual(null);
      });

    });

  });

});
