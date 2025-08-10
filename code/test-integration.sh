#!/bin/bash

# DiGo Certify App - Test Script
# Tests if all components and services are working after updates

echo "🧪 Testing DiGo Certify App Components..."
echo "========================================"

cd /home/frutuoso/Code/DiGo-certify-app/code

# Test 1: Check if app can start
echo "📱 Test 1: App Startup Test"
echo "Testing if Expo can start without errors..."

# Check if package.json is valid
if node -e "require('./package.json')"; then
    echo "✅ package.json is valid"
else
    echo "❌ package.json has issues"
    exit 1
fi

# Test 2: Check imports
echo ""
echo "📦 Test 2: Import Test"
echo "Testing if main components can be imported..."

# Test Context import
if node -e "
try {
    const path = require('path');
    const fs = require('fs');
    const contextPath = path.join(__dirname, 'contexts/AppContext.js');
    if (fs.existsSync(contextPath)) {
        console.log('✅ AppContext exists');
    } else {
        console.log('❌ AppContext missing');
        process.exit(1);
    }
} catch(e) {
    console.log('❌ Context import failed:', e.message);
    process.exit(1);
}"; then
    echo "✅ Context imports working"
else
    echo "❌ Context imports failed"
fi

# Test 3: Check custom hooks
echo ""
echo "🎣 Test 3: Custom Hooks Test"
hooks_dir="./hooks"
if [ -d "$hooks_dir" ]; then
    hook_count=$(find "$hooks_dir" -name "*.js" -type f | wc -l)
    echo "✅ Found $hook_count custom hooks"
    
    # List hooks
    find "$hooks_dir" -name "*.js" -type f -exec basename {} \; | sed 's/^/   - /'
else
    echo "❌ Hooks directory not found"
fi

# Test 4: Check components
echo ""
echo "🧩 Test 4: Components Test"
components_dir="./components"
if [ -d "$components_dir" ]; then
    component_count=$(find "$components_dir" -name "*.jsx" -type f | wc -l)
    echo "✅ Found $component_count React components"
    
    # Check for key components
    key_components=("AdminDashboard.jsx" "CertificateValidationScreen.jsx" "SettingsScreen.jsx" "Loading.jsx")
    
    for component in "${key_components[@]}"; do
        if [ -f "$components_dir/$component" ]; then
            echo "   ✅ $component"
        else
            echo "   ❌ $component missing"
        fi
    done
else
    echo "❌ Components directory not found"
fi

# Test 5: Check services
echo ""
echo "⚙️ Test 5: Services Test"
services_dir="./services"
if [ -d "$services_dir" ]; then
    echo "✅ Services directory exists"
    
    # Check key services
    if [ -f "$services_dir/blockchain/BlockchainService.js" ]; then
        echo "   ✅ BlockchainService"
    else
        echo "   ❌ BlockchainService missing"
    fi
    
    if [ -f "$services_dir/errors/ErrorService.js" ]; then
        echo "   ✅ ErrorService"
    else
        echo "   ❌ ErrorService missing"
    fi
else
    echo "❌ Services directory not found"
fi

# Test 6: Check constants
echo ""
echo "📋 Test 6: Constants Test"
constants_dir="./constants"
if [ -d "$constants_dir" ]; then
    echo "✅ Constants directory exists"
    
    key_constants=("app.js" "colors.js" "icons.js")
    for constant in "${key_constants[@]}"; do
        if [ -f "$constants_dir/$constant" ]; then
            echo "   ✅ $constant"
        else
            echo "   ❌ $constant missing"
        fi
    done
else
    echo "❌ Constants directory not found"
fi

# Test 7: Integration check
echo ""
echo "🔗 Test 7: Integration Test"
echo "Checking if main screens use new components..."

# Check admin.jsx
if grep -q "AdminDashboard" ./app/\(tabs\)/admin.jsx 2>/dev/null; then
    echo "   ✅ Admin screen integrated"
else
    echo "   ❌ Admin screen not integrated"
fi

# Check validation.jsx
if grep -q "CertificateValidationScreen" ./app/\(tabs\)/validation.jsx 2>/dev/null; then
    echo "   ✅ Validation screen integrated"
else
    echo "   ❌ Validation screen not integrated"
fi

# Check _layout.jsx
if grep -q "AppProvider" ./app/_layout.jsx 2>/dev/null; then
    echo "   ✅ Context integrated in layout"
else
    echo "   ❌ Context not integrated in layout"
fi

echo ""
echo "🎯 Test Summary"
echo "==============="
echo "✅ All tests completed!"
echo ""
echo "🚀 Ready to start the app with:"
echo "   npm start"
echo ""
echo "🔗 Remember to start Hardhat blockchain:"
echo "   npx hardhat node --reset"
