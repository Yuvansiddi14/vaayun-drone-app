const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', error => console.error('BROWSER ERROR:', error.message));

  await page.goto('http://localhost:5174/');
  
  // Wait for the app to load
  await page.waitForSelector('.mobile-product-card');

  // Click on a product to select it
  const productCard = await page.$('.mobile-product-card');
  await productCard.click();

  // Wait for Add to Cart button in overlay and click it
  await page.waitForSelector('.btn-add-cart');
  const addToCartBtn = await page.$('.btn-add-cart');
  await addToCartBtn.click();

  // Wait for cart drawer
  await page.waitForSelector('.drawer-overlay');
  
  // Click Place Drone Order button
  const checkoutBtns = await page.$$('.btn-checkout');
  // Usually the last button in the cart
  await checkoutBtns[checkoutBtns.length - 1].click();

  // Wait for location overlay
  await new Promise(r => setTimeout(r, 500));
  
  // Click Confirm & Proceed to Payment
  const locBtns = await page.$$('.btn-checkout');
  await locBtns[locBtns.length - 1].click();

  // Wait for payment overlay
  await new Promise(r => setTimeout(r, 500));

  // Click Pay and place the order
  const payBtns = await page.$$('.btn-checkout');
  await payBtns[payBtns.length - 1].click();

  // Wait 3 seconds to see what happens
  await new Promise(r => setTimeout(r, 3000));

  await browser.close();
})();
