// tspras_scraper.js (updated for turkplasticsurgery.org)
import puppeteer from 'puppeteer'
import fs from 'fs/promises'

const results = []

async function scrapeTSPRASDirectory() {
  const browser = await puppeteer.launch({ headless: false, slowMo: 50 })
  const page = await browser.newPage()

  await page.goto('https://turkplasticsurgery.org/?p=member-list', {
    waitUntil: 'networkidle2'
  })

  // Wait for the list of members to load
  //await page.waitForSelector('.member-listing')
  await page.waitForSelector('.member-item', { timeout: 60000 })


  const doctors = await page.$$eval('.member-listing .single-member', nodes => {
    return nodes.map(node => {
      const name = node.querySelector('h3')?.innerText.trim() || ''
      const clinic = node.querySelector('p')?.innerText.trim() || ''
      const contactRaw = node.innerText

      return {
        name,
        clinic,
        contact_info: contactRaw
      }
    })
  })

  console.log(`✅ Scraped ${doctors.length} surgeons from turkplasticsurgery.org`)
  results.push(...doctors)
  await browser.close()
}

async function main() {
  try {
    await scrapeTSPRASDirectory()
    await fs.writeFile('surgeons.json', JSON.stringify(results, null, 2))
    console.log(`🎉 Saved ${results.length} surgeon records to surgeons.json`)
  } catch (err) {
    console.error('⚠️ Scraping failed:', err.message)
  }
}

main()
