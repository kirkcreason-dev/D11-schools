// "Our proposal" — Creaso-Norse Technologies' response to D11 RFI S2026-0019, built into the concept site.
import {shell, esc, route} from './common.js';
import {bid} from './bid-details.js';
shell('proposal');
document.title = 'Our proposal · RFI ' + bid.rfi;
const main = document.querySelector('#main');
const money = n => '$' + Number(n).toLocaleString('en-US');
const todo = (label, hint) => `<div class="notice error todo"><strong>To complete before submission: ${esc(label)}</strong>${hint ? `<br><span class="small">${esc(hint)}</span>` : ''}</div>`;
const val = (v, label, hint) => v ? esc(v) : todo(label, hint);
let missing = [
  ['vendorAddress', 'Vendor address'], ['contactTitle', 'Contact title'], ['contactPhone', 'Contact phone'], ['contactEmail', 'Contact email'],
  ['k12Experience', 'K–12 experience'], ['districtsServed', 'Number and size of districts served'], ['comparableSites', 'Comparable district and school websites'],
  ['familyMessagesAddOn', 'Family messages add-on price'], ['contractTerm', 'Contract length'], ['priceAdjustment', 'Annual price-adjustment structure'],
  ['cooperativeAgreements', 'Cooperative purchasing / procurement vehicles'], ['references', 'References (districts with ~40–80 school sites preferred)']
].filter(([k]) => bid[k] == null || (Array.isArray(bid[k]) && !bid[k].length));
(Array.isArray(bid.references) ? bid.references : []).forEach(r => { if (!r.contactOnRequest && (!r.name || !(r.phone || r.email))) missing.push(['ref', 'Reference contact for ' + r.organization]); if (!r.role) missing.push(['ref', 'How you worked with ' + r.organization]); });

const sec = (n, title, body) => `<section class="proposal-section" id="s${n}"><h2><span class="num">${n}</span>${title}</h2>${body}</section>`;
const list = items => `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
const refList = Array.isArray(bid.references) ? bid.references : [];
const refs = refList.length
  ? `<p>Client references (not school districts; see section 3). Because these are high-profile clients, contact details are shared directly with the District on request rather than published.</p><div class="table-wrap"><table><thead><tr><th>Organization</th><th>Relationship</th><th>Contact</th></tr></thead><tbody>${refList.map(r => `<tr><td><strong>${esc(r.organization)}</strong></td><td>${r.role ? esc(r.role) : todo('Relationship', 'What Creaso-Norse built or does for them.')}</td><td>${r.contactOnRequest ? 'Provided directly to the District on request.' : r.name && (r.phone || r.email) ? `${esc(r.name)}<br>${esc(r.phone || '')}<br>${esc(r.email || '')}` : todo('Contact name and phone/email', 'The District will call references.')}</td></tr>`).join('')}</tbody></table></div>`
  : todo('References', 'The RFI asks for references from comparable districts, ideally operating about 40 to 80 school websites.');
main.innerHTML = `
<section class="hero schoolhero proposal-hero"><div class="wrap hero-inner"><div>
 <div class="eyebrow">Response to Request for Information ${esc(bid.rfi)} · ${esc(bid.rfiTitle)}</div>
 <h1>Every school site.<br><em>One flat rate.</em></h1>
 <p>${esc(bid.vendor)} proposes a complete, bilingual website platform for Colorado Springs School District 11 and all 58 school and program sites, including design, migration, hosting, training and support, for <strong>${money(bid.annualPrice)} per year</strong>.</p>
 <p class="manifesto-line">Software keeps getting cheaper to build. School budgets shouldn’t keep paying more for it.</p>
 <div class="buttons"><button class="btn gold" id="print-proposal" type="button">Print or save as PDF</button><a class="btn ghost" href="${route('index')}">Explore the working concept</a></div>
</div><aside class="price-card" aria-label="Pricing summary"><div class="small">Flat annual rate</div><strong>${money(bid.annualPrice)}</strong><div>per year · all-inclusive</div><hr><div class="small">Implementation &amp; migration</div><strong class="sm">${bid.implementationFee ? money(bid.implementationFee) : 'Included'}</strong><hr><div class="small">School sites covered</div><strong class="sm">District + 58</strong><hr><div class="small">Run it yourself, any time</div><strong class="sm">Free transition</strong></aside></div></section>

${missing.length ? `<div class="wrap"><div class="notice error todo-list" id="todo-list"><strong>Draft: ${missing.length} item${missing.length > 1 ? 's' : ''} to complete before submission</strong>${list(missing.map(([, l]) => esc(l)))}<span class="small">These boxes disappear once the details are filled in. Responses are due ${esc(bid.dueDate)} through BidNet Direct.</span></div></div>` : ''}

<div class="wrap proposal">
<nav class="card proposal-toc" aria-label="Proposal contents"><h2>Contents</h2><ol>
 ${['Vendor & contact', 'Company & platform overview', 'K–12 experience', 'Districts served', 'Comparable websites', 'Services & capabilities', 'Implementation, migration, training & support', 'Accessibility, hosting, security & data ownership', 'PowerSchool compatibility', 'Pricing', 'Procurement vehicles', 'Contract length & price adjustment', 'References', 'Demonstration availability', 'Optional services'].map((x, i) => `<li><a href="#s${i + 1}">${x}</a></li>`).join('')}
</ol></nav>

${sec(1, 'Vendor & primary contact', `<dl class="facts"><dt>Vendor</dt><dd>${esc(bid.vendor)}</dd><dt>Address</dt><dd>${val(bid.vendorAddress, 'Vendor address')}</dd><dt>Primary contact</dt><dd>${esc(bid.contactName)}</dd><dt>Title</dt><dd>${val(bid.contactTitle, 'Contact title')}</dd><dt>Telephone</dt><dd>${val(bid.contactPhone, 'Contact phone')}</dd><dt>Email</dt><dd>${val(bid.contactEmail, 'Contact email')}</dd></dl>`)}

${sec(2, 'Company & proposed platform', `<blockquote class="manifesto"><strong>A new kind of software company.</strong> The cost of building and running software keeps going down, yet what schools pay for it keeps going up. We don’t understand that, and we’re here to change it. That is why one flat rate covers everything the District wants, fixed for five years, and why we will hand you the keys to run your own site, free, whenever you’re ready.</blockquote><p>${esc(bid.vendor)} designs, builds and operates custom websites and mobile apps, and runs them for its clients after launch. ${esc(bid.teamNote)}</p>
<p>The proposed platform is the one shown in this concept: a single, district-owned system that runs the district site and every school site from one shared design, one search, one bilingual publishing workflow and one set of permissions. Schools keep their own names, colors, logos and voice. The district keeps control of branding, accessibility and critical alerts.</p>
<p>It answers the RFI’s central goal directly: a nimble marketing platform that lets nontechnical staff publish engaging, accurate content quickly, without vendor intervention. <a href="staff.html#try">Try the editor yourself.</a></p>`)}

${sec(3, 'Experience serving public K–12 districts', `<p>${val(bid.k12Experience, 'K–12 experience', 'Describe honestly any K–12 or public-sector work. If D11 would be the first district client, say so and point to the working concept and comparable multi-site work.')}</p>`)}

${sec(4, 'Number and size of districts served', `<p>${val(bid.districtsServed, 'Number and size of districts currently served')}</p>`)}

${sec(5, 'Comparable district and school websites', `<p>This working concept, built for D11, demonstrates the full multi-site experience: the district home, a directory of all 58 school and program sites, individual school homepages, family resources, a calendar with phone-calendar downloads, sitewide search, English and Spanish throughout, and a hands-on staff editor.</p>${bid.comparableSites ? `<p>${esc(bid.comparableSites)}</p>` : todo('Other comparable sites', 'List live sites you have built, if any are comparable.')}`)}

${sec(6, 'Services and capabilities', list([
 '<strong>Website strategy, design and UX:</strong> a modern, mobile-first design system for the district and all school sites, built around what families look for most: their school, enrollment, meals, transportation, calendars and who to call.',
 '<strong>Content management for district and school users:</strong> a bilingual editor with drafts, review and publishing, version history and restore, a media library, and ready-made templates for spotlights, events, newsletters and achievements.',
 '<strong>District branding with school flexibility:</strong> shared templates keep every site consistent; each school sets its identity, homepage message and stories.',
 '<strong>Governance:</strong> role-based permissions (district owner, publishers, school editors assigned per school), review before publishing, and districtwide alerts that reach all 58 sites at once and expire automatically.',
 '<strong>Mobile-responsive and multilingual:</strong> every page in English and Spanish; content cannot be published until both languages are complete. Additional languages can be added.',
 '<strong>Search, analytics and reporting:</strong> one search across all school sites, contacts, resources, news and events; privacy-respecting visitor analytics by school and language.',
 '<strong>Migration tools:</strong> bulk import, redirect mapping from every old address, and broken-link reporting before launch.'
]))}

${sec(7, 'Implementation, migration, training and support', `<p>Proposed timeline from contract signature. Schools launch in waves so no school is left without a site.</p>
<div class="table-wrap"><table><thead><tr><th>Phase</th><th>Weeks</th><th>What happens</th></tr></thead><tbody>
<tr><td>Discovery</td><td>1–3</td><td>Stakeholder sessions, content inventory of the district site and every school site, brand and governance decisions.</td></tr>
<tr><td>Design &amp; build</td><td>3–10</td><td>Final design system, templates, permissions, search, integrations with district systems.</td></tr>
<tr><td>Migration</td><td>6–16</td><td>Content owners mark each page keep, merge, rewrite or retire; automated import of pages, documents and images; redirects for every old address. See the <a href="page.html?id=migration-map">migration map</a>.</td></tr>
<tr><td>Training</td><td>12–18</td><td>Hands-on sessions for central communications staff and school editors, short how-to videos and bilingual quick guides.</td></tr>
<tr><td>Launch</td><td>16–24</td><td>District site and schools go live in waves, each signed off by its principal; accessibility and link checks on every migrated page.</td></tr>
</tbody></table></div>
<p><strong>Ongoing support:</strong> a named account manager, help for every school editor, platform updates and new features, and quarterly reviews of analytics and content health, all included in the flat rate.</p>`)}

${sec(8, 'Accessibility, hosting, security and data ownership', list([
 '<strong>Accessibility:</strong> built to WCAG 2.1 AA: keyboard navigation, visible focus, labeled forms, image descriptions required in both languages, sufficient color contrast and reduced-motion support. Every page of this concept passes automated checks for alt text, labels, contrast, heading order and phone layout; a formal third-party audit is part of launch.',
 '<strong>Hosting and reliability:</strong> managed cloud hosting with a content delivery network, HTTPS everywhere, monitoring and backups, all included.',
 '<strong>Security:</strong> district single sign-on for staff, least-privilege roles, review before publishing, and a full audit trail of every change.',
 '<strong>Data ownership:</strong> the District owns all content, images and data, and can export it at any time. ' + esc(bid.ownershipAtEnd || ''),
 '<strong>Independence:</strong> ' + esc(bid.selfManage || ''),
 '<strong>Student privacy:</strong> the public site collects no student records.'
]))}

${sec(9, 'Compatibility with the PowerSchool environment', `<p>District 11 keeps PowerSchool, MyPowerHub and SchoolMessenger. The platform works alongside them and does not replace them:</p>${list([
 'MyPowerHub links hand families off to the district’s own sign-in; passwords are never entered on the website.',
 'Alerts published on the website can be mirrored to SchoolMessenger so families see the same message everywhere.',
 'Schoology, Office 365 and staff tools stay connected through district single sign-on.',
 'Board agenda and policy portals, scheduling tools and the bus stop finder remain connected or embedded.'
])}<p><a href="page.html?id=powerschool">See how it looks for families.</a></p>`)}

${sec(10, 'Pricing', `<div class="price-band"><div><strong>${money(bid.annualPrice)}</strong><span>per year, flat rate</span></div><div><strong>${bid.implementationFee ? money(bid.implementationFee) : '$0'}</strong><span>separate implementation fee</span></div><div><strong>District + 58</strong><span>sites included</span></div></div>
<p><strong>Included in the flat rate:</strong> design, build, content migration, hosting, security, accessibility work, integrations, training, support, account management and ongoing platform updates for the district site and every school site. No per-site, per-user or per-page fees.</p>
<p><strong>Major cost variables:</strong> none. The flat rate covers whatever the District wants during the term, including new sites, pages, users, features, integrations and the optional services in section 15, with no additional charges.</p><p><strong>Term:</strong> ${esc(bid.contractTerm)} ${esc(bid.priceAdjustment)}</p><p><strong>Free transition to self-management:</strong> ${esc(bid.selfManage || '')}</p>`)}

${sec(11, 'Cooperative purchasing and procurement vehicles', `<p>${val(bid.cooperativeAgreements, 'Cooperative purchasing agreements or other procurement vehicles', 'If none, say so: e.g. "Direct contract with the District."')}</p>`)}

${sec(12, 'Contract length and annual price adjustment', `<p><strong>Typical contract length:</strong> ${val(bid.contractTerm, 'Contract length')}</p><p><strong>Annual price adjustment:</strong> ${val(bid.priceAdjustment, 'Price-adjustment structure')}</p>${bid.ownershipAtEnd ? `<p><strong>End of contract:</strong> ${esc(bid.ownershipAtEnd)}</p>` : ''}${bid.selfManage ? `<p><strong>Any time before then:</strong> ${esc(bid.selfManage)}</p>` : ''}`)}

${sec(13, 'References', refs)}

${sec(14, 'Demonstration and follow-up', `<p>${esc(bid.vendor)} is available for an informational demonstration and follow-up discussions at the District’s convenience. The demonstration covers the working concept, the staff publishing workspace live, migration tools, permissions and content recovery.</p>`)}

${sec(15, 'Optional services', `<p>As the RFI requests, optional products are identified separately from the core website platform. Both are included in the flat rate.</p><dl class="facts"><dt>Family messages</dt><dd>Optional two-way messaging between families and school staff, in English or Spanish, with district controls. Does not replace SchoolMessenger. Price: ${bid.familyMessagesAddOn ? esc(bid.familyMessagesAddOn) : todo('Family messages add-on price')}</dd><dt>Mobile apps</dt><dd>${esc(bid.vendor)} builds and maintains iOS and Android apps. A District 11 app is available on request within the flat rate.</dd></dl>`)}

<p class="source">This proposal and concept were prepared by ${esc(bid.vendor)} in response to RFI ${esc(bid.rfi)}. The concept is not the official District 11 website. School names, addresses and identities come from public district directories.</p>
</div>`;
document.querySelector('#print-proposal').onclick = () => window.print();
