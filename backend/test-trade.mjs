async function run() {
  try {
    const uid = Date.now();
    const headers = {'Content-Type':'application/json'};
    const authReg = await fetch('http://localhost:3000/api/auth/register', { method:'POST', headers, body: JSON.stringify({ email: `test${uid}@t.com`, username: `user${uid}`, password: 'password123' })});
    
    const loginRes = await fetch('http://localhost:3000/api/auth/login', { method:'POST', headers, body: JSON.stringify({ email: `test${uid}@t.com`, password: 'password123' })});
    const loginData = await loginRes.json();
    const token = loginData.data?.token;

    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    let accRes = await fetch('http://localhost:3000/api/accounts', { headers: authHeaders });
    let accData = await accRes.json();
    if (!accData.data || accData.data.length === 0) {
      await fetch('http://localhost:3000/api/accounts', { method:'POST', headers: authHeaders, body: JSON.stringify({ name: "Paper", currency: "USD", initialBalance: 100000 })});
      accRes = await fetch('http://localhost:3000/api/accounts', { headers: authHeaders });
      accData = await accRes.json();
    }
    const acc = accData.data[0];
    const tradeRes = await fetch('http://localhost:3000/api/trades', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        accountId: acc.id, symbol: "AAPL", direction: "LONG", orderType: "MARKET", quantity: 1, emotion: "Greed"
      })
    });
    console.log("STATUS:", tradeRes.status);
    console.log("RESPONSE:", await tradeRes.text());
  } catch (e) {
    console.log("ERROR:", e);
  }
}
run();
