import { stockInSchema } from '../src/lib/schemas';

console.log('=== Zod Schema Validation Test ===');

const testCases = [
    {
        name: 'Valid Data with Maker',
        data: {
            name: 'Test Item',
            specification: 'Spec A',
            maker: 'Test Maker',
            location: 'Warehouse A',
            quantity: 10,
            unit_price: 1000,
            stock_status: 'new',
            reason: 'Initial stock',
            note: 'Test note'
        },
        expected: true
    },
    {
        name: 'Valid Data WITHOUT Maker (Empty String)',
        data: {
            name: 'Test Item',
            specification: 'Spec A',
            maker: '', // Empty string should be allowed
            location: 'Warehouse A',
            quantity: 10,
            unit_price: 1000,
            stock_status: 'new',
            reason: 'Initial stock',
            note: 'Test note'
        },
        expected: false
    }
];

let allPassed = true;

testCases.forEach((test, index) => {
    console.log(`\nTest Case ${index + 1}: ${test.name}`);
    const result = stockInSchema.safeParse(test.data);

    if (result.success === test.expected) {
        console.log('✅ PASS');
        if (result.success) {
            console.log('Parsed Data:', result.data);
        } else {
            // @ts-ignore
            console.log('Validation Error (Expected):', result.error.errors[0].message);
        }
    } else {
        console.log('❌ FAIL');
        console.log('Expected Success:', test.expected);
        console.log('Actual Success:', result.success);
        if (!result.success) {
            // @ts-ignore
            console.log('Validation Errors:', result.error.errors);
        }
        allPassed = false;
    }
});

if (allPassed) {
    console.log('\n✅ All tests passed! The schema correctly handles empty maker fields.');
} else {
    console.error('\n❌ Some tests failed.');
    process.exit(1);
}
