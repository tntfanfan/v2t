// Exit 0: the expected site is running; 10: stopped; 20: do not reuse this port.
const [port, expectedTitle] = process.argv.slice(2);
if (!/^\d+$/.test(port ?? '') || !expectedTitle) {
  console.error('Usage: node check-local-site.mjs PORT TITLE');
  process.exit(20);
}

const url = `http://127.0.0.1:${port}/`;
try {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(5000),
    redirect: 'manual',
  });
  const html = await response.text();
  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? '';
  if (response.ok && title.includes(expectedTitle)) {
    console.log(`The site is already running: ${url}`);
    process.exitCode = 0;
  } else {
    console.error(`Port ${port} is in use, but the expected page is not available.`);
    console.error('No other service was stopped. Check the service window for errors.');
    process.exitCode = 20;
  }
} catch (error) {
  if (error.cause?.code === 'ECONNREFUSED') {
    console.log(`Starting the local site: ${url}`);
    process.exitCode = 10;
  } else {
    console.error(`Could not check ${url}: ${error.message}`);
    process.exitCode = 20;
  }
}
