import { TestHelper, ValidationHelper } from './test/ValidationHelper';

async function runTests() {
  console.log('Starting tests...');

  try {
    // Setup test data
    console.log('Setting up test data...');
    const testData = await TestHelper.setupTestData();

    // Test Device model
    console.log('Testing Device model...');
    const device = testData.device;
    const validationErrors = ValidationHelper.validateDevice(device);
    if (validationErrors.length > 0) {
      throw new Error(`Device validation failed: ${validationErrors.join(', ')}`);
    }
    console.log('✓ Device model test passed');

    // Test Team model
    console.log('Testing Team model...');
    const team = testData.team;
    const teamValidationErrors = ValidationHelper.validateTeam(team);
    if (teamValidationErrors.length > 0) {
      throw new Error(`Team validation failed: ${teamValidationErrors.join(', ')}`);
    }
    console.log('✓ Team model test passed');

    // Test Phone model
    console.log('Testing Phone model...');
    const phone = testData.phone;
    const phoneValidationErrors = ValidationHelper.validatePhone(phone);
    if (phoneValidationErrors.length > 0) {
      throw new Error(`Phone validation failed: ${phoneValidationErrors.join(', ')}`);
    }
    console.log('✓ Phone model test passed');

    // Test User model
    console.log('Testing User model...');
    const user = testData.user;
    const userValidationErrors = ValidationHelper.validateUser(user);
    if (userValidationErrors.length > 0) {
      throw new Error(`User validation failed: ${userValidationErrors.join(', ')}`);
    }
    console.log('✓ User model test passed');

    console.log('\nAll tests passed! ✓');
  } catch (error) {
    console.error('\nTest failed:', error.message);
    process.exit(1);
  } finally {
    // Cleanup test data
    console.log('Cleaning up test data...');
    await TestHelper.cleanupTestData();
    console.log('Cleanup completed!');
  }
}

runTests();
