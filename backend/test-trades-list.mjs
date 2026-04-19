async function run() {
  try {
    const loginRes = await fetch('http://localhost:3000/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: `test1776565193200@t.com`, password: 'password123' })});
    const loginData = await loginRes.json();
    const token = loginData.data.token;
    
    // Now get trades!
    const tradesRes = await fetch('http://localhost:3000/api/trades', { headers: { 'Authorization': `Bearer ${token}` } });
    console.log("LIST TRADES STATUS:", tradesRes.status);
    console.log("RESPONSE:", await tradesRes.text());
  } catch(e) {
    console.log(e);
  }
}
run();
