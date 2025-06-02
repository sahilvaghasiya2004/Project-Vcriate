/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// Cloudflare Worker version of your proxy server

const allowedOrigins = [
    'https://validcode.vercel.app',
    // 'http://localhost:5173'
];

function handleCORS(request, response) {
    const origin = request.headers.get('Origin');
    
    if (allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        // Handle preflight requests
        if (request.method === 'OPTIONS') {
            const response = new Response(null, { status: 200 });
            return handleCORS(request, response);
        }
        
        // Handle root path
        if (url.pathname === '/') {
            const response = new Response(
                JSON.stringify({ message: "API is running!" }), 
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            return handleCORS(request, response);
        }
        
        // Handle /api/run endpoint
        if (url.pathname === '/api/run' && request.method === 'POST') {
            try {
                const body = await request.json();
                
                const response = await fetch(env.LINK, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
                
                const data = await response.json();
                
                const workerResponse = new Response(
                    JSON.stringify(data), 
                    {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
                
                return handleCORS(request, workerResponse);
                
            } catch (err) {
                const workerResponse = new Response(
                    JSON.stringify({ 
                        error: "Failed to execute code", 
                        details: err.message 
                    }), 
                    {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
                
                return handleCORS(request, workerResponse);
            }
        }
        
        // Handle 404
        const response = new Response('Not Found', { status: 404 });
        return handleCORS(request, response);
    },
};