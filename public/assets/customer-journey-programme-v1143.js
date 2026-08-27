(()=>{'use strict';
if(window.__APG_CUSTOMER_JOURNEY_V1143__)return;
window.__APG_CUSTOMER_JOURNEY_V1143__='114.3';
// app.js is the canonical owner of product-card Compare/Save state. v112 respects this
// marker, so set it before v112 initialises and prevent duplicate element-level handlers.
document.querySelectorAll('[data-compare-product],[data-save-product]').forEach(control=>{
  if(!control.dataset.apg112Bound)control.dataset.apg112Bound='canonical-app';
});
})();
