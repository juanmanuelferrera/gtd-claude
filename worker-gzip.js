// Worker to serve gzipped HTML content
export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // Serve the HTML with gzip encoding
    if (url.pathname === '/hyperfiler-pro' || url.pathname === '/hyperfiler-pro.html') {
      // Fetch the gzipped file from Pages
      const response = await fetch('https://hyperfiler.pages.dev/hyperfiler-pro.html.gz');
      const gzippedContent = await response.arrayBuffer();
      
      return new Response(gzippedContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Encoding': 'gzip',
        },
      });
    }
    
    // Default: pass through to Pages
    return fetch(request);
  },
};