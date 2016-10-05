// Ported from 'rollup-plugin-typescript':
// https://github.com/rollup/rollup-plugin-typescript
// MIT Licenced

import * as tippex from 'tippex';


// The injected id for helpers. Intentially invalid to prevent helpers being included in source maps.
export const helpersId = '\0typescript-helpers';

export const helperImports = `import { __assign, __awaiter, __extends, __decorate, __metadata, __param } from '${helpersId}';`;

export const helperFns = `

export const __assign = Object.assign || function (target) {
    for (var source, i = 1; i < arguments.length; i++) {
        source = arguments[i];
        for (var prop in source) {
            if (Object.prototype.hasOwnProperty.call(source, prop)) {
                target[prop] = source[prop];
            }
        }
    }
    return target;
};

export function __extends(d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

export function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

export function __metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}

export function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

export function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
}
`;


// Hack around TypeScript's broken handling of `export class` with
// ES6 modules and ES5 script target.
//
// It works because TypeScript transforms
//
//     export class A {}
//
// into something like CommonJS, when we wanted ES6 modules.
//
//     var A = (function () {
//         function A() {
//         }
//         return A;
//     }());
//     exports.A = A;
//
// But
//
//     class A {}
//     export { A };
//
// is transformed into this beauty.
//
//     var A = (function () {
//         function A() {
//         }
//         return A;
//     }());
//     export { A };
//
// The solution is to replace the previous export syntax with the latter.
export function fixExportClass(code: string, id: string) {

  // Erase comments, strings etc. to avoid erroneous matches for the Regex.
  const cleanCode = getErasedCode( code, id );

  const re = /export\s+(default\s+)?((?:abstract\s+)?class)(?:\s+(\w+))?/g;
  let match: RegExpExecArray;

  while (match = re.exec(cleanCode)) {
    // To keep source maps intact, replace non-whitespace characters with spaces.
    code = erase( code, match.index, match[ 0 ].indexOf( match[ 2 ] ) );

    let name = match[ 3 ];

    if ( match[ 1 ] ) { // it is a default export

      // TODO: support this too
      if ( !name ) throw new Error( `TypeScript Plugin: cannot export an un-named class (module ${ id })` );

      // Export the name ` as default`.
      name += ' as default';
    }

    // To keep source maps intact, append the injected exports last.
    code += `\nexport { ${ name } };`;
  }

  return code;
}

function getErasedCode (code: string, id: string) {
  try {
    return tippex.erase( code );
  } catch (e) {
    throw new Error( `rollup-plugin-typescript: ${ e.message }; when processing: '${ id }'` );
  }
}

function erase (code: string, start: number, length: number) {
  const end = start + length;

  return code.slice(0, start) +
    code.slice(start, end).replace( /[^\s]/g, ' ' ) +
    code.slice(end);
}
