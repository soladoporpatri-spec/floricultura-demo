// ASVS 1.2.1: encode user content at the HTML rendering boundary.
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = {
 arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
 bag:'<path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 menu:'<path d="M3 7h18M3 17h18"/>',
 close:'<path d="m5 5 14 14M5 19 19 5"/>',
 minus:'<path d="M5 12h14"/>',plus:'<path d="M5 12h14M12 5v14"/>',
 flower:'<path d="M12 12C2-1-5 12 12 12ZM12 12C25 2 12-5 12 12ZM12 12C22 25 29 12 12 12ZM12 12C-1 22 12 29 12 12Z"/><circle cx="12" cy="12" r="2.5"/>',
 leaf:'<path d="M20 3C4 1 1 11 7 17c7 7 15-2 13-14ZM5 21 17 7"/>',
 gift:'<path d="M3 9h18v4H3zM5 13v8h14v-8M12 9v12"/><path d="M12 9C1 9 5 0 10 5l2 4ZM12 9c11 0 7-9 2-4l-2 4Z"/>',
 heart:'<path d="M20.5 4.5c-3-3-7-1-8.5 1-1.5-2-5.5-4-8.5-1s-1 7 1 9L12 21l7.5-7.5c2-2 4-6 1-9Z"/>',
 check:'<path d="m4 12 5 5L20 6"/>',
 chevron:'<path d="m6 9 6 6 6-6"/>',
 truck:'<path d="M2 5h12v12H2zM14 9h4l4 5v3h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>'
};
export const icon = (name, cls='') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.flower}</svg>`;
