const fs = require('fs');
let c = fs.readFileSync('components/Admin/AdminDashboard.jsx', 'utf8');

c = c.replace(/const checkAuth = async \(\) => {/g, 'async function checkAuth() {');
c = c.replace(/const handleLogin = async \(e\) => {/g, 'async function handleLogin(e) {');
c = c.replace(/const fetchData = async \(currentView\) => {/g, 'async function fetchData(currentView) {');
c = c.replace(/const fetchAnalytics = async \(\) => {/g, 'async function fetchAnalytics() {');

fs.writeFileSync('components/Admin/AdminDashboard.jsx', c);
console.log('Fixed hoisting in AdminDashboard.jsx');
