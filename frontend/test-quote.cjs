async function test() {
  const { getQuote } = await import('./src/services/finnhub.ts');
  console.log(await getQuote('GR.NE'));
}
test().catch(console.error);
