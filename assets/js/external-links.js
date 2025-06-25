/*  external-links.js
 *  Adds target="_blank" and rel="noopener noreferrer"
 *  to every <a> whose host differs from the current site.
 */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href]').forEach(link => {
    try {
      // Resolve relative URLs against the document’s <baseURI>
      const url = new URL(link.getAttribute('href'), document.baseURI);

      // Ignore anchors, mailto:, tel:, and same-host links (incl. sub-paths)
      const localHost = window.location.hostname.replace(/^www\./, '');
      const linkHost  = url.hostname.replace(/^www\./, '');

      if (url.protocol.startsWith('http') && linkHost !== localHost) {
        link.target = '_blank';
        link.rel    = 'noopener noreferrer';   // prevents reverse-tabnabbing
      }
    } catch { /* silently ignore malformed hrefs */ }
  });
});