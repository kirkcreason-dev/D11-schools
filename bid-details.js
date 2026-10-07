// Kirk's bid facts for D11 RFI S2026-0019. Anything set to null shows on the proposal page
// as a highlighted "to complete" box and in the checklist at the top. Fill these in, rebuild, done.
export const bid = {
  rfi: 'S2026-0019',
  rfiTitle: 'District and School Website Services',
  dueDate: 'October 12, 2026, 4:00 p.m. Mountain Time',
  vendor: 'Creaso-Norse Technologies',
  vendorAddress: '3401 Quebec Street, Suite 9000, Denver, CO 80206',              // street, city, state, ZIP
  contactName: 'Kirk Creason',
  contactTitle: 'Owner',               // e.g. Founder / CEO
  contactPhone: '816-971-4160',
  contactEmail: 'kirkcreason@creaso-norsetech.com',
  districtRate: 2000,              // per year, district site
  schoolRate: 1000,                // per year, each school or program site
  schoolCount: 58,
  annualPrice: 60000,               // flat rate per year, all-inclusive
  implementationFee: 0,             // included in the flat rate
  familyMessagesAddOn: 'Included in the flat rate',        // optional add-on price per year, or 'Included'
  contractTerm: 'Five-year fixed term.',               // e.g. 'Three-year initial term with two optional one-year renewals'
  priceAdjustment: 'None. The price stays at $60,000 per year for all five years.',            // e.g. 'Price held flat for the initial term'
  cooperativeAgreements: 'None. Direct contract with the District.',      // e.g. 'None; direct contract with the District'
  k12Experience: 'None to date. District 11 would be Creaso-Norse Technologies’ first school district client. The working concept on this site was built specifically for D11 to show exactly what the District would receive.',              // honest summary of K-12 / public-sector work
  districtsServed: 'None currently. D11 would receive the full attention of the team as the first district client.',            // number and size of districts currently served
  comparableSites: 'jcwlunacy.net, a live member website with accounts, live chat, video episodes and browser games, built and operated by Creaso-Norse Technologies; and mobile apps built and maintained by the company, including the Psychopathic Records companion app and the JCW Lunacy app on the App Store and Google Play.',            // list of comparable sites besides this concept
  references: [{organization: 'Psychopathic Records', role: 'Client: websites and mobile apps', contactOnRequest: true}],                 // array of {name, organization, role, phone, email, sites}
  ownershipAtEnd: 'At the end of the contract, the District owns the website.',
  selfManage: 'Whenever the District is ready, Creaso-Norse Technologies will transition it to manage its own site, free of charge: the complete site, all content, documentation and hands-on training. No more relying on outside vendors.',
  demoUrl: 'https://kirkcreason-dev.github.io/D11-schools/',
  founderNote: 'Owner Kirk Creason has been building websites and software since 1999, and the company runs websites with over 20,000 pages.',
  ownerPromise: 'We will customize the site any way the District wants. No corporate layers: the District works directly with the owner, and customization requests are handled the same day.',
  appPrice: 40000,                 // optional District 11 mobile app (iOS + Android)
  appPeriod: 'one-time build',
  appMaintenance: 12000,           // per year after launch
  familyNote: 'Creaso-Norse Technologies is part of the Creaso family of organizations, alongside Creaso Camps LLC, which manages campgrounds for Denver Water at multiple reservoirs and holds right-of-way cleaning contracts with the City of Lakewood, Colorado, and the Creaso Cares Foundation, a nonprofit that helps people experiencing homelessness and veterans.',
  publicSector: 'Public-sector contracting: through its sister company Creaso Camps LLC, the Creaso family already delivers ongoing contracts for Denver Water and the City of Lakewood, Colorado.',
  teamNote: 'Support & Operations is led by Andy Montgomery.'
};
