import assert from 'node:assert/strict';
export async function checkDailyInteractions({browser,select,click}) {
 const {evaluate,wait,pause,command}=browser;
 await evaluate(`document.querySelector('[aria-label="Next records page"]').click()`);
 await pause(40);await select('Filter activity category','mortality');
 assert.ok((await evaluate('document.querySelector("main").textContent')).includes('Page 1 of 1'));
 await select('Filter activity category','all');
 await command('Emulation.setDeviceMetricsOverride',{width:320,height:950,deviceScaleFactor:1,mobile:true});
 await evaluate(`document.querySelector('[aria-label="Toggle Navigation Menu"]').click()`);
 await wait(`document.querySelector('[aria-label="Farmer navigation"]')`);
 await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))`);
 await wait(`!document.querySelector('[aria-label="Farmer navigation"]')`);
 await click('View details');await wait(`document.querySelector('[role="dialog"][aria-label^="Activity Details:"]')`);
 assert.ok(await evaluate(`(()=>{const panel=document.querySelector('[role="dialog"][aria-label^="Activity Details:"]');return panel.scrollWidth<=panel.clientWidth;})()`));
 await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))`);
 await wait(`!document.querySelector('[role="dialog"][aria-label^="Activity Details:"]')`);
}
