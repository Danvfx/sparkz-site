// Starter facts and APA 7 references. Every fact on the page carries an in-text citation linking to its entry in #sources.
const link = (u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`;

export const REFS = [
  { id: 'gaia2019', cite: 'Global Alliance for Incinerator Alternatives, 2019',
    html: `Global Alliance for Incinerator Alternatives. (2019, March 7). <i>Plastics exposed: How waste assessments and brand audits are helping Philippine cities fight plastic pollution</i> [Press release]. ${link('https://www.no-burn.org/gaia-report-plastics-exposed-how-waste-assessments-and-brand-audits-are-helping-philippine-cities-fight-plastic-pollution/')}` },
  { id: 'meijer2021', cite: 'Meijer et al., 2021', // TODO: verify the author list and DOI on the article page
    html: `Meijer, L. J. J., van Emmerik, T., van der Ent, R., Schmidt, C., &amp; Lebreton, L. (2021). More than 1000 rivers account for 80% of global riverine plastic emissions into the ocean. <i>Science Advances, 7</i>(18), Article eabd5803. ${link('https://doi.org/10.1126/sciadv.abd5803')}` },
  { id: 'neu2020', cite: 'Northeastern University, 2020', // TODO: if the page names an author, use the author instead
    html: `Northeastern University. (2020, December 7). <i>Food containers and utensils made from sugar pulp could be a game-changer to battle plastic pollution</i>. News@Northeastern. ${link('https://news.northeastern.edu/2020/12/07/biodegradable-food-containers-and-utensils-made-from-sugar-pulp-could-be-a-game-changer-to-battle-plastic-pollution/')}` },
  { id: 'ritchie2021', cite: 'Ritchie, 2021',
    html: `Ritchie, H. (2021). <i>Where does the plastic in our oceans come from?</i> Our World in Data. ${link('https://ourworldindata.org/ocean-plastics')}` },
  { id: 'undesa', cite: 'United Nations Department of Economic and Social Affairs, n.d.', // TODO: confirm the URL loads
    html: `United Nations Department of Economic and Social Affairs. (n.d.). <i>Goal 12: Ensure sustainable consumption and production patterns</i>. ${link('https://sdgs.un.org/goals/goal12')}` },
  { id: 'wb2021', cite: 'World Bank Group, 2021',
    html: `World Bank Group. (2021). <i>Market study for the Philippines: Plastics circularity opportunities and barriers</i>. World Bank. ${link('https://doi.org/10.1596/35295')}` },
];

// Philippine laws: one consistent form. TODO: ask the teacher which format they want, and add official URLs (Official Gazette or LawPhil).
export const LAWS = [
  { id: 'ra11898', cite: 'Extended Producer Responsibility Act of 2022', html: 'Extended Producer Responsibility Act of 2022, Rep. Act No. 11898 (2022) (Phil.).' },
  { id: 'ra9003',  cite: 'Ecological Solid Waste Management Act of 2000', html: 'Ecological Solid Waste Management Act of 2000, Rep. Act No. 9003 (2001) (Phil.).' },
  { id: 'ra10173', cite: 'Data Privacy Act of 2012', html: 'Data Privacy Act of 2012, Rep. Act No. 10173 (2012) (Phil.).' },
];

export const refEntries = () =>
  [...REFS, ...LAWS].sort((a, b) => a.cite.localeCompare(b.cite));
