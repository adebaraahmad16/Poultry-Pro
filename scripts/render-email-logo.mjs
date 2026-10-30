// Raster copy of the existing logo for email clients that do not render SVG.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fixtureBrowser} from './fixtures/browser.js';
await mkdir('.ui-checks/email-logo',{recursive:true});
const browser=await fixtureBrowser(resolve('.ui-checks/email-logo/chrome-profile'));
try{
 await browser.command('Emulation.setDeviceMetricsOverride',{width:128,height:128,deviceScaleFactor:2,mobile:false});
 await browser.command('Emulation.setDefaultBackgroundColorOverride',{color:{r:255,g:255,b:255,a:0}});
 await browser.command('Page.navigate',{url:'data:image/svg+xml;base64,'+Buffer.from(await readFile('public/logo.svg')).toString('base64')});
 await browser.pause(250);
 const screenshot=await browser.command('Page.captureScreenshot',{format:'png'});
 await writeFile('public/logo-email.png',Buffer.from(screenshot.data,'base64'));
 console.log('Created email PNG from the existing PoultryPro SVG logo.');
}finally{await browser.close();}
