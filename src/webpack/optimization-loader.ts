import { optimizationLoader } from './optimization-loader-impl';

module.exports = function loader(source: string, map: any) {
  optimizationLoader(source, map, this);
};
