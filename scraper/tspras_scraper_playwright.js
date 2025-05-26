import { chromium } from 'playwright'
import fs from 'fs/promises'

const DIRECTORY_URL = 'https://turkplasticsurgery.org/?p=member-list'

async function scrapeTSPRAS() {
  const browser = await chromium.launch({ headless: false, slowMo: 50 })
  const page = await browser.newPage()

  await page.goto(DIRECTORY_URL, { waitUntil: 'networkidle' })

  // Wait for the iframe to appear
  const iframeElement = await page.waitForSelector('iframe', { timeout: 30000 })
  const frame = await iframeElement.contentFrame()

  // Wait for the real table to load inside the iframe
  await frame.waitForSelector('tr.tbl', { timeout: 30000 })

  // Scrape the doctor rows
  const doctors = await frame.$$eval('tr.tbl', rows => {
    return rows.map(row => {
      const cells = row.querySelectorAll('td')
      const name = cells[0]?.innerText.trim() || ''
      const clinic = cells[1]?.innerText.trim() || ''
      const profileRelative = cells[0]?.querySelector('a')?.getAttribute('href') || ''
      const profileUrl = profileRelative ? `https://turkplasticsurgery.org${profileRelative}` : ''

      return {
        name,
        clinic,
        profile_url: profileUrl
      }
    })
  })

  await fs.writeFile('surgeons.json', JSON.stringify(doctors, null, 2))
  console.log(`✅ Scraped ${doctors.length} surgeons.`)

  await browser.close()
}

scrapeTSPRAS().catch(err => {
  console.error('❌ Failed to scrape:', err)
})
