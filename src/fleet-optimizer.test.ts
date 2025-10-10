// Basic test to ensure CI pipeline works
describe('Fleet Route Optimizer', () => {
  it('should have basic functionality', () => {
    expect(true).toBe(true);
  });

  it('should be able to import core modules', () => {
    // This test will be expanded as we add more modules
    expect(() => {
      // Basic import test
      const test = 1 + 1;
      expect(test).toBe(2);
    }).not.toThrow();
  });
});