// All URLs, IDs, break slots, socials and feature flags live here.
export const CONFIG = {
  SITE_URL: 'https://danvfx.github.io/sparkz-site/',               // TODO: GitHub Pages URL after the first deploy (also used by "Open full site" and QR)
  PRICE: 80,
  CURRENCY: '₱',
  STALL_LOCATION: 'Br. Donato Hall, La Salle College Antipolo',
  HASHTAG: '#BringBackYourCup', // TODO: owner picks (alternatives: #EveryCupComesBack, #BreakWithoutWaste)

  // Where collected cups actually go. While this is empty the site only says "we collect empty cups at the stall".
  RECYCLING_DESTINATION: '',    // TODO: confirm (school MRF, junk shop, or a PET recycler)
  TAKEBACK_LIVE: false,         // TODO: set true once cup take-back really runs; unlocks the RA 11898 "we do it anyway" line

  // Order and inquiry form. Each ENTRY value is the Google Form "entry.<id>" name, for example 'entry.123456'.
  ORDER_FORM: {
    ACTION: 'https://docs.google.com/forms/d/e/1FAIpQLSeZm9PmXcANbbFLnn1ybq-81f_0GxsS6KmPkK8gh-emIrYP4Q/formResponse',                 // TODO: https://docs.google.com/forms/d/e/<id>/formResponse
    VIEW_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSeZm9PmXcANbbFLnn1ybq-81f_0GxsS6KmPkK8gh-emIrYP4Q/viewform',               // TODO: the "viewform" URL, used as the fallback link
    ENTRY: { mode: 'entry.277364625', name: 'entry.1609050473', contact: 'entry.642466418', drink: 'entry.483777309', quantity: 'entry.623283772', channel: 'entry.1635720725', location: 'entry.15386680', slot: 'entry.1689408011', gcash: 'entry.1271190954', notes: 'entry.1901709774' },
    CONTACT_KIND: 'instagram',  // ASSUMPTION: 'instagram' or 'email'. TODO: owner decides
  },
  FEEDBACK_FORM: {
    ACTION: '',                 // TODO: second Google Form formResponse URL
    VIEW_URL: '',
    ENTRY: { rating: '', nextFlavor: '', comment: '', name: '' },
  },
  PREORDER: { CUTOFF_MINUTES: 60 },
  BREAK_SLOTS: [],              // TODO: e.g. { label: 'Lunch', start: '11:30' } in Asia/Manila time
  DELIVERY_LOCATIONS: [],       // TODO: classrooms, buildings, common areas
  SOCIALS: { instagram: '', tiktok: '', facebook: '' }, // TODO

  // Pitch deck (Our Pitch). Provide ONE of these. TODO: owner confirms what counts as "previous performance task output".
  PITCH: { DRIVE_PREVIEW_URL: '', SLIDES: [], OPEN_URL: '' },

  // Optional live pledge count: a published Google Sheet CSV. Leave empty unless it reads reliably. Never fake a number.
  PLEDGE_COUNT_CSV: '',

  // ASSUMPTION: the school's bin labels. TODO: confirm with a photo of the real bins.
  BINS: ['Biodegradable', 'Recyclable', 'Residual'],

  FEATURES: { pourWall: false, sound: false },
};
