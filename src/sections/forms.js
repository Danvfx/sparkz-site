// Order widget, ask-a-question widget, feedback form, socials.
import gsap from 'gsap';
import { app, labelFor } from '../app.js';
import { CONFIG } from '../config.js';
import { BASES, TOPS } from '../data/menu.js';
import { postGoogleForm, isConfigured } from '../utils/forms.js';

const val = (f, n) => (f.elements[n]?.value ?? '').trim();
const setErr = (f, n, msg) => { const e = f.querySelector(`[data-err="${n}"]`); if (e) e.textContent = msg || ''; };

export function initOrder() {
  const f = document.getElementById('order-form'), cfg = CONFIG.ORDER_FORM;
  const sel = document.getElementById('o-drink');
  sel.innerHTML = BASES.flatMap((b) => TOPS.map((t) => `<option value="${b.id}|${t.id}">${labelFor(b.id, t.id)}</option>`)).join('');
  const syncDrink = () => { sel.value = `${app.drink.base}|${app.drink.top}`; };
  syncDrink(); document.addEventListener('sparkz:drink', syncDrink);

  setContactField(f, cfg);

  const loc = document.getElementById('o-loc-wrap'), slot = document.getElementById('o-slot-wrap');
  const opt = (name, list, ph) => list.length
    ? `<select name="${name}"><option value="">${ph}</option>${list.map((x) => `<option>${x.label ?? x}</option>`).join('')}</select>`
    : `<input name="${name}" type="text" placeholder="${ph}">`;
  loc.innerHTML = opt('location', CONFIG.DELIVERY_LOCATIONS, 'Classroom, building, or common area'); // TODO: fill DELIVERY_LOCATIONS
  slot.innerHTML = opt('slot', CONFIG.BREAK_SLOTS, 'For example: lunch');

  const refresh = () => { f.querySelector('[data-delivery]').hidden = f.elements.channel.value !== 'Delivery'; };
  f.addEventListener('change', refresh); refresh();

  const status = document.getElementById('order-status'), btn = document.getElementById('order-submit');
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); let ok = true;
    setErr(f, 'name', ''); setErr(f, 'contact', ''); setErr(f, 'location', ''); setErr(f, 'consent', '');
    if (!val(f, 'name')) { setErr(f, 'name', 'Please add your name.'); ok = false; }
    if (!val(f, 'contact')) { setErr(f, 'contact', 'Please tell us how to reach you.'); ok = false; }
    if (f.elements.channel.value === 'Delivery' && !val(f, 'location')) { setErr(f, 'location', 'Where should we bring it?'); ok = false; }
    if (!f.elements.consent.checked) { setErr(f, 'consent', 'Please tick the box so we can use this to reply.'); ok = false; }
    if (!ok) { f.querySelector('.err:not(:empty)')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); status.textContent = 'Please fix the highlighted fields.'; return; }
    if (val(f, 'website')) { status.textContent = 'Order sent.'; return; } // honeypot: pretend success

    const [bs, ts] = sel.value.split('|');
    const data = {
      mode: 'Order', name: val(f, 'name'), contact: val(f, 'contact'), notes: val(f, 'notes'),
      drink: labelFor(bs, ts), quantity: val(f, 'quantity'), channel: f.elements.channel.value,
      location: val(f, 'location'), slot: val(f, 'slot'), gcash: val(f, 'gcash'),
    };
    const summary = [`Order from ${data.name} (${data.contact})`, `Drink: ${data.drink} x ${data.quantity}`, `${data.channel}${data.location ? `: ${data.location}` : ''}`, data.slot && `Break: ${data.slot}`, data.gcash && `GCash ref: ${data.gcash}`, data.notes && `Notes: ${data.notes}`].filter(Boolean).join('\n');
    const showFallback = () => showFormFallback('order', cfg, summary);
    if (!isConfigured(cfg)) { // TODO: connect the Google Form (ORDER_FORM in config.js)
      status.textContent = 'The order form is not connected yet. Copy the summary below and send it to us.'; showFallback(); return;
    }
    btn.disabled = true; const label = btn.textContent; btn.textContent = 'Sending'; status.textContent = '';
    try {
      await postGoogleForm(cfg.ACTION, cfg.ENTRY, data);
      btn.textContent = 'Order sent.'; status.textContent = 'Thank you. We have it.';
      f.reset(); refresh(); syncDrink();
      setTimeout(() => { btn.disabled = false; btn.textContent = label; }, 4000);
    } catch {
      btn.disabled = false; btn.textContent = label; status.textContent = 'That did not go through. Use the summary below.'; showFallback();
    }
  });

  // socials (only those that are set)
  document.getElementById('socials').innerHTML = Object.entries(CONFIG.SOCIALS).filter(([, u]) => u)
    .map(([k, u]) => `<li><a href="${u}" target="_blank" rel="noopener noreferrer">${k[0].toUpperCase() + k.slice(1)}</a></li>`).join('');
}

// Ask a question: its own widget, sent to the same Google Form as an "Inquiry" row.
export function initAsk() {
  const f = document.getElementById('ask-form'), cfg = CONFIG.ORDER_FORM;
  setContactField(f, cfg);
  const status = document.getElementById('ask-status'), btn = document.getElementById('ask-submit');
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); let ok = true;
    setErr(f, 'name', ''); setErr(f, 'contact', ''); setErr(f, 'notes', ''); setErr(f, 'consent', '');
    if (!val(f, 'name')) { setErr(f, 'name', 'Please add your name.'); ok = false; }
    if (!val(f, 'contact')) { setErr(f, 'contact', 'Please tell us how to reach you.'); ok = false; }
    if (!val(f, 'notes')) { setErr(f, 'notes', 'What would you like to ask?'); ok = false; }
    if (!f.elements.consent.checked) { setErr(f, 'consent', 'Please tick the box so we can use this to reply.'); ok = false; }
    if (!ok) { f.querySelector('.err:not(:empty)')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); status.textContent = 'Please fix the highlighted fields.'; return; }
    if (val(f, 'website')) { status.textContent = 'Question sent.'; return; } // honeypot: pretend success

    const data = { mode: 'Inquiry', name: val(f, 'name'), contact: val(f, 'contact'), notes: val(f, 'notes') };
    const summary = [`Question from ${data.name} (${data.contact})`, data.notes].join('\n');
    const showFallback = () => showFormFallback('ask', cfg, summary);
    if (!isConfigured(cfg)) {
      status.textContent = 'The form is not connected yet. Copy the message below and send it to us.'; showFallback(); return;
    }
    btn.disabled = true; const label = btn.textContent; btn.textContent = 'Sending'; status.textContent = '';
    try {
      await postGoogleForm(cfg.ACTION, cfg.ENTRY, data);
      btn.textContent = 'Question sent.'; status.textContent = 'Thank you. We will get back to you.';
      f.reset();
      setTimeout(() => { btn.disabled = false; btn.textContent = label; }, 4000);
    } catch {
      btn.disabled = false; btn.textContent = label; status.textContent = 'That did not go through. Use the message below.'; showFallback();
    }
  });
}

function setContactField(f, cfg) {
  f.querySelector('[data-contact-label]').textContent = cfg.CONTACT_KIND === 'email' ? 'How to reach you (school email)' : 'How to reach you (Instagram handle)';
  f.elements.contact.type = cfg.CONTACT_KIND === 'email' ? 'email' : 'text';
}

function showFormFallback(prefix, cfg, summary) {
  document.getElementById(`${prefix}-fallback`).hidden = false; document.getElementById(`${prefix}-summary`).value = summary;
  const v = document.getElementById(`${prefix}-viewform`); if (cfg.VIEW_URL) { v.href = cfg.VIEW_URL; v.hidden = false; }
}

export function initFeedback() {
  const f = document.getElementById('fb-form'), cfg = CONFIG.FEEDBACK_FORM, row = document.getElementById('rate-row');
  row.innerHTML = [1, 2, 3, 4, 5].map((n) => `<label class="rate-opt"><input type="radio" name="rating" value="${n}"><span>${n}<i class="vh"> out of 5</i></span></label>`).join('');
  row.addEventListener('change', () => { const v = +f.elements.rating.value; row.querySelectorAll('.rate-opt').forEach((o, i) => o.classList.toggle('lit', i < v)); });
  const status = document.getElementById('fb-status'), btn = document.getElementById('fb-submit');
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); setErr(f, 'rating', ''); setErr(f, 'consent', ''); let ok = true;
    if (!f.elements.rating.value) { setErr(f, 'rating', 'Pick a number from 1 to 5.'); ok = false; }
    if (!f.elements.consent.checked) { setErr(f, 'consent', 'Please tick the box so we can read your feedback.'); ok = false; }
    if (!ok) { status.textContent = 'Please fix the highlighted fields.'; return; }
    if (val(f, 'website')) { status.textContent = 'Feedback sent.'; return; }
    const data = { rating: f.elements.rating.value, nextFlavor: f.elements.nextFlavor.value || '', comment: val(f, 'comment'), name: val(f, 'name') };
    const fallback = () => { const a = document.getElementById('fb-viewform'); document.getElementById('fb-fallback').hidden = false; if (cfg.VIEW_URL) a.href = cfg.VIEW_URL; else a.hidden = true; };
    if (!isConfigured(cfg)) { status.textContent = 'The feedback form is not connected yet. Please try again soon.'; fallback(); return; } // TODO: connect FEEDBACK_FORM
    btn.disabled = true; const label = btn.textContent; btn.textContent = 'Sending';
    try {
      await postGoogleForm(cfg.ACTION, cfg.ENTRY, data);
      btn.textContent = 'Feedback sent.'; status.textContent = 'Thank you. It helps.'; f.reset(); row.querySelectorAll('.lit').forEach((o) => o.classList.remove('lit'));
      fizz(document.getElementById('fb-thanks'));
      setTimeout(() => { btn.disabled = false; btn.textContent = label; }, 4000);
    } catch { btn.disabled = false; btn.textContent = label; status.textContent = 'That did not go through.'; fallback(); }
  });
}

function fizz(host) {
  if (app.tier === 'C') return;
  host.hidden = false;
  for (let i = 0; i < 22; i++) {
    const b = document.createElement('i'); b.style.left = `${Math.random() * 100}%`; host.appendChild(b);
    gsap.to(b, { y: -70 - Math.random() * 40, x: (Math.random() - 0.5) * 40, opacity: 0, duration: 1.2 + Math.random(), ease: 'power1.out', delay: Math.random() * 0.4, onComplete: () => b.remove() });
  }
  setTimeout(() => { host.hidden = true; }, 2800);
}
