

export function rollupNG2() {
  return {
    name: 'rollupNG2',

    resolveId(id: string) {
      if (id.startsWith('rxjs/')) {
        return `${process.cwd()}/node_modules/rxjs-es/${id.split('rxjs/').pop()}.js`;
      }
    }

  };
}
