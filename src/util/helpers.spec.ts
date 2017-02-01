import * as helpers from './helpers';

describe('helpers', () => {
  describe('getBooleanPropertyValue', () => {
    it('should return true when value is "true"', () => {
      // arrange
      const propertyName = 'test';
      const propertyValue = 'true';
      let environment: any = { };
      environment[propertyName] = propertyValue;
      process.env = environment;
      // act
      const result = helpers.getBooleanPropertyValue(propertyName);
      // assert
      expect(result).toEqual(true);
    });

    it('should return false when value is undefined/null', () => {
      // arrange
      const propertyName = 'test';
      let environment: any = { };
      process.env = environment;
      // act
      const result = helpers.getBooleanPropertyValue(propertyName);
      // assert
      expect(result).toEqual(false);
    });

    it('should return false when value is not "true"', () => {
      // arrange
      const propertyName = 'test';
      const propertyValue = 'taco';
      let environment: any = { };
      environment[propertyName] = propertyValue;
      process.env = environment;
      // act
      const result = helpers.getBooleanPropertyValue(propertyName);
      // assert
      expect(result).toEqual(false);
    });
  });
});
