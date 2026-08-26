import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');

console.log('=== Starting NEC-13 Frontend Foundation Verification ===\n');

let passCount = 0;
let failCount = 0;

const assert = (condition, testName) => {
  if (condition) {
    console.log(`✔ [PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`✖ [FAIL] ${testName}`);
    failCount++;
  }
};

// 1. Check directory structure
console.log('--- 1. Frontend Structure Verification ---');
const requiredFiles = [
  'package.json',
  'vite.config.js',
  'index.html',
  '.env.example',
  'src/main.jsx',
  'src/App.jsx',
  'src/styles/global.css',
  'src/services/api.js',
  'src/context/AuthContext.jsx',
  'src/routes/ProtectedRoute.jsx',
  'src/components/Navbar.jsx',
  'src/components/Sidebar.jsx',
  'src/pages/Landing.jsx',
  'src/pages/Login.jsx',
  'src/pages/Register.jsx',
  'src/pages/Dashboard.jsx'
];

requiredFiles.forEach((file) => {
  const filePath = path.join(frontendDir, file);
  assert(fs.existsSync(filePath), `Required file exists: ${file}`);
});

// 2. Verify Package.json configuration
console.log('\n--- 2. Package Configuration Verification ---');
const pkg = JSON.parse(fs.readFileSync(path.join(frontendDir, 'package.json'), 'utf-8'));
assert(pkg.dependencies.react !== undefined, 'React dependency installed');
assert(pkg.dependencies['react-dom'] !== undefined, 'React-DOM dependency installed');
assert(pkg.dependencies['react-router-dom'] !== undefined, 'React-Router-DOM dependency installed');
assert(pkg.dependencies['lucide-react'] !== undefined, 'Lucide icons dependency installed');
assert(pkg.devDependencies.vite !== undefined, 'Vite devDependency configured');

// 3. Verify App Router configuration
console.log('\n--- 3. Router & Route Paths Verification ---');
const appContent = fs.readFileSync(path.join(frontendDir, 'src/App.jsx'), 'utf-8');
assert(appContent.includes('path="/"') && appContent.includes('<Landing'), 'Landing page route configured at "/"');
assert(appContent.includes('path="/login"') && appContent.includes('<Login'), 'Login page route configured at "/login"');
assert(appContent.includes('path="/register"') && appContent.includes('<Register'), 'Register page route configured at "/register"');
assert(appContent.includes('path="/dashboard/*"') && appContent.includes('ProtectedRoute'), 'Protected dashboard route configured at "/dashboard/*"');

// 4. Verify AuthContext implementation
console.log('\n--- 4. AuthContext & State Management Verification ---');
const authContextContent = fs.readFileSync(path.join(frontendDir, 'src/context/AuthContext.jsx'), 'utf-8');
assert(authContextContent.includes('createContext'), 'AuthContext created');
assert(authContextContent.includes('api.auth.getMe'), 'Session restoration calls /api/auth/me');
assert(authContextContent.includes('api.auth.login'), 'AuthContext provides login method');
assert(authContextContent.includes('api.auth.register'), 'AuthContext provides register method');
assert(authContextContent.includes('removeToken'), 'AuthContext provides logout method');
assert(authContextContent.includes('useAuth'), 'useAuth custom hook exported');

// 5. Verify API Service implementation
console.log('\n--- 5. API Service & Token Management Verification ---');
const apiContent = fs.readFileSync(path.join(frontendDir, 'src/services/api.js'), 'utf-8');
assert(apiContent.includes('VITE_API_URL'), 'API service uses VITE_API_URL environment configuration');
assert(apiContent.includes('Authorization') && apiContent.includes('Bearer'), 'API service injects Bearer token into headers');
assert(apiContent.includes('/api/auth/login'), 'API service maps /api/auth/login');
assert(apiContent.includes('/api/auth/register'), 'API service maps /api/auth/register');
assert(apiContent.includes('/api/auth/me'), 'API service maps /api/auth/me');
assert(apiContent.includes('/api/health'), 'API service maps /api/health');

// 6. Verify ProtectedRoute logic
console.log('\n--- 6. ProtectedRoute Logic Verification ---');
const protectedRouteContent = fs.readFileSync(path.join(frontendDir, 'src/routes/ProtectedRoute.jsx'), 'utf-8');
assert(protectedRouteContent.includes('useAuth()'), 'ProtectedRoute consumes AuthContext');
assert(protectedRouteContent.includes('Navigate to="/login"'), 'Unauthenticated users redirected to /login');
assert(protectedRouteContent.includes('state={{ from: location }}'), 'Intended destination preserved in redirect state');

// 7. Verify Build Output
console.log('\n--- 7. Vite Build Artifacts Verification ---');
const distHtml = path.join(frontendDir, 'dist/index.html');
assert(fs.existsSync(distHtml), 'Vite production build output exists (dist/index.html)');

console.log('\n========================================================');
console.log(`=== FRONTEND VERIFICATION COMPLETED: ${passCount} PASSED, ${failCount} FAILED ===`);
console.log('========================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
