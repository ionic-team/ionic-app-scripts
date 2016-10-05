import { inlineTemplate, replaceTemplateUrl } from '../template';
import { COMPONENT_REGEX } from '../template';


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
          <div>\r
            this is multiline content
          </div>
        `;
        const match = COMPONENT_REGEX.exec(str);
        const result = replaceTemplateUrl(match, templateContent);
        expect(result).toEqual(`@Component({template: '\\n          <div>\\n\\n            this is multiline content\\n          </div>\\n        ' /* ion-inline-template */})`);
      });

    });

    describe('COMPONENT_REGEX match', () => {

      it('should get @Component with template url, spaces, tabs and new lines', () => {
        const str = `\t\n\r
          @Component(
            {

              templateUrl :
                \t\n\r"c:\\some\windows\path.ts"

            }
          )
        `;

        const match = COMPONENT_REGEX.exec(str);
        expect(match[4]).toEqual('c:\\some\windows\path.ts');
      });

      it('should get @Component with template url and spaces', () => {
        const str = '  @Component  (  {  templateUrl  :  `  hi  `  }  )  ';
        const match = COMPONENT_REGEX.exec(str);
        expect(match[0]).toEqual('@Component  (  {  templateUrl  :  `  hi  `  }  )');
        expect(match[1]).toEqual('{  templateUrl  :  `  hi  `  }  ');
        expect(match[2]).toEqual('  templateUrl  :  `  hi  `  ');
        expect(match[3]).toEqual('`');
        expect(match[4]).toEqual('  hi  ');
        expect(match[5]).toEqual('`');
      });

      it('should get @Component with template url and back-ticks', () => {
        const str = '@Component({templateUrl:`hi`})';
        const match = COMPONENT_REGEX.exec(str);
        expect(match[0]).toEqual('@Component({templateUrl:`hi`})');
        expect(match[1]).toEqual('{templateUrl:`hi`}');
        expect(match[2]).toEqual('templateUrl:`hi`');
        expect(match[3]).toEqual('`');
        expect(match[4]).toEqual('hi');
        expect(match[5]).toEqual('`');
      });

      it('should get @Component with template url and double quotes', () => {
        const str = '@Component({templateUrl:"hi"})';
        const match = COMPONENT_REGEX.exec(str);
        expect(match[0]).toEqual('@Component({templateUrl:"hi"})');
        expect(match[1]).toEqual('{templateUrl:"hi"}');
        expect(match[2]).toEqual('templateUrl:"hi"');
        expect(match[3]).toEqual('"');
        expect(match[4]).toEqual('hi');
        expect(match[5]).toEqual('"');
      });

      it('should get @Component with template url and single quotes', () => {
        const str = '@Component({templateUrl:\'hi\'})';
        const match = COMPONENT_REGEX.exec(str);
        expect(match[0]).toEqual('@Component({templateUrl:\'hi\'})');
        expect(match[1]).toEqual('{templateUrl:\'hi\'}');
        expect(match[2]).toEqual('templateUrl:\'hi\'');
        expect(match[3]).toEqual('\'');
        expect(match[4]).toEqual('hi');
        expect(match[5]).toEqual('\'');
      });

      it('should get null for @Component without string for templateUrl', () => {
        const str = '@Component({templateUrl:someVar})';
        const match = COMPONENT_REGEX.exec(str);
        expect(match).toEqual(null);
      });

      it('should get null for @Component without templateUrl', () => {
        const str = '@Component({template:"hi"})';
        const match = COMPONENT_REGEX.exec(str);
        expect(match).toEqual(null);
      });

      it('should get null for @Component without brackets', () => {
        const str = '@Component()';
        const match = COMPONENT_REGEX.exec(str);
        expect(match).toEqual(null);
      });

      it('should get null for @Component without parentheses', () => {
        const str = '@Component';
        const match = COMPONENT_REGEX.exec(str);
        expect(match).toEqual(null);
      });

      it('should get null for Component({})', () => {
        const str = 'Component';
        const match = COMPONENT_REGEX.exec(str);
        expect(match).toEqual(null);
      });

      it('should get null for no @Component', () => {
        const str = 'whatever';
        const match = COMPONENT_REGEX.exec(str);
        expect(match).toEqual(null);
      });

    });

  });

});
