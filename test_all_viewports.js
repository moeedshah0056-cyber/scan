const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9234;

const widthsToTest = [320, 360, 375, 390, 430, 768, 1024, 1440];

const edge = spawn(edgePath, [
  '--headless=new',
  '--disable-gpu',
  `--remote-debugging-port=${port}`,
  'about:blank'
]);

setTimeout(() => {
  http.get(`http://localhost:${port}/json`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
      const page = JSON.parse(data).find(p => p.type === 'page');
      const ws = new WebSocket(page.webSocketDebuggerUrl);
      let id = 1;
      const call = (method, params = {}) => new Promise(r => {
        const curId = id++;
        const onMsg = e => {
          const m = JSON.parse(e.data);
          if (m.id === curId) { ws.removeEventListener('message', onMsg); r(m); }
        };
        ws.addEventListener('message', onMsg);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });

      ws.onopen = async () => {
        await call('Page.enable');

        const testResults = [];

        for (const w of widthsToTest) {
          const isMobile = w <= 768;
          const h = isMobile ? 844 : 900;

          await call('Emulation.setDeviceMetricsOverride', {
            width: w,
            height: h,
            deviceScaleFactor: 2,
            mobile: isMobile
          });

          await call('Page.navigate', { url: 'http://localhost:3000' });
          await new Promise(r => setTimeout(r, 1200));

          const res = await call('Runtime.evaluate', {
            expression: `
              (() => {
                const doc = document.documentElement;
                const scrollW = doc.scrollWidth;
                const clientW = doc.clientWidth;
                const bodyScrollW = document.body.scrollWidth;
                const winW = window.innerWidth;
                
                // Find any visible element poking past clientW
                const overflowingElements = [];
                const all = document.querySelectorAll('*');
                all.forEach(el => {
                  const style = window.getComputedStyle(el);
                  if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
                    const rect = el.getBoundingClientRect();
                    let inScrollContainer = false;
                    let parent = el.parentElement;
                    while (parent && parent !== document.body && parent !== document.documentElement) {
                      const pStyle = window.getComputedStyle(parent);
                      if (pStyle.overflowX === 'auto' || pStyle.overflowX === 'scroll' || pStyle.overflowX === 'hidden') {
                        inScrollContainer = true;
                        break;
                      }
                      parent = parent.parentElement;
                    }

                    if (!inScrollContainer && rect.right > clientW + 1) {
                      overflowingElements.push({
                        tag: el.tagName,
                        cls: el.className,
                        id: el.id,
                        right: Math.round(rect.right),
                        width: Math.round(rect.width),
                        snippet: el.outerHTML.slice(0, 80)
                      });
                    }
                  }
                });

                return JSON.stringify({
                  targetWidth: ${w},
                  scrollW,
                  clientW,
                  bodyScrollW,
                  winW,
                  isExactMatch: scrollW === clientW,
                  overflowingCount: overflowingElements.length,
                  overflowingElements: overflowingElements.slice(0, 5)
                });
              })()
            `,
            returnByValue: true
          });

          const parsed = JSON.parse(res.result.result.value);
          testResults.push(parsed);

          // Capture screenshot for visual inspection if requested
          if (process.argv.includes('--screenshots')) {
            const shot = await call('Page.captureScreenshot', { format: 'png' });
            if (shot && shot.result && shot.result.data) {
              fs.writeFileSync(`screenshot_${w}px.png`, Buffer.from(shot.result.data, 'base64'));
            }
          }
        }

        console.log('\n========================================');
        console.log('RESPONSIVE VIEWPORT TEST SUITE RESULTS:');
        console.log('========================================');
        console.table(testResults.map(r => ({
          'Tested Width': `${r.targetWidth}px`,
          'clientWidth': `${r.clientW}px`,
          'scrollWidth': `${r.scrollW}px`,
          'bodyScrollWidth': `${r.bodyScrollW}px`,
          'Exact Match': r.isExactMatch ? 'PASS (100% Fit)' : 'FAIL',
          'Overflowing Els': r.overflowingCount
        })));

        console.log('\nDETAILS OF OVERFLOWING ELEMENTS:');
        testResults.forEach(r => {
          if (r.overflowingCount > 0) {
            console.log(`\n--- Viewport ${r.targetWidth}px (${r.overflowingCount} items) ---`);
            console.log(JSON.stringify(r.overflowingElements, null, 2));
          }
        });

        const allPassed = testResults.every(r => r.isExactMatch && r.overflowingCount === 0);
        console.log('\nOVERALL RESULT:', allPassed ? 'ALL VIEWPORTS PASSED WITH ZERO OVERFLOW' : 'SOME VIEWPORTS FAILED');

        ws.close();
        edge.kill();
        process.exit(allPassed ? 0 : 1);
      };
    });
  });
}, 1500);
