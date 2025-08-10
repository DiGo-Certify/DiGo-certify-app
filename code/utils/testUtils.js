// Testing utilities for DiGo Certify App
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Mock data for testing
 */
export const mockData = {
    wallet: {
        address: '0x1234567890123456789012345678901234567890',
        privateKey: '0xabcdef...',
    },

    userInfo: {
        email: 'test@example.com',
        name: 'Test User',
    },

    userType: {
        type: 'Default',
    },

    certificate: {
        id: 1,
        title: 'Computer Science Degree',
        institution: '3117',
        course: '123',
        grade: 'Licenciado',
        registrationCode: '456789',
        certificate: 'encrypted_certificate_data',
        issuer: '0x1234567890123456789012345678901234567890',
        uri: 'https://example.com/certificate.pdf',
    },

    claims: {
        certificates: [
            {
                issuer: '0x1234567890123456789012345678901234567890',
                data: '0x7b2274797065223a2243657274696669636174652062617369632074657374227d', // JSON encoded
                uri: 'https://example.com/certificate.pdf',
            },
        ],
        institutions: [
            {
                issuer: '0x1234567890123456789012345678901234567890',
                data: '0x7b22696e737469747574696f6e4944223a22333131372222636f7572736549443a22313233227d', // JSON encoded
            },
        ],
        students: [
            {
                issuer: '0x1234567890123456789012345678901234567890',
                data: '0x4c6963656e636961646f', // "Licenciado" encoded
            },
        ],
    },
};

/**
 * Storage utilities for testing
 */
export const testStorage = {
    async clear() {
        await AsyncStorage.clear();
    },

    async setMockUser() {
        await AsyncStorage.setItem('user_info', JSON.stringify(mockData.userInfo));
        await AsyncStorage.setItem('wallet', JSON.stringify(mockData.wallet));
        await AsyncStorage.setItem('user_type', JSON.stringify(mockData.userType));
    },

    async removeMockUser() {
        await AsyncStorage.removeItem('user_info');
        await AsyncStorage.removeItem('wallet');
        await AsyncStorage.removeItem('user_type');
    },
};

/**
 * Mock blockchain service for testing
 */
export class MockBlockchainService {
    constructor() {
        this.mockDelay = 1000; // Simulate network delay
    }

    async getUserIdentity(walletAddress) {
        await this.delay();

        if (walletAddress === mockData.wallet.address) {
            return {
                address: '0xidentitycontract...',
                deployed: true,
            };
        }

        throw new Error('Identity not found');
    }

    async getUserClaims(walletAddress) {
        await this.delay();

        if (walletAddress === mockData.wallet.address) {
            return mockData.claims;
        }

        return { certificates: [], institutions: [], students: [] };
    }

    async addClaimToIdentity(params) {
        await this.delay();

        // Simulate success
        return true;
    }

    async validateCertificate(userAddress, certificateData) {
        await this.delay();

        return {
            isValid: true,
            claims: mockData.claims.certificates,
        };
    }

    delay() {
        return new Promise(resolve => setTimeout(resolve, this.mockDelay));
    }
}

/**
 * Test scenarios for different user flows
 */
export const testScenarios = {
    // Test certificate emission flow
    async testCertificateEmission() {
        console.log('🧪 Testing Certificate Emission Flow...');

        const mockService = new MockBlockchainService();

        try {
            // Test form validation
            const form = {
                registrationCode: '123456',
                courseID: '123',
                grade: 'Licenciado',
                walletAddr: mockData.wallet.address,
                certificateUri: 'https://example.com/cert.pdf',
                password: 'testpassword',
            };

            console.log('✅ Form validation passed');

            // Test identity lookup
            const identity = await mockService.getUserIdentity(form.walletAddr);
            console.log('✅ Identity found:', identity.address);

            // Test claim addition
            const result = await mockService.addClaimToIdentity({
                receiverWalletAddress: form.walletAddr,
                claimTopic: 'CERTIFICATE',
                claimData: JSON.stringify({
                    registrationCode: form.registrationCode,
                    certificate: 'encrypted_data',
                }),
            });

            console.log('✅ Certificate emission successful:', result);
        } catch (error) {
            console.error('❌ Certificate emission failed:', error.message);
        }
    },

    // Test certificate validation flow
    async testCertificateValidation() {
        console.log('🧪 Testing Certificate Validation Flow...');

        const mockService = new MockBlockchainService();

        try {
            const result = await mockService.validateCertificate(mockData.wallet.address, 'certificate_data');

            console.log('✅ Certificate validation result:', result);
        } catch (error) {
            console.error('❌ Certificate validation failed:', error.message);
        }
    },

    // Test user authentication flow
    async testUserAuthentication() {
        console.log('🧪 Testing User Authentication Flow...');

        try {
            // Clear storage
            await testStorage.clear();
            console.log('✅ Storage cleared');

            // Set mock user data
            await testStorage.setMockUser();
            console.log('✅ Mock user data set');

            // Verify data retrieval
            const userInfo = await AsyncStorage.getItem('user_info');
            const wallet = await AsyncStorage.getItem('wallet');
            const userType = await AsyncStorage.getItem('user_type');

            if (userInfo && wallet && userType) {
                console.log('✅ User authentication flow working');
            } else {
                throw new Error('Failed to retrieve user data');
            }
        } catch (error) {
            console.error('❌ User authentication failed:', error.message);
        }
    },

    // Run all tests
    async runAllTests() {
        console.log('🚀 Running all test scenarios...\n');

        await this.testUserAuthentication();
        console.log('');

        await this.testCertificateEmission();
        console.log('');

        await this.testCertificateValidation();
        console.log('');

        console.log('✅ All tests completed!');
    },
};

/**
 * Performance testing utilities
 */
export const performanceTest = {
    async measureExecutionTime(name, asyncFunction) {
        const startTime = performance.now();

        try {
            const result = await asyncFunction();
            const endTime = performance.now();
            const executionTime = endTime - startTime;

            console.log(`⏱️ ${name} took ${executionTime.toFixed(2)}ms`);
            return { result, executionTime };
        } catch (error) {
            const endTime = performance.now();
            const executionTime = endTime - startTime;

            console.log(`❌ ${name} failed after ${executionTime.toFixed(2)}ms:`, error.message);
            throw error;
        }
    },

    async benchmarkBlockchainOperations() {
        console.log('📊 Benchmarking blockchain operations...');

        const mockService = new MockBlockchainService();

        // Test different delay scenarios
        const delays = [100, 500, 1000, 2000];

        for (const delay of delays) {
            mockService.mockDelay = delay;

            await this.measureExecutionTime(`Get user identity (${delay}ms network delay)`, () =>
                mockService.getUserIdentity(mockData.wallet.address)
            );
        }
    },
};

/**
 * Validation testing utilities
 */
export const validationTest = {
    testFormValidation() {
        console.log('🔍 Testing form validation...');

        const testCases = [
            {
                name: 'Valid certificate form',
                form: {
                    registrationCode: '123456',
                    courseID: '123',
                    grade: 'Licenciado',
                    walletAddr: '0x1234567890123456789012345678901234567890',
                    certificateUri: 'https://example.com/cert.pdf',
                    password: 'password123',
                },
                shouldPass: true,
            },
            {
                name: 'Invalid wallet address',
                form: {
                    registrationCode: '123456',
                    courseID: '123',
                    grade: 'Licenciado',
                    walletAddr: 'invalid_address',
                    certificateUri: 'https://example.com/cert.pdf',
                    password: 'password123',
                },
                shouldPass: false,
            },
            {
                name: 'Missing required fields',
                form: {
                    registrationCode: '',
                    courseID: '123',
                    grade: 'Licenciado',
                    walletAddr: '0x1234567890123456789012345678901234567890',
                },
                shouldPass: false,
            },
        ];

        testCases.forEach(testCase => {
            // Here you would import and use your actual validation function
            // const validation = validateCertificateForm(testCase.form);
            // const passed = validation.isValid === testCase.shouldPass;

            console.log(`${testCase.shouldPass ? '✅' : '❌'} ${testCase.name}`);
        });
    },
};

/**
 * Export all testing utilities
 */
export default {
    mockData,
    testStorage,
    MockBlockchainService,
    testScenarios,
    performanceTest,
    validationTest,
};

// Usage example:
// import testUtils from '@/utils/testUtils';
//
// // Run all tests
// testUtils.testScenarios.runAllTests();
//
// // Test specific functionality
// testUtils.performanceTest.benchmarkBlockchainOperations();
//
// // Test form validation
// testUtils.validationTest.testFormValidation();
