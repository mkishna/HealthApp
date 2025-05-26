import fs from 'fs'

// Load original scraped data
const raw = JSON.parse(fs.readFileSync('surgeons.json'))

// Step 1: Create unique clinics
const clinicMap = {}
const clinics = []
let clinicCounter = 1

raw.forEach(entry => {
  const name = entry.clinic.trim()
  if (name && !clinicMap[name]) {
    clinicMap[name] = clinicCounter++
    clinics.push({
      clinic_id: clinicMap[name],
      name: name,
      city: null,
      country: 'Turkey'
    })
  }
})

// Step 2: Filter and map valid surgeons
const surgeons = raw
  .filter(entry => entry.name && entry.clinic && entry.profile_url && clinicMap[entry.clinic.trim()])
  .map(entry => ({
    name: entry.name.trim(),
    clinic_id: clinicMap[entry.clinic.trim()],
    profile_url: entry.profile_url
  }))


fs.writeFileSync('clinics.json', JSON.stringify(clinics, null, 2))
fs.writeFileSync('surgeons_mapped.json', JSON.stringify(surgeons, null, 2))
console.log(`✅ Created ${clinics.length} clinics and ${surgeons.length} surgeons`)
