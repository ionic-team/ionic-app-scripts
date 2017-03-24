
export class BuildError extends Error {
  hasBeenLogged = false;
  isFatal: boolean = false;

  constructor(error: Error | string) {
    super(error instanceof Error ? error.message : error);
    if (error instanceof Error) {
      this.message = error.message;
      this.stack = error.stack;
      this.name = error.name;
      this.hasBeenLogged = (error as BuildError).hasBeenLogged;
      this.isFatal = (error as BuildError).isFatal;
    }
  }
}


/* There are special cases where strange things happen where we don't want any logging, etc.
 * For our sake, it is much easier to get off the happy path of code and just throw an exception
 * and do nothing with it
 */
export class IgnorableError extends Error {
  constructor(msg?: string) {
    super(msg);
  }
}
