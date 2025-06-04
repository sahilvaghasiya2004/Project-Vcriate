// Simple SHA-256 hash function
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simple authentication verification
async function verifyAuth(request, env) {
    // 1. Get auth headers
    const timestamp = request.headers.get('X-Timestamp');
    const hash = request.headers.get('X-Auth');
    
    if (!timestamp || !hash) {
        return false;
    }
    
    // 2. Check timestamp freshness (15 seconds)
    const currentTime = Date.now();
    const requestTime = parseInt(timestamp);
    const timeDiff = currentTime - requestTime;
    
    if (timeDiff > 300000 || timeDiff < -300000) {
        return false;
    }
    
    // 3. Verify hash
    console.log("here" , env.SECRETKEY, env.LINK);
    const expectedHash = await sha256(timestamp + env.SECRETKEY);
    return hash === expectedHash;
}

// Simple CORS handler
function handleCORS(response) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Timestamp, X-Auth');
    return response;
}

// Create error response
function createErrorResponse(message, status = 403) {
    return new Response(
        JSON.stringify({ 
            error: message,
            timestamp: new Date().toISOString()
        }), 
        {
            status,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}

// Main worker
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        // Handle preflight requests
        if (request.method === 'OPTIONS') {
            const response = new Response(null, { status: 200 });
            return handleCORS(response);
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
            return handleCORS(response);
        }
        
        // Handle /api/run endpoint (auth required)
        if (url.pathname === '/api/run' && request.method === 'POST') {
            
            // Verify authentication
            const isValid = await verifyAuth(request, env);
            if (!isValid) {
                const response = createErrorResponse('Unauthorized', 403);
                return handleCORS(response);
            }
            
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
                
                return handleCORS(workerResponse);
                
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
                
                return handleCORS(workerResponse);
            }
        }
        
        // Handle 404
        const response = createErrorResponse('Not Found', 404);
        return handleCORS(response);
    },
};