// Worker to serve large HTML file without corruption
export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === '/hyperfiler-pro' || url.pathname === '/hyperfiler-pro.html') {
      // Read the HTML file from your storage/bucket
      const htmlContent = await fetch('https://raw.githubusercontent.com/juanmanuelferrera/hyperfiler/master/hyperfiler-pro.html');
      
      if (!htmlContent.ok) {
        return new Response('File not found', { status: 404 });
      }
      
      return new Response(await htmlContent.text(), {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }
    
    // Fallback to regular Pages serving
    return fetch(request);
  },
};