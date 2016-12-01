import { createSourceFile, Node, ScriptTarget, SourceFile, SyntaxKind} from 'typescript';

export function getTypescriptSourceFile(filePath: string, fileContent: string, languageVersion: ScriptTarget, setParentNodes: boolean): SourceFile {
  return createSourceFile(filePath, fileContent, languageVersion, setParentNodes);
}

export function removeDecorators(fileName: string, source: string): string {
  const sourceFile = createSourceFile(fileName, source, ScriptTarget.Latest);
  const decorators = findNodes(sourceFile, sourceFile, SyntaxKind.Decorator, true);
  decorators.sort((a, b) => b.pos - a.pos);
  decorators.forEach(d => {
    source = source.slice(0, d.pos) + source.slice(d.end);
  });

  return source;
}

export function findNodes(sourceFile: SourceFile, node: Node, kind: SyntaxKind, keepGoing = false): Node[] {
  if (node.kind === kind && !keepGoing) {
    return [node];
  }

  return node.getChildren(sourceFile).reduce((result, n) => {
    return result.concat(findNodes(sourceFile, n, kind, keepGoing));
  }, node.kind === kind ? [node] : []);
}
