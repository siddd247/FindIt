import { UI } from './public-content.mjs';
const h = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const states = {
  pending: ['Pending approval', 'low_stock', 'clock', 'Your listing is under administrator review. You can edit shop details and inventory while it remains hidden from public discovery.'],
  active: ['Approved', 'in_stock', 'check', 'Your shop is publicly listed. Product visibility also depends on catalogue approval and stock filters.'],
  rejected: ['Rejected', 'out_of_stock', 'x', 'Your listing is hidden. Correct your shop details, then request another review. You can continue preparing inventory.'],
  on_hold: ['On hold', 'low_stock', 'clock', 'Your shop is hidden and editing is paused. Contact the administrator for a review.'],
  deactivated: ['Deactivated', 'unavailable', 'minus', 'Your shop is hidden and editing is paused. Contact the administrator to reactivate it.'],
};
export const shopCanEdit = shop => ['pending', 'active', 'rejected'].includes(shop?.status);
export const shopStatusLabel = status => states[status]?.[0] || status;
export const shopStatusBadge = status => { const s = states[status] || [status, 'stale', 'info']; return UI.badge(s[0], s[1], s[2]); };
export function shopApprovalNotice(shop) {
  const state = states[shop.status] || ['Unavailable', 'unavailable', 'info', 'Contact the administrator about this listing.'];
  const reason = shop.rejection_reason || shop.review_reason;
  return '<section class="panel shop-approval" aria-label="Shop approval status">' + shopStatusBadge(shop.status) + '<p>' + h(state[3]) + '</p>' + (reason ? '<p><strong>Administrator feedback:</strong> ' + h(reason) + '</p>' : '') + '</section>';
}
