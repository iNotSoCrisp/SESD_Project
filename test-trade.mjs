import axios from 'axios';
const client = axios.create({ baseURL: 'http://localhost:3000/api' });
async function run() {
  try {
    const uid = Date.now();
    await client.post('/auth/register', { email: `test${uid}@t.com`, username: `user${uid}`, password: 'password123' });
    const loginRes = await client.post('/auth/login', { email: `test${uid}@t.com`, password: 'password123' });
    const token = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0].split(';')[0].substring(6) : null;
    const authClient = axios.create({ baseURL: 'http://localhost:3000/api', headers: { Cookie: `token=${token}` } });
    let accRes = await authClient.get('/accounts');
    if (accRes.data.data.length === 0) {
      await authClient.post('/accounts', { name: "Paper", currency: "USD", initialBalance: 100000 });
      accRes = await authClient.get('/accounts');
    }
    const acc = accRes.data.data[0];
    const tradeRes = await authClient.post('/trades', {
      accountId: acc.id, symbol: "AAPL", direction: "LONG", orderType: "MARKET", quantity: 1, emotion: "Greed"
    });
    console.log("SUCCESS:", JSON.stringify(tradeRes.data));
  } catch (e) {
    if (e.response) {
      console.log("API ERROR:", e.response.status, e.response.data.error || e.response.data);
    } else {
      console.log("NETWORK ERROR:", e.message);
    }
  }
}
run();
