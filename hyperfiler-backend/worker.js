import Stripe from 'stripe';

// SECURITY: Input sanitization functions
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Remove dangerous characters and scripts
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:text\/html/gi, '')
    // Allow data:image/* URLs but validate the format
    .replace(/data:(?!image\/)/gi, 'data-removed:');
  
  // Check if notes contain images and adjust limit accordingly
  const hasImages = /\[IMG:\d+:data:image\//.test(sanitized);
  const maxLength = hasImages ? 2000000 : 50000; // 2MB for image notes, 50KB for text-only
  
  return sanitized.substring(0, maxLength).trim();
}

function validateAndSanitizeTask(task) {
  if (!task || typeof task !== 'object') {
    console.error('Invalid task object:', task);
    return null;
  }
  
  // Generate ID if missing
  const taskId = task.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Ensure title exists
  const title = sanitizeInput(task.title || 'Untitled Task');
  if (!title.trim()) {
    console.error('Task rejected: empty title after sanitization', task);
    return null;
  }
  
  return {
    id: String(taskId).substring(0, 50),
    title: title,
    notes: sanitizeInput(task.notes || ''),
    images: task.images || [],
    due_date: task.dueDate !== undefined ? task.dueDate : (task.due_date !== undefined ? task.due_date : null),
    due_time: task.dueTime !== undefined ? task.dueTime : (task.due_time !== undefined ? task.due_time : null),
    status: ['pending', 'completed'].includes(task.status) ? task.status : 'pending',
    repeat_type: sanitizeInput(task.repeatType || task.repeat_type || ''),
    template: sanitizeInput(task.template || ''),
    is_event: Boolean(task.isEvent || task.is_event),
    created_at: task.createdAt || task.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_deleted: Boolean(task.isDeleted || task.is_deleted || false),
    deleted_at: task.deletedAt || task.deleted_at || null
  };
}

// SECURITY: Rate limiting functions
const rateLimitMap = new Map();

function getRateLimitKey(request) {
  // Use IP address + User-Agent for rate limiting
  const clientIP = request.headers.get('CF-Connecting-IP') || 
                   request.headers.get('X-Forwarded-For') || 
                   'unknown';
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  return `${clientIP}:${userAgent.substring(0, 50)}`;
}

function checkRateLimit(key, maxRequests = 100, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, []);
  }
  
  const requests = rateLimitMap.get(key);
  
  // Remove old requests outside the window
  const recentRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (recentRequests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  // Add current request
  recentRequests.push(now);
  rateLimitMap.set(key, recentRequests);
  
  // Clean up old entries periodically
  if (rateLimitMap.size > 10000) {
    const keysToDelete = [];
    for (const [mapKey, timestamps] of rateLimitMap.entries()) {
      if (timestamps.length === 0 || timestamps[timestamps.length - 1] < windowStart) {
        keysToDelete.push(mapKey);
      }
    }
    keysToDelete.forEach(key => rateLimitMap.delete(key));
  }
  
  return true;
}

// SECURITY: Database access control functions
function validateUserId(userId) {
  if (!userId || typeof userId !== 'string') {
    return false;
  }
  
  // Validate UUID format (basic check)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(userId);
}

function createSecureQuery(baseQuery, userId, additionalParams = []) {
  // Ensure all user data queries include user_id filter
  if (!validateUserId(userId)) {
    throw new Error('Invalid user ID format');
  }
  
  // Check if query already has WHERE clause
  const hasWhere = /\bWHERE\b/i.test(baseQuery);
  
  let secureQuery;
  if (hasWhere) {
    // Add user_id to existing WHERE clause
    secureQuery = baseQuery.replace(/\bWHERE\b/i, 'WHERE user_id = ? AND ');
  } else {
    // Add WHERE clause with user_id
    secureQuery = baseQuery + ' WHERE user_id = ?';
  }
  
  return {
    query: secureQuery,
    params: [userId, ...additionalParams]
  };
}

async function executeSecureQuery(env, baseQuery, userId, additionalParams = []) {
  try {
    const { query, params } = createSecureQuery(baseQuery, userId, additionalParams);
    const stmt = env.DB.prepare(query);
    return await stmt.bind(...params).all();
  } catch (error) {
    console.error('Secure query execution failed:', error);
    throw new Error('Database query failed');
  }
}

export default {
  async fetch(request, env, ctx) {
    console.log("Worker environment bindings:", Object.keys(env || {}));
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    // CORS headers - Allow credentials for admin panel
    const requestOrigin = request.headers.get('Origin');
    const allowedOrigins = [
      'https://hyperfiler.pro',
      'https://www.hyperfiler.pro',
      'https://hyperfiler.pages.dev',
      'https://79380aff.hyperfiler.pages.dev',
      'https://c55ad0dd.hyperfiler.pages.dev',
      'https://f1febe64.hyperfiler.pages.dev',
      'https://d5c76ea9.hyperfiler.pages.dev',
      'https://f7547841.hyperfiler.pages.dev',
      'https://e232b938.hyperfiler.pages.dev',
      'https://60270a80.hyperfiler.pages.dev',
      'https://d40f4727.hyperfiler.pages.dev',
      'https://a1691752.hyperfiler.pages.dev',
      'https://df586f15.hyperfiler.pages.dev',
      'https://349dea9d.hyperfiler.pages.dev',
      'https://68a571da.hyperfiler.pages.dev',
      'https://6f132a9b.hyperfiler.pages.dev',
      'https://993982f1.hyperfiler.pages.dev',
      'https://164db7fe.hyperfiler.pages.dev',
      'https://9379631c.hyperfiler.pages.dev',
      'https://0be8f471.hyperfiler.pages.dev',
      'https://c15bd346.hyperfiler.pages.dev',
      'https://785ec48a.hyperfiler.pages.dev',
      'https://4bc5b548.hyperfiler.pages.dev',
      'https://64e829ff.hyperfiler.pages.dev',
      'https://a74d87ca.hyperfiler.pages.dev',
      'https://d39dbdd4.hyperfiler.pages.dev',
      'https://f5717eff.hyperfiler.pages.dev',
      'https://325fe020.hyperfiler.pages.dev',
      'https://b82d7da3.hyperfiler.pages.dev',
      'https://hyperfiler-api.joanmanelferrera-400.workers.dev',
      'https://hyperfiler.joanmanelferrera.workers.dev',
      'https://hyperfiler.joanmanelferrera.com',
      'https://gtd.joanmanelferrera.com',
      'http://localhost:3000',
      'http://localhost:8080'
    ];
    
    // Support wildcard matching for Cloudflare Pages URLs
    const isAllowedOrigin = allowedOrigins.includes(requestOrigin) || 
                           (requestOrigin && requestOrigin.match(/^https:\/\/[a-f0-9]{8}\.hyperfiler\.pages\.dev$/));
    
    console.log('🌐 CORS DEBUG: Request origin:', requestOrigin, 'Allowed:', isAllowedOrigin);
    console.log('🌐 CORS DEBUG: Full allowedOrigins list:', allowedOrigins);
    
    // CORS headers - properly configured for authentication
    const corsHeaders = {
      'Access-Control-Allow-Origin': isAllowedOrigin ? requestOrigin : 'https://hyperfiler.pro',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie, X-Requested-With',
      'Access-Control-Max-Age': '86400',
      // SECURITY HEADERS
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      console.log('🌐 OPTIONS request for:', pathname);
      console.log('🌐 CORS headers being sent:', JSON.stringify(corsHeaders, null, 2));
      return new Response(null, { 
        status: 200,
        headers: corsHeaders 
      });
    }

    // SECURITY: Rate limiting check
    const rateLimitKey = getRateLimitKey(request);
    
    // Different limits for different endpoints
    let maxRequests = 100; // Default: 100 requests per minute
    let windowMs = 60000;   // 1 minute
    
    if (pathname.startsWith('/auth/')) {
      maxRequests = 200; // Higher limit for development: 200 per minute
    } else if (pathname.includes('/sync') || pathname.includes('/tasks/') || pathname.includes('/lists/') || pathname.includes('/templates/')) {
      maxRequests = 500; // Much higher for data endpoints: 500 per minute
    }
    
    if (!checkRateLimit(rateLimitKey, maxRequests, windowMs)) {
      const isAuthEndpoint = pathname.startsWith('/auth/');
      const friendlyMessage = isAuthEndpoint 
        ? 'Too many login attempts. Please wait 1 minute before trying again.'
        : 'Too many requests. Please wait a moment and try again.';
      
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded',
        message: friendlyMessage,
        retryAfter: 60
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': '60'
        }
      });
    }

    try {
      // Health check endpoint
      if (pathname === '/health') {
        return new Response(JSON.stringify({ 
          status: 'OK', 
          message: 'HyperFiler Backend is running!' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Database status check endpoint
      if (pathname === '/db-status' && request.method === 'GET') {
        try {
          console.log('🔍 Checking database status...');
          
          // Check if users table exists
          const usersCheck = env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
          const usersResult = await usersCheck.all();
          console.log('🔍 Users table exists:', usersResult.results.length > 0);
          
          // Check if user_tasks table exists
          const tasksCheck = env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_tasks'");
          const tasksResult = await tasksCheck.all();
          console.log('🔍 User_tasks table exists:', tasksResult.results.length > 0);
          
          // Check user_tasks table structure
          let tasksStructure = null;
          if (tasksResult.results.length > 0) {
            const structureCheck = env.DB.prepare("PRAGMA table_info(user_tasks)");
            const structureResult = await structureCheck.all();
            tasksStructure = structureResult.results.map(col => col.name);
            console.log('🔍 User_tasks columns:', tasksStructure);
          }
          
          // Check if user_subscriptions table exists
          const subsCheck = env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_subscriptions'");
          const subsResult = await subsCheck.all();
          console.log('🔍 User_subscriptions table exists:', subsResult.results.length > 0);
          
          // Check Triple Protection tables
          const backupsCheck = env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_backups'");
          const backupsResult = await backupsCheck.all();
          console.log('🔍 User_backups table exists:', backupsResult.results.length > 0);
          
          const versionsCheck = env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='task_versions'");
          const versionsResult = await versionsCheck.all();
          console.log('🔍 Task_versions table exists:', versionsResult.results.length > 0);
          
          const conflictsCheck = env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sync_conflicts'");
          const conflictsResult = await conflictsCheck.all();
          console.log('🔍 Sync_conflicts table exists:', conflictsResult.results.length > 0);
          
          // Count records in protection tables
          let backupCount = 0;
          let versionCount = 0;
          let conflictCount = 0;
          
          if (backupsResult.results.length > 0) {
            const backupCountStmt = env.DB.prepare("SELECT COUNT(*) as count FROM user_backups");
            const backupCountResult = await backupCountStmt.first();
            backupCount = backupCountResult.count;
          }
          
          if (versionsResult.results.length > 0) {
            const versionCountStmt = env.DB.prepare("SELECT COUNT(*) as count FROM task_versions");
            const versionCountResult = await versionCountStmt.first();
            versionCount = versionCountResult.count;
          }
          
          if (conflictsResult.results.length > 0) {
            const conflictCountStmt = env.DB.prepare("SELECT COUNT(*) as count FROM sync_conflicts");
            const conflictCountResult = await conflictCountStmt.first();
            conflictCount = conflictCountResult.count;
          }
          
          return new Response(JSON.stringify({ 
            status: 'OK',
            database: {
              users_table: usersResult.results.length > 0,
              user_tasks_table: tasksResult.results.length > 0,
              user_subscriptions_table: subsResult.results.length > 0,
              user_tasks_columns: tasksStructure,
              triple_protection: {
                user_backups_table: backupsResult.results.length > 0,
                task_versions_table: versionsResult.results.length > 0,
                sync_conflicts_table: conflictsResult.results.length > 0,
                backup_count: backupCount,
                version_count: versionCount,
                conflict_count: conflictCount
              }
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('❌ Database status check error:', error);
          return new Response(JSON.stringify({ 
            status: 'ERROR',
            error: error.message 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Authentication endpoints
      if (pathname === '/auth/register' && request.method === 'POST') {
        return handleAuthRegister(request, env, corsHeaders);
      }

      if (pathname === '/auth/login' && request.method === 'POST') {
        return handleAuthLogin(request, env, corsHeaders);
      }

      if (pathname === '/auth/me' && request.method === 'GET') {
        return handleAuthMe(request, env, corsHeaders);
      }

      if (pathname === '/auth/logout' && request.method === 'POST') {
        return handleAuthLogout(request, env, corsHeaders);
      }

      if (pathname === '/auth/forgot-password' && request.method === 'POST') {
        return handleForgotPassword(request, env, corsHeaders);
      }

      if (pathname === '/auth/trial-status' && request.method === 'GET') {
        return handleTrialStatus(request, env, corsHeaders);
      }

      if (pathname === '/admin/update-database' && request.method === 'POST') {
        return requireAdminAuth(request, env, handleUpdateDatabase, corsHeaders);
      }

      // Simple sync endpoint - primary tasks synchronization
      // This endpoint handles all task synchronization operations
      


      // Simple tasks sync endpoint - Lists pattern
      
      // Test endpoint for debugging
      if (pathname === '/test' && request.method === 'POST') {
        try {
          const body = await request.json();
          console.log('🔍 TEST: Request body keys:', Object.keys(body));
          
          // Test email sending
          if (body.email && body.test === 'email') {
            console.log('🔍 Testing email send to:', body.email);
            const testPassword = 'test123456';
            const emailResult = await sendWelcomeEmail(body.email, testPassword, 'test_customer', env);
            console.log('🔍 Email test result:', emailResult);
            return new Response(JSON.stringify({ 
              status: 'email test', 
              email: body.email,
              result: emailResult 
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          // Test checkout completed simulation
          if (body.test === 'checkout') {
            console.log('🔍 Testing checkout completed simulation');
            const mockSession = {
              mode: 'payment',
              customer_details: {
                email: body.email || 'jaganat@mail.com'
              },
              customer: 'cus_test_123'
            };
            console.log('🔍 Calling handleCheckoutCompleted with:', mockSession);
            try {
              await handleCheckoutCompleted(mockSession, env);
              console.log('🔍 handleCheckoutCompleted finished successfully');
            } catch (error) {
              console.error('🔍 handleCheckoutCompleted ERROR:', error);
              return new Response(JSON.stringify({ 
                status: 'checkout test failed',
                error: error.message,
                email: mockSession.customer_details.email
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }
            return new Response(JSON.stringify({ 
              status: 'checkout test completed',
              email: mockSession.customer_details.email
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          console.log('🔍 TEST: Tasks length:', body.tasks?.length);
          return new Response(JSON.stringify({ status: 'test ok', received: Object.keys(body) }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('🔍 TEST ERROR:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Delta sync endpoints for bandwidth optimization  
      if (pathname.startsWith('/tasks/') && pathname.includes('/changes') && request.method === 'GET') {
        const userId = pathname.split('/')[2];
        return handleGetTaskChanges(userId, request, env, corsHeaders);
      }
      if (pathname === '/tasks/delta' && request.method === 'POST') {
        return handleTasksDeltaSync(request, env, corsHeaders);
      }
      
      if (pathname.startsWith('/tasks/') && request.method === 'GET') {
        const userId = pathname.split('/')[2];
        return handleGetTasks(userId, request, env, corsHeaders);
      }

      if (pathname.startsWith('/tasks/') && request.method === 'DELETE') {
        const taskId = pathname.split('/')[2];
        return handleDeleteTask(taskId, request, env, corsHeaders);
      }

      // Tasks sync endpoint - Same ultra-simple pattern as lists
      if (pathname === '/tasks/sync' && request.method === 'POST') {
        return handleTasksSyncSimple(request, env, corsHeaders);
      }
      // Lists endpoints - Same ultra-simple pattern as tasks
      if (pathname === '/lists/sync' && request.method === 'POST') {
        return handleListsSyncSimple(request, env, corsHeaders);
      }

      if (pathname.startsWith('/lists/') && request.method === 'GET') {
        const userId = pathname.split('/')[2];
        return handleGetLists(userId, request, env, corsHeaders);
      }

      // Templates endpoints - Same ultra-simple pattern as tasks and lists
      if (pathname === '/templates/sync' && request.method === 'POST') {
        return handleTemplatesSyncSimple(request, env, corsHeaders);
      }

      if (pathname.startsWith('/templates/') && request.method === 'GET') {
        const userId = pathname.split('/')[2];
        return handleGetTemplates(userId, request, env, corsHeaders);
      }

      // Admin authentication and panel
      if (pathname === '/secure-admin' && request.method === 'GET') {
        return handleSecureAdminPanel(request, env, corsHeaders);
      }

      if (pathname === '/admin/login' && request.method === 'POST') {
        return handleAdminLogin(request, env, corsHeaders);
      }

      if (pathname === '/admin/logout' && request.method === 'POST') {
        return handleAdminLogout(request, env, corsHeaders);
      }

      if (pathname === '/admin/debug-session' && request.method === 'GET') {
        return handleDebugSession(request, env, corsHeaders);
      }

      if (pathname === '/admin/fix-session' && request.method === 'POST') {
        return handleFixSession(request, env, corsHeaders);
      }

      // Admin endpoints (all require session authentication)
      if (pathname === '/admin/users' && request.method === 'GET') {
        return await requireAdminAuth(request, env, () => handleAdminUsers(request, env, corsHeaders), corsHeaders);
      }

      if (pathname === '/admin/users' && request.method === 'POST') {
        return await requireAdminAuth(request, env, () => handleAdminCreateUser(request, env, corsHeaders), corsHeaders);
      }

      if (pathname.startsWith('/admin/users/') && request.method === 'GET') {
        const email = decodeURIComponent(pathname.split('/')[3]);
        return await requireAdminAuth(request, env, () => handleAdminUserDetails(email, request, env, corsHeaders));
      }

      if (pathname.startsWith('/admin/users/') && pathname.endsWith('/reset-password') && request.method === 'POST') {
        const email = decodeURIComponent(pathname.split('/')[3]);
        return await requireAdminAuth(request, env, () => handleAdminResetPassword(email, request, env, corsHeaders), corsHeaders);
      }

      if (pathname.startsWith('/admin/users/') && pathname.endsWith('/resend-email') && request.method === 'POST') {
        const email = decodeURIComponent(pathname.split('/')[3]);
        return await requireAdminAuth(request, env, () => handleAdminResendEmail(email, request, env, corsHeaders), corsHeaders);
      }

      if (pathname.startsWith('/admin/users/') && request.method === 'DELETE') {
        const email = decodeURIComponent(pathname.split('/')[3]);
        return await requireAdminAuth(request, env, () => handleAdminDeleteUser(email, request, env, corsHeaders), corsHeaders);
      }

      if (pathname.startsWith('/admin/users/') && pathname.endsWith('/extend') && request.method === 'POST') {
        const email = decodeURIComponent(pathname.split('/')[3]);
        return await requireAdminAuth(request, env, () => handleAdminExtendSubscription(email, request, env, corsHeaders), corsHeaders);
      }

      if (pathname.startsWith('/admin/users/') && pathname.endsWith('/cancel') && request.method === 'POST') {
        const email = decodeURIComponent(pathname.split('/')[3]);
        return await requireAdminAuth(request, env, () => handleAdminCancelSubscription(email, request, env, corsHeaders), corsHeaders);
      }

      if (pathname === '/admin/promo-codes' && request.method === 'GET') {
        return await requireAdminAuth(request, env, () => handleAdminGetPromoCodes(request, env, corsHeaders));
      }

      if (pathname === '/admin/promo-codes' && request.method === 'POST') {
        return await requireAdminAuth(request, env, () => handleAdminCreatePromoCode(request, env, corsHeaders), corsHeaders);
      }

      if (pathname.startsWith('/admin/promo-codes/') && pathname.endsWith('/toggle') && request.method === 'POST') {
        const code = decodeURIComponent(pathname.split('/')[3]);
        return await requireAdminAuth(request, env, () => handleAdminTogglePromoCode(code, request, env, corsHeaders), corsHeaders);
      }

      if (pathname.startsWith('/admin/promo-codes/') && request.method === 'DELETE') {
        const code = decodeURIComponent(pathname.split('/')[3]);
        return await requireAdminAuth(request, env, () => handleAdminDeletePromoCode(code, request, env, corsHeaders), corsHeaders);
      }

      // Admin utility endpoints
      if (pathname === '/admin/fix-passwords' && request.method === 'POST') {
        return await requireAdminAuth(request, env, () => handleAdminFixPasswords(request, env, corsHeaders), corsHeaders);
      }

      if (pathname.startsWith('/admin/users/') && pathname.endsWith('/clear-tasks') && request.method === 'POST') {
        const email = decodeURIComponent(pathname.split('/')[3]);
        return await requireAdminAuth(request, env, () => handleAdminClearTasks(email, request, env, corsHeaders), corsHeaders);
      }

      if (pathname === '/admin/analyze-database' && request.method === 'GET') {
        return await requireAdminAuth(request, env, () => handleAdminAnalyzeDatabase(request, env, corsHeaders), corsHeaders);
      }

      if (pathname === '/admin/sync-check' && request.method === 'GET') {
        return await requireAdminAuth(request, env, () => handleAdminSyncCheck(request, env, corsHeaders), corsHeaders);
      }

      if (pathname === '/admin/migrate-database' && request.method === 'POST') {
        return await requireAdminAuth(request, env, () => handleAdminMigrateDatabase(request, env, corsHeaders), corsHeaders);
      }

      if (pathname === '/admin/clear-database' && request.method === 'POST') {
        return await requireAdminAuth(request, env, () => handleAdminClearDatabase(request, env, corsHeaders), corsHeaders);
      }
      
      // Admin: Create session table (temporary endpoint)
      if (pathname === '/admin/create-session-table' && request.method === 'POST') {
        return handleAdminCreateSessionTable(request, env, corsHeaders);
      }

      if (pathname === '/admin/database-status' && request.method === 'GET') {
        return await requireAdminAuth(request, env, () => handleAdminDatabaseStatus(request, env, corsHeaders));
      }

      // Admin Stripe management endpoints
      if (pathname.startsWith('/admin/stripe/subscription/') && pathname.endsWith('/pause') && request.method === 'POST') {
        const email = decodeURIComponent(pathname.split('/')[4]);
        return handleAdminStripeSubscriptionPause(email, request, env, corsHeaders);
      }

      if (pathname.startsWith('/admin/stripe/subscription/') && pathname.endsWith('/resume') && request.method === 'POST') {
        const email = decodeURIComponent(pathname.split('/')[4]);
        return handleAdminStripeSubscriptionResume(email, request, env, corsHeaders);
      }

      if (pathname.startsWith('/admin/stripe/subscription/') && pathname.endsWith('/cancel') && request.method === 'POST') {
        const email = decodeURIComponent(pathname.split('/')[4]);
        return handleAdminStripeSubscriptionCancel(email, request, env, corsHeaders);
      }

      if (pathname.startsWith('/admin/stripe/subscription/') && request.method === 'GET') {
        const email = decodeURIComponent(pathname.split('/')[4]);
        return handleAdminStripeSubscriptionDetails(email, request, env, corsHeaders);
      }

      if (pathname.startsWith('/admin/stripe/customer-portal/') && request.method === 'GET') {
        const email = decodeURIComponent(pathname.split('/')[4]);
        return handleAdminStripeCustomerPortal(email, request, env, corsHeaders);
      }

      // Payment endpoints
      if (pathname === '/payments/create-checkout-session' && request.method === 'POST') {
        return handleCreateCheckoutSession(request, env, corsHeaders);
      }

      if (pathname === '/payments/customer-portal' && request.method === 'POST') {
        return handleCustomerPortal(request, env, corsHeaders);
      }

      // Stripe webhook endpoint
      if (pathname === '/webhook' && request.method === 'POST') {
        console.log('🔥 WEBHOOK HIT: pathname=', pathname, 'method=', request.method);
        return handleStripeWebhook(request, env, corsHeaders);
      }
      
      // Debug webhook routing
      if (pathname === '/webhook') {
        console.log('🔥 WEBHOOK PATH MATCH but wrong method:', request.method);
        return new Response(JSON.stringify({ error: 'Method not allowed', method: request.method }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Get session details for password display
      if (pathname.startsWith('/payments/session/') && request.method === 'GET') {
        const sessionId = pathname.split('/')[3];
        return handleGetSessionDetails(sessionId, env, corsHeaders);
      }

      // Promo code endpoints
      if (pathname === '/promo/redeem' && request.method === 'POST') {
        return handlePromoRedeem(request, env, corsHeaders);
      }

      // Test Stripe customer portal creation
      if (pathname === '/test/customer-portal' && request.method === 'POST') {
        return handleTestCustomerPortal(request, env, corsHeaders);
      }

      // Test new customer welcome email
      if (pathname === '/test/welcome-email' && request.method === 'POST') {
        return handleTestWelcomeEmail(request, env, corsHeaders);
      }

      // 404 for unknown routes


      console.log('🔥 404 NOT FOUND: pathname=', pathname, 'method=', request.method);
      return new Response(JSON.stringify({ error: 'Not Found', pathname: pathname, method: request.method }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },
};

// Authentication helper
function getAuthToken(request) {
  // SECURITY: Use Authorization header only (no httpOnly cookies to avoid keychain prompts)
  
  // Check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

// Verify JWT token and extract user info
async function verifyToken(token, jwtSecret) {
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode header and payload
    const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // Check expiration first (quick check)
    if (payload.exp && payload.exp < Date.now() / 1000) {
      console.log('Token expired:', payload.exp, 'vs', Date.now() / 1000);
      return null;
    }
    
    // Verify signature
    const signatureInput = `${parts[0]}.${parts[1]}`;
    const secret = jwtSecret || 'default-secret-key';
    
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const providedSignature = Uint8Array.from(
      atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')), 
      c => c.charCodeAt(0)
    );
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      providedSignature,
      new TextEncoder().encode(signatureInput)
    );
    
    if (!isValid) {
      console.log('Invalid token signature');
      return null;
    }
    
    console.log('Token verified successfully:', payload);
    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Auth: Register
async function handleAuthRegister(request, env, corsHeaders) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user already exists
    const existingUserStmt = env.DB.prepare('SELECT id FROM users WHERE email = ?');
    const existingUser = await existingUserStmt.bind(email).first();
    
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'User already exists' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-2);
    const hashedPassword = await hashPassword(tempPassword);
    const userId = crypto.randomUUID();
    
    // Create user in database
    const stmt = env.DB.prepare(`
      INSERT INTO users (id, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    await stmt.bind(userId, email, hashedPassword).run();
    
    // Create 60-day trial subscription
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 60); // 60 days trial
    
    const subscriptionId = crypto.randomUUID();
    const subStmt = env.DB.prepare(`
      INSERT INTO user_subscriptions 
      (id, user_id, user_email, plan_name, status, current_period_start, current_period_end, expiration_email_sent, created_at, updated_at)
      VALUES (?, ?, ?, 'trial', 'active', datetime('now'), ?, 0, datetime('now'), datetime('now'))
    `);
    await subStmt.bind(subscriptionId, userId, email, trialEndDate.toISOString()).run();
    
    // Generate JWT token
    const token = await generateJWT({ userId, email }, env.JWT_SECRET || 'default-secret-key');
    
    // Send welcome email with credentials
    const emailHtml = await generatePromoEmailHTML(
      email, 
      tempPassword, 
      'TRIAL', 
      60, 
      trialEndDate.toLocaleDateString(),
      null, // No stripe customer ID for trial accounts
      env
    );
    
    const emailResult = await sendEmail(
      env, 
      email, 
      `👑 Welcome to HyperFiler Pro - Professional Productivity Software`, 
      emailHtml
    );

    return new Response(JSON.stringify({ 
      message: 'User created successfully with 60-day trial',
      user: { id: userId, email },
      token,
      trialEnd: trialEndDate.toISOString(),
      password: tempPassword, // Return password for immediate use
      email_sent: emailResult.success
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({ error: 'Registration failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Auth: Login
async function handleAuthLogin(request, env, corsHeaders) {
  try {
    console.log('🔐 Login attempt received');
    const { email, password } = await request.json();
    console.log('📧 Email:', email);
    console.log('🔑 Password provided:', !!password);
    
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return new Response(JSON.stringify({ error: 'Email and password required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find user in database
    console.log('🔍 Looking up user in database...');
    console.log('Database connection:', !!env.DB);
    
    let user;
    try {
      const stmt = env.DB.prepare('SELECT id, email, password_hash FROM users WHERE email = ?');
      user = await stmt.bind(email).first();
      console.log('👤 User found:', !!user);
    } catch (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Database query failed: ${dbError.message}`);
    }
    
    if (!user) {
      console.log('❌ User not found in database');
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify password with automatic migration
    console.log('🔑 Verifying password...');
    const isValidPassword = await verifyPassword(password, user.password_hash);
    console.log('✅ Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Auto-migrate password to new format if using old format
    if (isOldFormat(user.password_hash)) {
      console.log('🔄 Migrating user password to new secure format...');
      try {
        const newHash = await hashPassword(password);
        await env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?')
          .bind(newHash, user.id).run();
        console.log('✅ Password migrated successfully for user:', user.email);
      } catch (migrationError) {
        console.error('❌ Password migration failed for user:', user.email, migrationError);
        // Continue with login even if migration fails
      }
    }
    
    // Generate JWT token
    console.log('🔐 Generating JWT token...');
    const token = await generateJWT({ userId: user.id, email: user.email }, env.JWT_SECRET || 'default-secret-key');
    console.log('✅ Token generated successfully');
    
    // SECURITY: Determine correct domain for cookie
    const requestOrigin = request.headers.get('Origin');
    let cookieDomain = '';
    
    if (requestOrigin && requestOrigin.includes('hyperfiler.pro')) {
      cookieDomain = '; Domain=.hyperfiler.pro';
    }
    
    // Get user subscription
    console.log('📋 Getting user subscription...');
    let subscription = null;
    try {
      const subStmt = env.DB.prepare('SELECT * FROM user_subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1');
      subscription = await subStmt.bind(user.id).first();
      console.log('📋 Subscription found:', !!subscription);
    } catch (subError) {
      console.warn('📋 Subscription query failed:', subError.message);
      // Continue without subscription data
    }
    
    console.log('🎉 Login successful for user:', user.email);
    return new Response(JSON.stringify({ 
      message: 'Login successful',
      user: { id: user.id, email: user.email, created_at: user.created_at },
      subscription: subscription,
      token: token
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({ 
      error: 'Login failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Auth: Get current user
async function handleAuthMe(request, env, corsHeaders) {
  try {
    console.log('🔍 Auth me request started');
    
    const token = getAuthToken(request);
    console.log('🔍 Token extracted:', !!token);
    
    const payload = await verifyToken(token, env.JWT_SECRET || 'default-secret-key');
    console.log('🔍 Token payload:', payload ? 'valid' : 'invalid');
    
    if (!payload) {
      console.log('🔍 No valid payload, returning 401');
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🔍 Looking up user in database:', payload.userId);
    
    // Get user info from database
    const userStmt = env.DB.prepare('SELECT id, email, created_at FROM users WHERE id = ?');
    const user = await userStmt.bind(payload.userId).first();
    console.log('🔍 User lookup result:', user ? 'found' : 'not found');
    
    if (!user) {
      console.log('🔍 User not found, returning 404');
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🔍 Looking up subscription for user');
    
    // Get subscription info
    const subStmt = env.DB.prepare('SELECT * FROM user_subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1');
    const subscription = await subStmt.bind(payload.userId).first();
    console.log('🔍 Subscription lookup result:', subscription ? 'found' : 'not found');
    
    // Check trial status
    let trialStatus = null;
    if (subscription) {
      const now = new Date();
      const trialEnd = new Date(subscription.current_period_end);
      const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
      
      trialStatus = {
        isActive: subscription.status === 'active',
        isTrial: subscription.plan_name === 'trial',
        isExpired: trialEnd < now,
        daysLeft: daysLeft > 0 ? daysLeft : 0,
        trialEnd: subscription.current_period_end,
        hasPaid: subscription.plan_name === 'pro' // All Pro users (Stripe customers + promo code users) are considered paid
      };
    }
    
    console.log('🔍 Auth me successful, returning user data');
    
    return new Response(JSON.stringify({ 
      user: { 
        id: user.id, 
        email: user.email,
        created_at: user.created_at
      },
      subscription: subscription || null,
      trialStatus: trialStatus
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Auth me error:', error);
    console.error('❌ Error stack:', error.stack);
    return new Response(JSON.stringify({ error: 'Authentication failed', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Auth: Logout (clear httpOnly cookie)
async function handleAuthLogout(request, env, corsHeaders) {
  try {
    // SECURITY: Determine correct domain for cookie clearing
    const requestOrigin = request.headers.get('Origin');
    let cookieDomain = '';
    
    if (requestOrigin && requestOrigin.includes('hyperfiler.pro')) {
      cookieDomain = '; Domain=.hyperfiler.pro';
    }
    
    return new Response(JSON.stringify({ 
      message: 'Logout successful' 
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        // SECURITY: Clear httpOnly cookie for correct domain
        'Set-Cookie': `authToken=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/${cookieDomain}`
      }
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({ error: 'Logout failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Auth: Forgot password
async function handleForgotPassword(request, env, corsHeaders) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find user in database
    const stmt = env.DB.prepare('SELECT id FROM users WHERE email = ?');
    const user = await stmt.bind(email).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'No account found with that email address' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate new password
    const newPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-2);
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    const updateStmt = env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE email = ?');
    await updateStmt.bind(hashedPassword, email).run();

    // Send password reset email
    const emailHtml = generatePasswordResetEmailHTML(email, newPassword);
    const emailResult = await sendEmail(
      env, 
      email, 
      'Password Reset - HyperFiler Pro', 
      emailHtml
    );

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Password reset successful! New password sent to your email.',
      tempPassword: newPassword, // For development - remove in production
      email_sent: emailResult.success,
      email_id: emailResult.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    return new Response(JSON.stringify({ error: 'Failed to reset password' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// SIMPLE SYNC: Replace all tasks for user
// Legacy disabled simple sync endpoint - removed for simplification
async function handleTasksSyncSimple_DISABLED(request, env, corsHeaders) {
  // This endpoint is disabled - use main simple sync instead
  return new Response(JSON.stringify({ 
    error: 'Endpoint disabled',
    message: 'Use /tasks endpoint instead'
  }), {
    status: 410, // Gone
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
  
  /* DANGEROUS CODE REMOVED - was:
  try {
    const token = getAuthToken(request);
    const payload = await verifyToken(token, env.JWT_SECRET || 'default-secret-key');
    
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { userId, tasks } = await request.json();
    
    if (!tasks || !Array.isArray(tasks)) {
      return new Response(JSON.stringify({ error: 'Invalid tasks data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Ensure user can only sync their own tasks
    if (userId !== payload.userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const actualUserId = payload.userId;
    
    // SIMPLE SYNC: Delete all existing tasks for user, then insert all new tasks
    console.log('🚀 SIMPLE SYNC: Replacing all tasks for user:', actualUserId);
    
    // Delete all existing tasks
    await env.DB.prepare('DELETE FROM user_tasks WHERE user_id = ?')
      .bind(actualUserId)
      .run();
    
    // OPTIMIZED: Prepare statement once and batch insert all tasks
    if (tasks.length > 0) {
      console.log('🔧 DEBUG: Starting batch insert for', tasks.length, 'tasks');
      
      // CRITICAL FIX: Remove duplicate task IDs to prevent UNIQUE constraint errors
      const uniqueTasks = [];
      const seenIds = new Set();
      
      for (const task of tasks) {
        if (!seenIds.has(task.id)) {
          seenIds.add(task.id);
          // Validate and sanitize task data
          const cleanTask = validateAndSanitizeTask(task);
          if (cleanTask) {
            uniqueTasks.push(cleanTask);
          } else {
            console.log('🔧 DEBUG: Skipping invalid task:', task.id);
          }
        } else {
          console.log('🔧 DEBUG: Skipping duplicate task ID:', task.id);
        }
      }
      
      console.log('🔧 DEBUG: Original tasks:', tasks.length, 'Unique tasks:', uniqueTasks.length);
      
      const stmt = env.DB.prepare(`
        INSERT INTO user_tasks 
        (id, user_id, title, notes, images, due_date, due_time, status, repeat_type, template, is_event, created_at, updated_at, is_deleted, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      try {
        // Create batch of bound statements using deduplicated tasks
        const boundStatements = uniqueTasks.map((task, index) => {
          return stmt.bind(
            task.id,
            actualUserId,
            task.title || '',
            task.notes || '',
            JSON.stringify(task.images || []),
            task.due_date || null,
            task.due_time || null,
            task.status || 'pending',
            task.repeat_type || null,
            task.template || null,
            task.is_event ? 1 : 0,
            task.created_at || new Date().toISOString(),
            task.updated_at || new Date().toISOString(),
            task.is_deleted ? 1 : 0,
            task.deleted_at || null
          );
        });
        
        console.log('🔧 DEBUG: Executing batch with', boundStatements.length, 'unique statements');
        
        // Execute all statements in a single batch operation
        const batchResult = await env.DB.batch(boundStatements);
        console.log('📊 PERFORMANCE: Batch inserted', uniqueTasks.length, 'unique tasks successfully');
        
      } catch (batchError) {
        console.error('🔧 DEBUG: Batch operation failed:', batchError);
        // Fallback to individual inserts with upsert logic
        console.log('🔄 FALLBACK: Using individual inserts with upsert');
        const upsertStmt = env.DB.prepare(`
          INSERT OR REPLACE INTO user_tasks 
          (id, user_id, title, notes, due_date, due_time, status, repeat_type, template, created_at, updated_at, is_deleted, deleted_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const task of uniqueTasks) {
          await upsertStmt.bind(
            task.id,
            actualUserId,
            task.title || '',
            task.notes || '',
            task.due_date || null,
            task.due_time || null,
            task.status || 'pending',
            task.repeat_type || null,
            task.template || null,
            task.created_at || new Date().toISOString(),
            task.updated_at || new Date().toISOString(),
            task.is_deleted ? 1 : 0,
            task.deleted_at || null
          ).run();
        }
        console.log('📊 FALLBACK: Individual upsert completed for', uniqueTasks.length, 'tasks');
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      synced: tasks.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Simple sync error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  */ // END DANGEROUS CODE REMOVED
}

// OLD COMPLEX SYNC: (keeping for reference)
async function handleTasksSync(request, env, corsHeaders) {
  try {
    const token = getAuthToken(request);
    const payload = await verifyToken(token, env.JWT_SECRET || 'default-secret-key');
    
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { userId, tasks } = await request.json();
    
    if (!operations || !Array.isArray(operations)) {
      return new Response(JSON.stringify({ error: 'Invalid operations data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Ensure user can only sync their own tasks
    if (userId !== payload.userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const actualUserId = payload.userId;
    let processedCount = 0;

    // Process each operation
    for (const operation of operations) {
      const { operation: op, task } = operation;
      
      try {
        switch (op) {
          case 'add':
          case 'update':
            const stmt = env.DB.prepare(`
              INSERT OR REPLACE INTO user_tasks 
              (id, user_id, title, notes, due_date, due_time, status, repeat_type, template, created_at, updated_at, is_deleted, deleted_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            await stmt.bind(
              task.id,
              actualUserId,
              task.title || '',
              task.notes || '',
              task.due_date || task.dueDate || null,
              task.due_time || task.dueTime || null,
              task.status || 'pending',
              task.repeat_type || task.repeatType || null,
              task.template || null,
              task.created_at || task.createdAt,
              task.updatedAt,
              task.isDeleted ? 1 : 0,
              task.deletedAt || null
            ).run();
            processedCount++;
            break;
            
          case 'delete':
            const deleteStmt = env.DB.prepare(`
              UPDATE user_tasks 
              SET is_deleted = 1, deleted_at = ?, updated_at = ?
              WHERE id = ? AND user_id = ?
            `);
            await deleteStmt.bind(
              task.deletedAt,
              task.updatedAt,
              task.id,
              actualUserId
            ).run();
            processedCount++;
            break;
        }
      } catch (opError) {
        console.error(`Error processing operation ${op} for task ${task.id}:`, opError);
      }
    }
    
    return new Response(JSON.stringify({ 
      message: 'Sync operations completed successfully', 
      processedCount,
      totalOperations: operations.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Tasks sync error:', error);
    return new Response(JSON.stringify({ error: 'Sync failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// ===== TASKS SYNC FUNCTIONS (Simple Lists pattern) =====

async function handleTasksSyncSimple(request, env, corsHeaders) {
  try {
    const token = getAuthToken(request);
    const payload = await verifyToken(token, env.JWT_SECRET || 'default-secret-key');
    
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { userId, tasks } = await request.json();
    
    if (!tasks || !Array.isArray(tasks)) {
      console.error('❌ Invalid tasks data:', { tasks: typeof tasks, isArray: Array.isArray(tasks) });
      return new Response(JSON.stringify({ error: 'Invalid tasks data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Ensure user can only sync their own tasks
    if (userId !== payload.userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const actualUserId = payload.userId;
    
    // SIMPLE SYNC: Delete all existing tasks for user, then insert all new tasks (EXACTLY like Lists)
    console.log('🚀 SIMPLE TASKS SYNC: Replacing all tasks for user:', actualUserId);
    
    // Delete all existing tasks
    await env.DB.prepare('DELETE FROM user_tasks WHERE user_id = ?')
      .bind(actualUserId)
      .run();
    
    // Insert all tasks as a single JSON record (EXACT COPY of Lists - with required title)
    const stmt = env.DB.prepare(`
      INSERT INTO user_tasks 
      (user_id, task_data, title, created_at, updated_at)
      VALUES (?, ?, 'JSON_TASKS_DATA', datetime('now'), datetime('now'))
    `);
    
    await stmt.bind(
      actualUserId,
      JSON.stringify(tasks) // Store entire tasks array as JSON (same as Lists)
    ).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Tasks synced successfully',
      tasksCount: tasks.length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Simple tasks sync error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Tasks: Get user tasks
async function handleGetTasks(userId, request, env, corsHeaders) {
  try {
    const token = getAuthToken(request);
    const payload = await verifyToken(token, env.JWT_SECRET || 'default-secret-key');
    
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Ensure user can only access their own tasks
    if (userId !== payload.userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // SECURITY: Validate user ID format
    if (!validateUserId(userId)) {
      return new Response(JSON.stringify({ error: 'Invalid user ID format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('📥 SIMPLE TASKS SYNC: Getting all tasks for user:', userId);
    
    const { results } = await env.DB.prepare(`
      SELECT task_data FROM user_tasks 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).bind(userId).all();
    
    // Parse the JSON data back to tasks format (EXACT COPY of Lists pattern)
    let tasks = [];
    if (results.length > 0 && results[0].task_data) {
      tasks = JSON.parse(results[0].task_data);
    }
    
    return new Response(JSON.stringify({ 
      tasks: tasks
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get tasks error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get tasks' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Handle individual task deletion
async function handleDeleteTask(taskId, request, env, corsHeaders) {
  try {
    const token = getAuthToken(request);
    const payload = await verifyToken(token, env.JWT_SECRET || 'default-secret-key');
    
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = payload.userId;
    
    // Soft delete the task (mark as deleted)
    const deleteStmt = env.DB.prepare(`
      UPDATE user_tasks 
      SET is_deleted = 1, deleted_at = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `);
    
    const now = new Date().toISOString();
    const result = await deleteStmt.bind(now, now, taskId, userId).run();
    
    if (result.changes === 0) {
      return new Response(JSON.stringify({ error: 'Task not found or already deleted' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      message: 'Task deleted successfully',
      taskId: taskId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Delete task error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete task' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// DELTA SYNC: Get task changes since a specific timestamp
async function handleGetTaskChanges(userId, request, env, corsHeaders) {
  try {
    const token = getAuthToken(request);
    const payload = await verifyToken(token, env.JWT_SECRET || 'default-secret-key');
    
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Ensure user can only access their own tasks
    if (userId !== payload.userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // SECURITY: Validate user ID format
    if (!validateUserId(userId)) {
      return new Response(JSON.stringify({ error: 'Invalid user ID format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get 'since' parameter from URL
    const url = new URL(request.url);
    const sinceParam = url.searchParams.get('since');
    
    if (!sinceParam) {
      return new Response(JSON.stringify({ error: 'Missing "since" parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Convert timestamp to ISO string if it's a number
    let sinceTimestamp;
    if (/^\d+$/.test(sinceParam)) {
      // It's a Unix timestamp
      sinceTimestamp = new Date(parseInt(sinceParam)).toISOString();
    } else {
      // Assume it's already ISO string
      sinceTimestamp = sinceParam;
    }

    console.log(`📥 DELTA SYNC: Getting changes for user ${userId} since ${sinceTimestamp}`);

    // Get tasks modified since the timestamp (including soft-deleted ones for proper sync)
    let stmt;
    try {
      stmt = env.DB.prepare(`
        SELECT * FROM user_tasks 
        WHERE user_id = ? AND updated_at > ? 
        ORDER BY updated_at DESC
      `);
    } catch (error) {
      console.error('Error preparing delta sync query:', error);
      return new Response(JSON.stringify({ error: 'Database query error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result = await stmt.bind(userId, sinceTimestamp).all();
    
    // Map database fields to frontend format
    const changedTasks = (result.results || []).map(task => ({
      id: task.id,
      title: task.title,
      notes: task.notes,
      images: task.images ? JSON.parse(task.images) : [],
      dueDate: task.due_date,
      dueTime: task.due_time,
      status: task.status,
      repeat: task.repeat_type,
      template: task.template,
      isEvent: Boolean(task.is_event || false),
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      isDeleted: Boolean(task.is_deleted || false),
      deletedAt: task.deleted_at || null
    }));

    // Separate into created, updated, and deleted
    const changes = {
      created: changedTasks.filter(task => task.createdAt > sinceTimestamp && !task.isDeleted),
      updated: changedTasks.filter(task => task.createdAt <= sinceTimestamp && !task.isDeleted),
      deleted: changedTasks.filter(task => task.isDeleted).map(task => task.id)
    };

    console.log(`📊 DELTA SYNC: Returning ${changes.created.length} created, ${changes.updated.length} updated, ${changes.deleted.length} deleted`);

    return new Response(JSON.stringify({ 
      changes: changes,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get task changes error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get task changes' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// DELTA SYNC: Upload only changed tasks
async function handleTasksDeltaSync(request, env, corsHeaders) {
  try {
    const token = getAuthToken(request);
    const payload = await verifyToken(token, env.JWT_SECRET || 'default-secret-key');
    
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = payload.userId;

    // SECURITY: Validate user ID format
    if (!validateUserId(userId)) {
      return new Response(JSON.stringify({ error: 'Invalid user ID format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { changes } = body;

    if (!changes || typeof changes !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid changes format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📤 DELTA SYNC: Processing changes for user ${userId}`);
    console.log(`📊 Changes: ${(changes.created || []).length} created, ${(changes.updated || []).length} updated, ${(changes.deleted || []).length} deleted`);

    let totalProcessed = 0;

    // Process created tasks
    if (changes.created && Array.isArray(changes.created)) {
      for (const task of changes.created) {
        const validatedTask = validateAndSanitizeTask(task);
        if (validatedTask) {
          await insertOrUpdateTask(validatedTask, userId, env);
          totalProcessed++;
        }
      }
    }

    // Process updated tasks
    if (changes.updated && Array.isArray(changes.updated)) {
      for (const task of changes.updated) {
        const validatedTask = validateAndSanitizeTask(task);
        if (validatedTask) {
          await insertOrUpdateTask(validatedTask, userId, env);
          totalProcessed++;
        }
      }
    }

    // Process deleted tasks
    if (changes.deleted && Array.isArray(changes.deleted)) {
      for (const taskId of changes.deleted) {
        if (typeof taskId === 'string' && taskId.trim()) {
          const deleteStmt = env.DB.prepare(`
            UPDATE user_tasks 
            SET is_deleted = 1, deleted_at = ?, updated_at = ?
            WHERE id = ? AND user_id = ?
          `);
          
          const now = new Date().toISOString();
          await deleteStmt.bind(now, now, taskId, userId).run();
          totalProcessed++;
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      processed: totalProcessed,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Delta sync error:', error.message);
    console.error('❌ Error stack:', error.stack);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Helper function to insert or update a task
async function insertOrUpdateTask(task, userId, env) {
  try {
    const stmt = env.DB.prepare(`
      INSERT OR REPLACE INTO user_tasks (
        id, user_id, title, notes, images, due_date, due_time, 
        status, repeat_type, template, is_event, created_at, updated_at,
        is_deleted, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    await stmt.bind(
      task.id,
      userId,
      task.title,
      task.notes,
      JSON.stringify(task.images || []),
      task.due_date,
      task.due_time,
      task.status,
      task.repeat_type,
      task.template,
      task.is_event ? 1 : 0,
      task.created_at,
      task.updated_at,
      task.is_deleted ? 1 : 0,
      task.deleted_at
    ).run();
    
  } catch (error) {
    console.error('Error inserting/updating task:', error);
    throw error;
  }
}

// Helper: Hash password (SECURE - using proper salt and PBKDF2)
async function hashPassword(password) {
  // Generate a cryptographically secure random salt
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Use PBKDF2 for key derivation (similar to bcrypt but available in Web Crypto API)
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Import password as key
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // Derive key using PBKDF2 with 100,000 iterations (industry standard)
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    256 // 32 bytes = 256 bits
  );
  
  // Convert to hex
  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Return in format: salt:hash (for storage)
  return `${saltHex}:${hashHex}`;
}

// Helper: Verify password (SECURE - with backward compatibility for old format)
async function verifyPassword(password, storedHash) {
  try {
    // Check if hash is in new format (contains colon)
    if (storedHash.includes(':')) {
      return await verifyPasswordNew(password, storedHash);
    } else {
      // Old format - use legacy verification
      return await verifyPasswordOld(password, storedHash);
    }
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// Helper: Verify password with new secure format
async function verifyPasswordNew(password, storedHash) {
  try {
    // Split stored hash into salt and hash
    const [saltHex, hashHex] = storedHash.split(':');
    
    if (!saltHex || !hashHex) {
      console.error('Invalid hash format');
      return false;
    }
    
    // Convert hex salt back to Uint8Array
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    // Use same PBKDF2 process as hashPassword
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      256
    );
    
    const computedHash = Array.from(new Uint8Array(derivedBits))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Use constant-time comparison to prevent timing attacks
    return constantTimeCompare(computedHash, hashHex);
    
  } catch (error) {
    console.error('New password verification error:', error);
    return false;
  }
}

// Helper: Verify password with old format (for backward compatibility)
async function verifyPasswordOld(password, storedHash) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'salt123');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedInput = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashedInput === storedHash;
  } catch (error) {
    console.error('Old password verification error:', error);
    return false;
  }
}

// Helper: Check if hash is in new format
function isNewFormat(hash) {
  return hash.includes(':') && hash.split(':').length === 2;
}

// Helper: Check if hash is in old format
function isOldFormat(hash) {
  return !isNewFormat(hash) && hash.length === 64; // SHA-256 hex length
}

// Helper: Constant-time string comparison to prevent timing attacks
function constantTimeCompare(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

// Helper: Generate secure admin password hash (for environment variable)
async function generateAdminPasswordHash(adminPassword) {
  if (!adminPassword) {
    throw new Error('Admin password is required');
  }
  
  const hashedPassword = await hashPassword(adminPassword);
  console.log('🔐 Admin password hash generated. Store this in your environment variables:');
  console.log('ADMIN_PASSWORD_HASH=' + hashedPassword);
  return hashedPassword;
}

// Helper: Unicode-safe base64 encoding
function unicodeSafeBase64Encode(str) {
  // Convert string to UTF-8 bytes first, then to base64
  const utf8Bytes = new TextEncoder().encode(str);
  const binaryString = String.fromCharCode(...utf8Bytes);
  return btoa(binaryString);
}

// Helper: Generate JWT (simplified)
async function generateJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours
  const fullPayload = { ...payload, exp };
  
  const encodedHeader = unicodeSafeBase64Encode(JSON.stringify(header)).replace(/[+/=]/g, m => ({ '+': '-', '/': '_', '=': '' }[m]));
  const encodedPayload = unicodeSafeBase64Encode(JSON.stringify(fullPayload)).replace(/[+/=]/g, m => ({ '+': '-', '/': '_', '=': '' }[m]));
  
  // Create proper HMAC-SHA256 signature
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret || 'default-secret-key'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signatureInput));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/[+/=]/g, m => ({ '+': '-', '/': '_', '=': '' }[m]));
  
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

// Helper: Send email via Resend
async function sendEmail(env, to, subject, html) {
  try {
    const resendApiKey = env.RESEND_API_KEY || 'test-key';
    
    if (resendApiKey === 'test-key') {
      console.log('📧 EMAIL WOULD BE SENT (Resend not configured):');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('HTML:', html);
      return { success: true, id: 'test-email-id' };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'HyperFiler Pro <support@hyperfiler.pro>',
        to: [to],
        subject: subject,
        html: html
      })
    });

    const result = await response.json();
    
    console.log('📧 Resend API Response Status:', response.status);
    console.log('📧 Resend API Response:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      console.error('❌ Resend API Error:', response.status, result);
      throw new Error(`Resend API error (${response.status}): ${result.message || JSON.stringify(result)}`);
    }

    console.log('✅ Email sent successfully:', result.id);
    return { success: true, id: result.id };
    
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error: error.message };
  }
}

// Helper: Generate promo email HTML
async function generatePromoEmailHTML(userEmail, password, promoCode, months, trialEndDate, stripeCustomerId, env) {
  const loginUrl = 'https://hyperfiler.pro/login.html';
  const readmeUrl = 'https://hyperfiler.pro/readme';
  
  // Detect if this is a Stripe customer (subscription) vs promo code
  const isStripeCustomer = stripeCustomerId && (promoCode === 'Welcome to HyperFiler Pro!' || months === 'Unlimited');
  
  // Generate Stripe customer portal URL if customer ID is provided
  let customerPortalUrl = 'https://hyperfiler.pro/frontend/upgrade-compare.html';
  console.log('Customer portal generation - stripeCustomerId:', stripeCustomerId, 'env provided:', !!env);
  if (stripeCustomerId && env) {
    try {
      const stripe = new Stripe(env.STRIPE_SECRET_KEY);
      console.log('Creating customer portal for customer:', stripeCustomerId);
      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: 'https://hyperfiler.pro/frontend/hyperfiler-pro.html',
      });
      customerPortalUrl = session.url;
      console.log('Customer portal URL created successfully:', customerPortalUrl);
    } catch (error) {
      console.error('Failed to create customer portal URL:', error);
      // Fall back to upgrade page
    }
  } else {
    console.log('Customer portal not created - missing stripeCustomerId or env');
  }
  
  // Generate different content based on whether it's a Stripe customer or promo code
  if (isStripeCustomer) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to HyperFiler Pro!</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .content {
            padding: 40px;
        }
        .subscription-badge {
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            display: inline-block;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .credentials {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            margin: 10px 5px;
            transition: all 0.3s ease;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
        .highlight {
            background: #e8f4ff;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ HyperFiler Pro 🚀</h1>
            <p>43 Folders methodology, digitally supercharged</p>
        </div>
        
        <div class="content">
            <div style="text-align: center; font-size: 3em; margin: 20px 0;">🎊 🚀 🎊</div>
            
                            <div class="subscription-badge">€49.98 Lifetime Pro Access - Active</div>
            
            <h2>Congratulations!</h2>
                          <p>Thank you for purchasing HyperFiler Pro! Your <strong>€49.98 one-time payment</strong> gives you lifetime access to all our powerful productivity features.</p>
            
            <div class="credentials">
                <h3>🔐 Your Login Credentials</h3>
                <p><strong>Email:</strong> ${userEmail}</p>
                <p><strong>Password:</strong> <code>${password}</code></p>
                                  <p><strong>Access:</strong> Lifetime Pro (€49.98 one-time)</p>
                <p><em>You can change this password after logging in.</em></p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://hyperfiler.pro/hyperfiler-pro.html" class="button">🚀 Start Using HyperFiler Pro</a>
                <br>
                <a href="${readmeUrl}" class="button" style="background: #28a745;">📚 Complete User Guide</a>
            </div>
            
            <div class="highlight">
                <h3>🎯 Your Premium Features Include:</h3>
                <ul>
                    <li>✅ Unlimited tasks and folders</li>
                    <li>✅ Cloud sync across all devices</li>
                    <li>✅ Advanced analytics & reports</li>
                    <li>✅ Priority support & early access</li>
                    <li>✅ Automatic backups & recovery</li>
                    <li>✅ Team collaboration features</li>
                    <li>✅ Advanced export formats</li>
                    <li>✅ Custom themes and layouts</li>
                </ul>
            </div>
            
            <h3>🚀 Quick Start Tips</h3>
            <ol>
                <li>Open your HyperFiler Pro app</li>
                <li>Use <code>Ctrl+N</code> to create your first task</li>
                <li>Try the Week view with <code>Ctrl+W</code></li>
                <li>Use arrow keys to navigate like a pro</li>
                <li>Press <code>Ctrl+I</code> for all shortcuts</li>
            </ol>
            
                          <p><strong>Your Pro access is lifetime</strong> - no recurring payments or subscription management needed! Your €49.98 one-time payment gives you permanent access to all Pro features.</p>
            
            <p>Need help? Reply to this email and we'll get you sorted out quickly!</p>
        </div>
        
        <div class="footer">
            <p><strong>HyperFiler Pro</strong> - 43 Folders methodology, digitally supercharged</p>
            <p style="font-size: 0.8em;">
                <a href="https://hyperfiler.pro/login.html" style="color: #667eea;">Login to HyperFiler Pro</a>
            </p>
        </div>
    </div>
</body>
</html>
`;
  }
  
  // Original promo code template
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your HyperFiler Pro Account is Ready!</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .content {
            padding: 40px;
        }
        .promo-badge {
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            display: inline-block;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .credentials {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #28a745;
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            margin: 10px 5px;
            transition: all 0.3s ease;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
        .highlight {
            background: #e8f5e8;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #28a745;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${promoCode === 'TRIAL' ? '👑 Welcome to HyperFiler Pro! 🚀' : '🎁 Promo Code Redeemed! 🎉'}</h1>
            <p>${promoCode === 'TRIAL' ? 'Professional productivity software trial' : 'Your HyperFiler Pro account is ready'}</p>
        </div>
        
        <div class="content">
            <div style="text-align: center; font-size: 3em; margin: 20px 0;">🎊 🚀 🎊</div>
            
            <div class="promo-badge">${promoCode === 'TRIAL' ? 'Professional Software Trial' : (promoCode + ' - ' + (months === 999 ? 'LIFETIME Free Forever!' : months + ' Months Free!'))}</div>
            
            <h2>${promoCode === 'TRIAL' ? 'Welcome to Professional Productivity!' : 'Congratulations!'}</h2>
            <p>${promoCode === 'TRIAL' ? 'You\'re now experiencing <strong>HyperFiler Pro</strong> - premium productivity software designed for professionals. Take as long as you need to evaluate its value. When ready, purchase your €49.98 professional license.' : ('Your promo code has been successfully redeemed! You now have <strong>' + (months === 999 ? 'LIFETIME access to HyperFiler Pro forever' : months + ' months of HyperFiler Pro') + '</strong> completely free, with access to all premium features.')}</p>
            
            <div class="credentials">
                <h3>🔐 Your Login Credentials</h3>
                <p><strong>Email:</strong> ${userEmail}</p>
                <p><strong>Password:</strong> <code>${password}</code></p>
                <p><strong>${promoCode === 'TRIAL' ? 'Trial Access' : 'Pro Access Until'}:</strong> ${promoCode === 'TRIAL' ? 'Unlimited evaluation period' : trialEndDate}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://hyperfiler.pro/hyperfiler-pro.html" class="button">🚀 Start Using HyperFiler Pro</a>
                <br>
                <a href="${readmeUrl}" class="button" style="background: #28a745;">📚 Complete User Guide</a>
            </div>
            
            <div class="highlight">
                <h3>🎯 ${promoCode === 'TRIAL' ? 'Premium Features You\'re Experiencing' : 'Your Free Pro Features Include'}:</h3>
                <ul>
                    <li>✅ Unlimited tasks and folders</li>
                    <li>✅ Cloud sync across all devices</li>
                    <li>✅ Advanced analytics & reports</li>
                    <li>✅ Priority support & early access</li>
                    <li>✅ Automatic backups & recovery</li>
                    <li>✅ Team collaboration features</li>
                    <li>✅ Advanced export formats</li>
                    <li>✅ Custom themes and layouts</li>
                </ul>
            </div>
            
            <h3>🚀 Quick Start Tips</h3>
            <ol>
                <li>Click the login button above to access your Pro app</li>
                <li>Use <code>Ctrl+N</code> to create your first task</li>
                <li>Try the Week view with <code>Ctrl+W</code></li>
                <li>Use arrow keys to navigate like a pro</li>
                <li>Press <code>Ctrl+I</code> for all shortcuts</li>
            </ol>
            
            <p><strong>${promoCode === 'TRIAL' ? 'Experience Premium Quality Software' : 'Thank you for being an early supporter!'}</strong> ${promoCode === 'TRIAL' ? 'Quality professional tools deserve investment. When you\'re ready to purchase your €49.98 license, you\'ll join our community of users who value premium software.' : 'Your feedback helps us make HyperFiler Pro even better.'}</p>
            
            <p>Need help? Reply to this email and we'll get you sorted out quickly!</p>
        </div>
        
        <div class="footer">
            <p><strong>HyperFiler Pro</strong> - 43 Folders methodology, digitally supercharged</p>
            <p>${promoCode === 'TRIAL' ? 'Professional Software Trial • Purchase your €49.98 license when ready' : ('Promo code ' + promoCode + ' redeemed successfully • ' + (months === 999 ? 'LIFETIME access forever' : months + ' months free until ' + trialEndDate))}</p>
            <p style="font-size: 0.8em;"><a href="${promoCode === 'TRIAL' ? 'https://hyperfiler.pro/upgrade-compare' : 'https://hyperfiler.pro/hyperfiler-pro.html'}" style="color: #667eea;">${promoCode === 'TRIAL' ? 'Purchase License' : 'Start Using HyperFiler Pro'}</a></p>
        </div>
    </div>
</body>
</html>
  `;
}

// Helper: Generate password reset email HTML
async function generatePasswordResetEmailHTML(userEmail, newPassword, stripeCustomerId, env) {
  const loginUrl = 'https://hyperfiler.pro/login.html';
  
  // Generate Stripe customer portal URL if customer ID is provided
  let customerPortalUrl = 'https://hyperfiler.pro/frontend/upgrade-compare.html';
  if (stripeCustomerId && env) {
    try {
      const stripe = new Stripe(env.STRIPE_SECRET_KEY);
      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: 'https://hyperfiler.pro/frontend/hyperfiler-pro.html',
      });
      customerPortalUrl = session.url;
    } catch (error) {
      console.error('Failed to create customer portal URL:', error);
      // Fall back to upgrade page
    }
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - HyperFiler Pro</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        .content {
            padding: 40px;
        }
        .credentials {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            margin: 10px 5px;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Reset</h1>
            <p>Your new password is ready</p>
        </div>
        
        <div class="content">
            <h2>Password Reset Successful</h2>
            <p>Your password has been reset as requested. Here are your new login credentials:</p>
            
            <div class="credentials">
                <h3>🔐 Your New Login Credentials</h3>
                <p><strong>Email:</strong> ${userEmail}</p>
                <p><strong>New Password:</strong> <code>${newPassword}</code></p>
                <p><em>For security, please change this password after logging in.</em></p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" class="button">🚀 Login to HyperFiler Pro</a>
            </div>
            
            <p><strong>Security Note:</strong> If you didn't request this password reset, please contact support immediately.</p>
        </div>
        
        <div class="footer">
            <p><strong>HyperFiler Pro</strong> - Your productivity companion</p>
            <p style="font-size: 0.8em;"><a href="https://hyperfiler.pro/frontend/hyperfiler-pro.html" style="color: #667eea;">Start Using HyperFiler Pro</a></p>
        </div>
    </div>
</body>
</html>
  `;
}

// Admin authentication helper (SECURE - using environment variable)
async function verifyAdminAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    return false;
  }
  
  // Get admin password hash from environment variable
  const adminPasswordHash = env.ADMIN_PASSWORD_HASH;
  
  if (!adminPasswordHash) {
    console.error('❌ ADMIN_PASSWORD_HASH environment variable not set');
    return false;
  }
  
  // Verify the provided token against the stored hash
  try {
    return await verifyPassword(token, adminPasswordHash);
  } catch (error) {
    console.error('❌ Admin authentication error:', error);
    return false;
  }
}

// Admin: Get all users
async function handleAdminUsers(request, env, corsHeaders) {
  try {
    // Authentication is now handled by requireAdminAuth wrapper

    const stmt = env.DB.prepare(`
      SELECT users.id, users.email, users.created_at, 
             subs.plan_name, subs.status as subscription_status,
             subs.stripe_customer_id, subs.stripe_subscription_id,
             subs.current_period_start, subs.current_period_end
      FROM users 
      LEFT JOIN user_subscriptions subs ON users.id = subs.user_id
      ORDER BY users.created_at DESC
    `);
    
    const result = await stmt.all();
    const users = result.results || [];

    return new Response(JSON.stringify({ 
      users: users,
      count: users.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Admin get users error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get users' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Admin: Get user details
async function handleAdminUserDetails(email, request, env, corsHeaders) {
  try {
    // Authentication is now handled by requireAdminAuth wrapper

    const userStmt = env.DB.prepare('SELECT * FROM users WHERE email = ?');
    const user = await userStmt.bind(email).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const subStmt = env.DB.prepare('SELECT * FROM user_subscriptions WHERE user_id = ?');
    const subscription = await subStmt.bind(user.id).first();

    return new Response(JSON.stringify({ 
      user: user,
      subscription: subscription
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Admin get user details error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get user details' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Admin: Reset user password
async function handleAdminResetPassword(email, request, env, corsHeaders) {
  try {
    // Authentication is now handled by requireAdminAuth wrapper

    const userStmt = env.DB.prepare('SELECT id FROM users WHERE email = ?');
    const user = await userStmt.bind(email).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate new password
    const newPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-2);
    const hashedPassword = await hashPassword(newPassword);

    const updateStmt = env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE email = ?');
    await updateStmt.bind(hashedPassword, email).run();

    // Send password reset email
    const emailHtml = generatePasswordResetEmailHTML(email, newPassword);
    const emailResult = await sendEmail(
      env, 
      email, 
      'Password Reset - HyperFiler Pro', 
      emailHtml
    );

    return new Response(JSON.stringify({ 
      message: 'Password reset successfully',
      new_password: newPassword,
      email_sent: emailResult.success,
      email_id: emailResult.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Admin reset password error:', error);
    return new Response(JSON.stringify({ error: 'Failed to reset password' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Admin: Resend email with credentials
async function handleAdminResendEmail(email, request, env, corsHeaders) {
  try {
    // Authentication is now handled by requireAdminAuth wrapper

    const userStmt = env.DB.prepare('SELECT id FROM users WHERE email = ?');
    const user = await userStmt.bind(email).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate new password
    const newPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-2);
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    const updateStmt = env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE email = ?');
    await updateStmt.bind(hashedPassword, email).run();

    // Check if user has a subscription to determine email type
    const subStmt = env.DB.prepare('SELECT * FROM user_subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1');
    const subscription = await subStmt.bind(user.id).first();

    let emailHtml, subject;
    if (subscription && subscription.plan_name === 'pro') {
      // Send promo-style email for Pro users
      const trialEnd = new Date(subscription.current_period_end).toLocaleDateString();
      emailHtml = await generatePromoEmailHTML(
        email, 
        newPassword, 
        'ADMIN-RESEND', 
        Math.ceil((new Date(subscription.current_period_end) - new Date()) / (1000 * 60 * 60 * 24 * 30)), 
        trialEnd,
        subscription.stripe_customer_id,
        env
      );
      subject = '🎉 Your HyperFiler Pro Credentials (Admin Resend)';
    } else {
      // Send regular password reset email
      emailHtml = generatePasswordResetEmailHTML(email, newPassword);
      subject = 'Your HyperFiler Pro Credentials (Admin Resend)';
    }

    // Send email
    const emailResult = await sendEmail(env, email, subject, emailHtml);

    return new Response(JSON.stringify({ 
      message: 'Credentials email resent successfully',
      new_password: newPassword,
      email_sent: emailResult.success,
      email_status: emailResult.success ? 'sent' : 'failed',
      email_id: emailResult.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Admin resend email error:', error);
    return new Response(JSON.stringify({ error: 'Failed to resend email' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Admin: Delete user
async function handleAdminDeleteUser(email, request, env, corsHeaders) {
  try {
    // Authentication is now handled by requireAdminAuth wrapper

    const userStmt = env.DB.prepare('SELECT id FROM users WHERE email = ?');
    const user = await userStmt.bind(email).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user has Stripe subscription
    const subStmt = env.DB.prepare('SELECT stripe_subscription_id, stripe_customer_id FROM user_subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1');
    const subscription = await subStmt.bind(user.id).first();
    
    let stripeResult = { cancelled: false, warning: null };
    
    // Try to cancel Stripe subscription if it exists
    if (subscription?.stripe_subscription_id) {
      try {
        const stripe = new Stripe(env.STRIPE_SECRET_KEY);
        console.log(`Attempting to cancel Stripe subscription ${subscription.stripe_subscription_id} for user ${email}`);
        
        const canceledSubscription = await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
        console.log(`Successfully cancelled Stripe subscription: ${canceledSubscription.status}`);
        
        stripeResult.cancelled = true;
      } catch (stripeError) {
        console.error('Failed to cancel Stripe subscription:', stripeError);
        stripeResult.warning = `Failed to cancel Stripe subscription automatically. Please cancel manually in Stripe dashboard. Subscription ID: ${subscription.stripe_subscription_id}`;
      }
    }

    // Delete user (cascade will handle related records)
    const deleteStmt = env.DB.prepare('DELETE FROM users WHERE email = ?');
    await deleteStmt.bind(email).run();

    const response = { 
      message: `User ${email} deleted successfully`
    };
    
    if (stripeResult.cancelled) {
      response.stripe_cancelled = true;
    } else if (stripeResult.warning) {
      response.stripe_warning = stripeResult.warning;
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Admin delete user error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete user' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Admin: Create user
async function handleAdminCreateUser(request, env, corsHeaders) {
  try {
    // Authentication is now handled by requireAdminAuth wrapper

    const { email, plan, months } = await request.json();
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user already exists
    const existingUserStmt = env.DB.prepare('SELECT id FROM users WHERE email = ?');
    const existingUser = await existingUserStmt.bind(email).first();
    
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'User already exists' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-2);
    const hashedPassword = await hashPassword(tempPassword);
    const userId = crypto.randomUUID();
    
    // Create user
    const createUserStmt = env.DB.prepare(`
      INSERT INTO users (id, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `);
    await createUserStmt.bind(userId, email, hashedPassword).run();

    // Create subscription if Pro plan
    if (plan === 'pro') {
      const subscriptionMonths = months || 1;
      const trialEndDate = new Date();
      trialEndDate.setMonth(trialEndDate.getMonth() + subscriptionMonths);
      
      const subscriptionId = crypto.randomUUID();
      const subStmt = env.DB.prepare(`
        INSERT INTO user_subscriptions 
        (id, user_id, plan_name, status, current_period_start, current_period_end, created_at, updated_at)
        VALUES (?, ?, 'pro', 'active', datetime('now'), ?, datetime('now'), datetime('now'))
      `);
      await subStmt.bind(subscriptionId, userId, trialEndDate.toISOString()).run();
    }

    // Send welcome email
    let emailResult = { success: false };
    if (plan === 'pro') {
      const trialEndDate = new Date();
      trialEndDate.setMonth(trialEndDate.getMonth() + (months || 1));
      
      const emailHtml = await generatePromoEmailHTML(
        email, 
        tempPassword, 
        'ADMIN-CREATED', 
        months || 1, 
        trialEndDate.toLocaleDateString(),
        null, // No stripe customer ID yet for new accounts
        env
      );
      emailResult = await sendEmail(
        env, 
        email, 
        `🎉 Your HyperFiler Pro Account is Ready! (${months || 1} months free)`, 
        emailHtml
      );
    } else {
      const emailHtml = generatePasswordResetEmailHTML(email, tempPassword);
      emailResult = await sendEmail(
        env, 
        email, 
        'Welcome to HyperFiler Pro', 
        emailHtml
      );
    }

    return new Response(JSON.stringify({ 
      message: `User ${email} created successfully`,
      password: tempPassword,
      plan: plan,
      months: plan === 'pro' ? (months || 1) : null,
      email_sent: emailResult.success,
      email_id: emailResult.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Admin create user error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create user' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Admin: Extend subscription
async function handleAdminExtendSubscription(email, request, env, corsHeaders) {
  try {
    // Authentication is now handled by requireAdminAuth wrapper

    const { months } = await request.json();
    
    if (!months || months < 1) {
      return new Response(JSON.stringify({ error: 'Valid months value required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userStmt = env.DB.prepare('SELECT id FROM users WHERE email = ?');
    const user = await userStmt.bind(email).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get current subscription
    const subStmt = env.DB.prepare('SELECT * FROM user_subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1');
    const subscription = await subStmt.bind(user.id).first();
    
    let newEndDate;
    if (subscription && subscription.current_period_end) {
      // Extend from current end date
      newEndDate = new Date(subscription.current_period_end);
    } else {
      // Start from now
      newEndDate = new Date();
    }
    
    // Handle lifetime subscription (999 months)
    if (months === 999) {
      newEndDate = new Date('2099-12-31');
    } else {
      newEndDate.setMonth(newEndDate.getMonth() + months);
    }
    
    if (subscription) {
      // Update existing subscription
      const updateStmt = env.DB.prepare(`
        UPDATE user_subscriptions 
        SET plan_name = 'pro', status = 'active', current_period_end = ?, updated_at = datetime('now')
        WHERE user_id = ?
      `);
      await updateStmt.bind(newEndDate.toISOString(), user.id).run();
    } else {
      // Create new subscription
      const subscriptionId = crypto.randomUUID();
      const createStmt = env.DB.prepare(`
        INSERT INTO user_subscriptions 
        (id, user_id, plan_name, status, current_period_start, current_period_end, created_at, updated_at)
        VALUES (?, ?, 'pro', 'active', datetime('now'), ?, datetime('now'), datetime('now'))
      `);
      await createStmt.bind(subscriptionId, user.id, newEndDate.toISOString()).run();
    }

    const endDateStr = months === 999 ? 'Lifetime' : newEndDate.toLocaleDateString();
    
    return new Response(JSON.stringify({ 
      message: `Subscription extended for ${email} until ${endDateStr}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Admin extend subscription error:', error);
    return new Response(JSON.stringify({ error: 'Failed to extend subscription' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Admin: Cancel subscription
async function handleAdminCancelSubscription(email, request, env, corsHeaders) {
  try {
    // Authentication is now handled by requireAdminAuth wrapper

    const userStmt = env.DB.prepare('SELECT id FROM users WHERE email = ?');
    const user = await userStmt.bind(email).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Cancel subscription
    const cancelStmt = env.DB.prepare(`
      UPDATE user_subscriptions 
      SET status = 'canceled', updated_at = datetime('now')
      WHERE user_id = ?
    `);
    await cancelStmt.bind(user.id).run();

    return new Response(JSON.stringify({ 
      message: `Subscription canceled for ${email}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Admin cancel subscription error:', error);
    return new Response(JSON.stringify({ error: 'Failed to cancel subscription' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Admin: Get promo codes
async function handleAdminGetPromoCodes(request, env, corsHeaders) {
  try {
    // Authentication is now handled by requireAdminAuth wrapper

    const stmt = env.DB.prepare('SELECT * FROM promo_codes ORDER BY created_at DESC');
    const result = await stmt.all();
    
    return new Response(JSON.stringify({ 
      promo_codes: result.results || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Admin get promo codes error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get promo codes' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Admin: Create promo code
async function handleAdminCreatePromoCode(request, env, corsHeaders) {
  try {
    // Authentication is now handled by requireAdminAuth wrapper

    const { code, description, months } = await request.json();
    
    if (!code || !months) {
      return new Response(JSON.stringify({ error: 'Code and months are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if code already exists
    const existingStmt = env.DB.prepare('SELECT id FROM promo_codes WHERE code = ?');
    const existing = await existingStmt.bind(code.toUpperCase()).first();
    
    if (existing) {
      return new Response(JSON.stringify({ error: 'Promo code already exists' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create promo code
    const promoId = crypto.randomUUID();
    const createStmt = env.DB.prepare(`
      INSERT INTO promo_codes (id, code, description, months, max_uses, current_uses, active, created_at)
      VALUES (?, ?, ?, ?, -1, 0, 1, datetime('now'))
    `);
    await createStmt.bind(promoId, code.toUpperCase(), description || '', months).run();

    return new Response(JSON.stringify({ 
      message: `Promo code ${code.toUpperCase()} created successfully`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Admin create promo code error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create promo code' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Admin: Toggle promo code
async function handleAdminTogglePromoCode(code, request, env, corsHeaders) {
  try {
    // Authentication is now handled by requireAdminAuth wrapper

    const promoStmt = env.DB.prepare('SELECT * FROM promo_codes WHERE code = ?');
    const promo = await promoStmt.bind(code.toUpperCase()).first();
    
    if (!promo) {
      return new Response(JSON.stringify({ error: 'Promo code not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Toggle active status
    const newStatus = promo.active === 1 ? 0 : 1;
    const updateStmt = env.DB.prepare('UPDATE promo_codes SET active = ? WHERE code = ?');
    await updateStmt.bind(newStatus, code.toUpperCase()).run();

    const statusText = newStatus === 1 ? 'activated' : 'deactivated';
    
    return new Response(JSON.stringify({ 
      message: `Promo code ${code.toUpperCase()} ${statusText} successfully`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Admin toggle promo code error:', error);
    return new Response(JSON.stringify({ error: 'Failed to toggle promo code' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Admin: Delete promo code
async function handleAdminDeletePromoCode(code, request, env, corsHeaders) {
  try {
    // Authentication is now handled by requireAdminAuth wrapper

    const deleteStmt = env.DB.prepare('DELETE FROM promo_codes WHERE code = ?');
    const result = await deleteStmt.bind(code.toUpperCase()).run();
    
    if (result.changes === 0) {
      return new Response(JSON.stringify({ error: 'Promo code not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      message: `Promo code ${code.toUpperCase()} deleted successfully`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Admin delete promo code error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete promo code' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Admin: Fix passwords for existing users
async function handleAdminFixPasswords(request, env, corsHeaders) {
  try {
    // Authentication is now handled by requireAdminAuth wrapper

    // Get all users
    const usersStmt = env.DB.prepare('SELECT id, email FROM users');
    const usersResult = await usersStmt.all();
    const users = usersResult.results || [];
    
    let fixedCount = 0;
    const fixedUsers = [];

    for (const user of users) {
      // Generate new password for each user
      const newPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-2);
      const hashedPassword = await hashPassword(newPassword);
      
      // Update user password
      const updateStmt = env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?');
      await updateStmt.bind(hashedPassword, user.id).run();
      
      fixedUsers.push({
        email: user.email,
        newPassword: newPassword
      });
      fixedCount++;
      
      // Send password reset email
      const emailHtml = generatePasswordResetEmailHTML(user.email, newPassword);
      await sendEmail(
        env, 
        user.email, 
        'Password Update - HyperFiler Pro', 
        emailHtml
      );
    }

    return new Response(JSON.stringify({ 
      message: `Fixed passwords for ${fixedCount} users`,
      fixed_users: fixedUsers,
      count: fixedCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Fix passwords error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fix passwords' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Admin: Clear all tasks for a user
async function handleAdminClearTasks(email, request, env, corsHeaders) {
  try {
    // Authentication is now handled by requireAdminAuth wrapper

    // Get user ID
    const userStmt = env.DB.prepare('SELECT id FROM users WHERE email = ?');
    const user = await userStmt.bind(email).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Count tasks before deletion
    const countStmt = env.DB.prepare('SELECT COUNT(*) as count FROM user_tasks WHERE user_id = ?');
    const countResult = await countStmt.bind(user.id).first();
    const taskCount = countResult.count;

    // Delete all tasks for the user
    const deleteStmt = env.DB.prepare('DELETE FROM user_tasks WHERE user_id = ?');
    await deleteStmt.bind(user.id).run();

    return new Response(JSON.stringify({ 
      message: `Cleared ${taskCount} tasks for ${email}`,
      tasks_deleted: taskCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Clear tasks error:', error);
    return new Response(JSON.stringify({ error: 'Failed to clear tasks' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Admin: Clear entire database (all user tasks)
async function handleAdminClearDatabase(request, env, corsHeaders) {
  try {
    // Authentication is now handled by requireAdminAuth wrapper

    // Get admin key from request body
    const body = await request.json();
    if (!body.adminKey || body.adminKey !== 'admin123') {
      return new Response(JSON.stringify({ error: 'Invalid admin key' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Count tasks before deletion
    const countStmt = env.DB.prepare('SELECT COUNT(*) as count FROM user_tasks');
    const countResult = await countStmt.first();
    const taskCount = countResult.count;

    // Delete all tasks
    const deleteStmt = env.DB.prepare('DELETE FROM user_tasks');
    await deleteStmt.run();

    return new Response(JSON.stringify({ 
      message: `Cleared entire database`,
      tasks_deleted: taskCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Clear database error:', error);
    return new Response(JSON.stringify({ error: 'Failed to clear database' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Admin: Create session table (temporary endpoint)
async function handleAdminCreateSessionTable(request, env, corsHeaders) {
  try {
    // Authentication is now handled by requireAdminAuth wrapper

    // Create session_passwords table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS session_passwords (
        session_id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      )
    `).run();

    // Create index
    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_session_passwords_expires_at ON session_passwords(expires_at)
    `).run();

    return new Response(JSON.stringify({ 
      message: 'Session passwords table created successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Create session table error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create session table' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Admin: Check database status (task count)
async function handleAdminDatabaseStatus(request, env, corsHeaders) {
  try {
    // Authentication is now handled by requireAdminAuth wrapper

    // Count total tasks
    const countStmt = env.DB.prepare('SELECT COUNT(*) as count FROM user_tasks');
    const countResult = await countStmt.first();
    const totalTasks = countResult.count;

    return new Response(JSON.stringify({ 
      message: 'Database status',
      total_tasks: totalTasks,
      is_empty: totalTasks === 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Database status error:', error);
    return new Response(JSON.stringify({ error: 'Failed to check database status' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Admin: Analyze database for duplicates and issues
async function handleAdminAnalyzeDatabase(request, env, corsHeaders) {
  try {
    // Authentication is now handled by requireAdminAuth wrapper
    console.log('Starting database analysis...');

    // First, check if tables exist and get basic info
    let totalTasks = 0;
    let totalUsers = 0;
    let duplicateTasks = [];
    let duplicateContent = [];
    let tasksPerUser = [];

    try {
      // Count total users
      const totalUsersStmt = env.DB.prepare('SELECT COUNT(*) as count FROM users');
      const totalUsersResult = await totalUsersStmt.first();
      totalUsers = totalUsersResult?.count || 0;
      console.log('Total users:', totalUsers);
    } catch (error) {
      console.error('Error counting users:', error);
    }

    try {
      // Count total tasks
      const totalTasksStmt = env.DB.prepare('SELECT COUNT(*) as count FROM user_tasks');
      const totalTasksResult = await totalTasksStmt.first();
      totalTasks = totalTasksResult?.count || 0;
      console.log('Total tasks:', totalTasks);
    } catch (error) {
      console.error('Error counting tasks (table might not exist):', error);
      // Tasks table might not exist yet
    }

    if (totalTasks > 0) {
      try {
        // Find duplicate tasks by task_id
        const duplicateTasksStmt = env.DB.prepare(`
          SELECT task_id, COUNT(*) as count 
          FROM user_tasks 
          GROUP BY task_id 
          HAVING COUNT(*) > 1
          ORDER BY count DESC
          LIMIT 10
        `);
        const duplicateTasksResult = await duplicateTasksStmt.all();
        duplicateTasks = duplicateTasksResult.results || [];
      } catch (error) {
        console.error('Error finding duplicate task IDs:', error);
      }

      try {
        // Find duplicate tasks by user_id + title (potential content duplicates)
        const duplicateContentStmt = env.DB.prepare(`
          SELECT user_id, title, COUNT(*) as count 
          FROM user_tasks 
          GROUP BY user_id, title 
          HAVING COUNT(*) > 1
          ORDER BY count DESC
          LIMIT 10
        `);
        const duplicateContentResult = await duplicateContentStmt.all();
        duplicateContent = duplicateContentResult.results || [];
      } catch (error) {
        console.error('Error finding duplicate content:', error);
      }
    }

    try {
      // Tasks per user
      const tasksPerUserStmt = env.DB.prepare(`
        SELECT u.email, COUNT(t.task_id) as task_count
        FROM users u
        LEFT JOIN user_tasks t ON u.id = t.user_id
        GROUP BY u.id, u.email
        ORDER BY task_count DESC
        LIMIT 20
      `);
      const tasksPerUserResult = await tasksPerUserStmt.all();
      tasksPerUser = tasksPerUserResult.results || [];
    } catch (error) {
      console.error('Error getting tasks per user:', error);
      // Fallback to just users
      try {
        const usersOnlyStmt = env.DB.prepare('SELECT email FROM users ORDER BY email LIMIT 20');
        const usersOnlyResult = await usersOnlyStmt.all();
        tasksPerUser = (usersOnlyResult.results || []).map(u => ({ email: u.email, task_count: 0 }));
      } catch (e) {
        console.error('Error getting users only:', e);
      }
    }

    return new Response(JSON.stringify({
      analysis: {
        total_tasks: totalTasks,
        total_users: totalUsers,
        duplicate_task_ids: duplicateTasks.length,
        duplicate_content: duplicateContent.length,
        users_with_tasks: tasksPerUser.filter(u => u.task_count > 0).length
      },
      duplicate_task_ids: duplicateTasks,
      duplicate_content: duplicateContent,
      tasks_per_user: tasksPerUser
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Database analysis error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to analyze database: ' + error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Admin: Check sync status between local DB and Stripe
async function handleAdminSyncCheck(request, env, corsHeaders) {
  try {
    console.log('Starting sync check...');

    // Get all users with their subscription data
    const usersStmt = env.DB.prepare(`
      SELECT users.id, users.email, 
             subs.plan_name, subs.status as subscription_status,
             subs.stripe_customer_id, subs.stripe_subscription_id,
             subs.current_period_start, subs.current_period_end
      FROM users 
      LEFT JOIN user_subscriptions subs ON users.id = subs.user_id
      ORDER BY users.created_at DESC
    `);
    
    const usersResult = await usersStmt.all();
    const users = usersResult.results || [];

    let syncedUsers = 0;
    let stripeOnlyUsers = 0;
    let localOnlyUsers = 0;
    let freeUsers = 0;
    let syncIssues = [];

    for (const user of users) {
      const hasStripeSubscription = user.stripe_subscription_id ? true : false;
      const hasLocalSubscription = user.subscription_status && user.subscription_status !== 'Free' && user.plan_name;
      
      if (hasStripeSubscription && hasLocalSubscription) {
        syncedUsers++;
        
        // Check for potential date mismatches
        if (user.current_period_end) {
          const endDate = new Date(user.current_period_end);
          const now = new Date();
          
          if (endDate < now && user.subscription_status === 'active') {
            syncIssues.push({
              type: 'EXPIRED_LOCAL_SUBSCRIPTION',
              email: user.email,
              description: `Local subscription shows active but end date (${endDate.toLocaleDateString()}) has passed`
            });
          }
        }
        
      } else if (hasStripeSubscription && !hasLocalSubscription) {
        stripeOnlyUsers++;
        syncIssues.push({
          type: 'STRIPE_WITHOUT_LOCAL',
          email: user.email,
          description: 'User has active Stripe subscription but no local subscription record'
        });
        
      } else if (!hasStripeSubscription && hasLocalSubscription) {
        localOnlyUsers++;
        syncIssues.push({
          type: 'LOCAL_WITHOUT_STRIPE',
          email: user.email,
          description: `User has local ${user.plan_name} subscription but no Stripe subscription`
        });
        
      } else {
        freeUsers++;
      }
    }

    return new Response(JSON.stringify({
      sync_analysis: {
        total_users: users.length,
        synced_users: syncedUsers,
        stripe_only: stripeOnlyUsers,
        local_only: localOnlyUsers,
        free_users: freeUsers
      },
      sync_issues: syncIssues,
      checked_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Sync check error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to check sync status: ' + error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Admin: Migrate database schema (add missing columns)
async function handleAdminMigrateDatabase(request, env, corsHeaders) {
  try {
    console.log('Starting database migration...');

    let migrationResults = [];
    
    // Check if is_event column exists in user_tasks table
    try {
      const testStmt = env.DB.prepare('SELECT is_event FROM user_tasks LIMIT 1');
      await testStmt.first();
      migrationResults.push({
        migration: 'is_event column',
        status: 'EXISTS',
        message: 'Column already exists, no migration needed'
      });
    } catch (error) {
      // Column doesn't exist, add it
      try {
        const alterStmt = env.DB.prepare('ALTER TABLE user_tasks ADD COLUMN is_event INTEGER DEFAULT 0');
        await alterStmt.run();
        migrationResults.push({
          migration: 'is_event column',
          status: 'ADDED',
          message: 'Successfully added is_event column to user_tasks table'
        });
        console.log('✅ Added is_event column to user_tasks table');
      } catch (alterError) {
        migrationResults.push({
          migration: 'is_event column',
          status: 'FAILED',
          message: 'Failed to add is_event column: ' + alterError.message
        });
        console.error('❌ Failed to add is_event column:', alterError);
      }
    }

    return new Response(JSON.stringify({
      message: 'Database migration completed',
      migrations: migrationResults,
      migrated_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Database migration error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to migrate database: ' + error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Payments: Create checkout session
async function handleCreateCheckoutSession(request, env, corsHeaders) {
  try {
    console.log('Creating checkout session...');
    console.log('Environment check - STRIPE_SECRET_KEY exists:', !!env.STRIPE_SECRET_KEY);
    console.log('Environment check - STRIPE_PRICE_ID exists:', !!env.STRIPE_PRICE_ID);
    
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    
    // Get customer email from request (optional)
    const body = await request.json().catch(() => ({}));
    const customerEmail = body.email;
    console.log('Customer email provided:', customerEmail || 'none');
    
    // Create checkout session
    const sessionConfig = {
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'HyperFiler Pro (Lifetime)',
              description: 'One-time payment for lifetime Pro access'
            },
            unit_amount: 4998, // €49.98 in cents
          },
          quantity: 1,
        },
      ],
      success_url: 'https://hyperfiler.pro/success.html',
      cancel_url: 'https://hyperfiler.pro/frontend/upgrade-compare.html',
      metadata: {
        source: 'hyperfiler_pro'
      },
      payment_intent_data: {
        metadata: {
          source: 'hyperfiler_pro'
        }
      }
    };

    // Only add customer_email if it's a valid email
    if (customerEmail && customerEmail.trim() && customerEmail.includes('@')) {
      sessionConfig.customer_email = customerEmail.trim();
      console.log('✅ Using customer email:', customerEmail);
    } else {
      console.log('🔄 No valid customer email provided, Stripe will collect it');
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return new Response(JSON.stringify({
      id: session.id,
      url: session.url
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Create checkout session error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create checkout session',
      details: error.message,
      stripe_error: error.type || 'unknown',
      stripe_code: error.code || 'unknown'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Payments: Create customer portal session
async function handleCustomerPortal(request, env, corsHeaders) {
  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    
    // Get customer email from request
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find user's Stripe customer ID from database
    const userStmt = env.DB.prepare('SELECT id FROM users WHERE email = ?');
    const user = await userStmt.bind(email).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const subStmt = env.DB.prepare('SELECT stripe_customer_id FROM user_subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1');
    const subscription = await subStmt.bind(user.id).first();
    
    if (!subscription || !subscription.stripe_customer_id) {
      return new Response(JSON.stringify({ error: 'No active subscription found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: 'https://hyperfiler.pro/frontend/hyperfiler-pro.html',
    });

    return new Response(JSON.stringify({
      success: true,
      portal_url: session.url
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Customer portal error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create customer portal session',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Promo: Redeem promo code
async function handlePromoRedeem(request, env, corsHeaders) {
  try {
    const { email, code } = await request.json();
    
    if (!email || !code) {
      return new Response(JSON.stringify({ error: 'Email and promo code are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if promo code exists and is valid
    const promoStmt = env.DB.prepare(`
      SELECT * FROM promo_codes 
      WHERE code = ? AND active = 1 
      AND (expires_at IS NULL OR expires_at > datetime('now'))
      AND (max_uses = -1 OR current_uses < max_uses)
    `);
    const promo = await promoStmt.bind(code.toUpperCase()).first();
    
    if (!promo) {
      return new Response(JSON.stringify({ error: 'Invalid or expired promo code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user already exists
    const userStmt = env.DB.prepare('SELECT id FROM users WHERE email = ?');
    let user = await userStmt.bind(email).first();
    
    let userId;
    let newPassword = null;
    
    if (user) {
      userId = user.id;
    } else {
      // Create new user with temporary password
      newPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-2);
      const hashedPassword = await hashPassword(newPassword);
      userId = crypto.randomUUID();
      
      const createUserStmt = env.DB.prepare(`
        INSERT INTO users (id, email, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `);
      await createUserStmt.bind(userId, email, hashedPassword).run();
    }

    // Calculate trial end date
    const trialEndDate = new Date();
    trialEndDate.setMonth(trialEndDate.getMonth() + promo.months);
    
    // Create or update subscription
    const subscriptionId = crypto.randomUUID();
    const subStmt = env.DB.prepare(`
      INSERT OR REPLACE INTO user_subscriptions 
      (id, user_id, plan_name, status, current_period_start, current_period_end, created_at, updated_at)
      VALUES (?, ?, 'pro', 'active', datetime('now'), ?, datetime('now'), datetime('now'))
    `);
    await subStmt.bind(subscriptionId, userId, trialEndDate.toISOString()).run();

    // Update promo code usage
    const updatePromoStmt = env.DB.prepare('UPDATE promo_codes SET current_uses = current_uses + 1 WHERE code = ?');
    await updatePromoStmt.bind(code.toUpperCase()).run();

    // Send email for new accounts or confirmation for existing accounts
    let emailResult = { success: false };
    if (newPassword) {
      // New account - send promo email with credentials
      const emailHtml = await generatePromoEmailHTML(
        email, 
        newPassword, 
        code.toUpperCase(), 
        promo.months, 
        trialEndDate.toLocaleDateString(),
        null, // No stripe customer ID yet for new promo accounts
        env
      );
      emailResult = await sendEmail(
        env, 
        email, 
        `🎉 Your HyperFiler Pro Account is Ready! (${promo.months} months free)`, 
        emailHtml
      );
    }

    // Response message
    const message = user 
      ? `Promo code redeemed! Your account now has Pro access for ${promo.months} months.`
      : `Account created with Pro access for ${promo.months} months! Check your email for login details.`;
    
    return new Response(JSON.stringify({ 
      success: true,
      message: message,
      trialEnd: trialEndDate.toLocaleDateString(),
      newPassword: newPassword, // Only for new accounts
      months: promo.months,
      email_sent: emailResult.success,
      email_id: emailResult.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Promo redeem error:', error);
    return new Response(JSON.stringify({ error: 'Failed to redeem promo code' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Stripe webhook handler
async function handleStripeWebhook(request, env, corsHeaders) {
  try {
    console.log('Webhook received - checking environment variables...');
    
    if (!env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not found in environment');
      return new Response(JSON.stringify({ error: 'Missing Stripe configuration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET not found in environment');
      return new Response(JSON.stringify({ error: 'Missing webhook secret' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const sig = request.headers.get('stripe-signature');
    
    if (!sig) {
      console.error('No Stripe signature header found');
      return new Response(JSON.stringify({ error: 'Missing signature header' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await request.text();
    console.log('Webhook body length:', body.length);
    console.log('Signature header present:', !!sig);

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, env.STRIPE_WEBHOOK_SECRET);
      console.log('Webhook signature verified successfully, event type:', event.type);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      console.error('Webhook secret length:', env.STRIPE_WEBHOOK_SECRET?.length || 0);
      return new Response(JSON.stringify({ error: 'Invalid signature', details: err.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle the event
    console.log(`Processing webhook event: ${event.type}`);
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.data.object, env);
          console.log('Successfully processed checkout.session.completed');
          break;
        
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object, env);
          console.log('Successfully processed customer.subscription.updated');
          break;
        
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object, env);
          console.log('Successfully processed customer.subscription.deleted');
          break;
        
        case 'customer.updated':
          await handleCustomerUpdated(event.data.object, env);
          console.log('Successfully processed customer.updated');
          break;
        
        case 'invoice.payment_succeeded':
          await handlePaymentSucceeded(event.data.object, env);
          console.log('Successfully processed invoice.payment_succeeded');
          break;
        
        case 'invoice.payment_failed':
          await handlePaymentFailed(event.data.object, env);
          console.log('Successfully processed invoice.payment_failed');
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (handlerError) {
      console.error(`Error processing webhook event ${event.type}:`, handlerError);
      // Still return success to Stripe to avoid retries for handler-specific errors
      // You might want to implement dead letter queue or different handling here
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Handle successful checkout
async function handleCheckoutCompleted(session, env) {
  try {
    console.log('🔥 WEBHOOK CHECKOUT COMPLETED:', JSON.stringify(session, null, 2));
    const customerEmail = session.customer_details?.email;
    if (!customerEmail) {
      console.error('No customer email in checkout session');
      return;
    }
    console.log('📧 Processing checkout for email:', customerEmail, 'mode:', session.mode);

    // Check if user exists
    const userStmt = env.DB.prepare('SELECT id FROM users WHERE email = ?');
    let user = await userStmt.bind(customerEmail).first();
    
    let userId;
    let newPassword = null;
    
    if (!user) {
      // Create new user with temporary password
      newPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-2);
      const hashedPassword = await hashPassword(newPassword);
      userId = crypto.randomUUID();
      
      const createUserStmt = env.DB.prepare(`
        INSERT INTO users (id, email, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `);
      await createUserStmt.bind(userId, customerEmail, hashedPassword).run();
    } else {
      userId = user.id;
      
      // For one-time payments, always generate a new password (even for existing users)
      if (session.mode === 'payment') {
        newPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-2);
        const hashedPassword = await hashPassword(newPassword);
        
        const updatePasswordStmt = env.DB.prepare(`
          UPDATE users SET password_hash = ?, updated_at = datetime('now')
          WHERE id = ?
        `);
        await updatePasswordStmt.bind(hashedPassword, userId).run();
      }
    }

    // Create or update subscription record (handle both subscription and one-time payments)
    if (session.mode === 'subscription' && session.subscription) {
      // Traditional subscription payment
      const subscriptionStmt = env.DB.prepare(`
        INSERT OR REPLACE INTO user_subscriptions 
        (id, user_id, stripe_customer_id, stripe_subscription_id, plan_name, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `);
      
      await subscriptionStmt.bind(
        crypto.randomUUID(),
        userId,
        session.customer,
        session.subscription,
        'pro',
        'active'
      ).run();
            } else if (session.mode === 'payment') {
          // One-time payment - upgrade trial to pro or create new pro subscription
          const proStmt = env.DB.prepare(`
            INSERT OR REPLACE INTO user_subscriptions 
              (id, user_id, stripe_customer_id, stripe_subscription_id, plan_name, status, current_period_start, current_period_end, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now', '+100 years'), datetime('now'), datetime('now'))
          `);
          
          await proStmt.bind(
            crypto.randomUUID(),
            userId,
            session.customer,
            'lifetime_payment', // Use session ID instead of subscription ID
            'pro',
            'active'
          ).run();
          
          // Send thank you email for Pro upgrade
          console.log(`📧 Sending thank you email for Pro upgrade to ${user.email}`);
          const thankYouEmailResult = await sendThankYouEmail(user.email, env);
          
          if (thankYouEmailResult.success) {
            console.log(`✅ Thank you email sent successfully to ${user.email}`);
          } else {
            console.error(`❌ Failed to send thank you email to ${user.email}:`, thankYouEmailResult.error);
          }
        }

    // Send welcome email
    console.log(`📧 ABOUT TO SEND EMAIL: Session mode: ${session.mode}, newPassword: ${!!newPassword}, email: ${customerEmail}`);
    if (session.mode === 'payment') {
      // One-time payment - always send welcome email (with or without password)
      console.log('📧 SENDING welcome email for one-time payment...');
      try {
        const emailResult = await sendWelcomeEmail(customerEmail, newPassword, session.customer, env);
        console.log('📧 EMAIL RESULT:', JSON.stringify(emailResult, null, 2));
        if (!emailResult.success) {
          console.error('📧 EMAIL FAILED:', emailResult.error);
        }
      } catch (emailError) {
        console.error('📧 EMAIL EXCEPTION:', emailError);
      }
    } else if (newPassword) {
      // Subscription payment - only send email for new users
      console.log('📧 SENDING welcome email for new subscription user...');
      try {
        const emailResult = await sendWelcomeEmail(customerEmail, newPassword, session.customer, env);
        console.log('📧 EMAIL RESULT:', JSON.stringify(emailResult, null, 2));
      } catch (emailError) {
        console.error('📧 EMAIL EXCEPTION:', emailError);
      }
    } else {
      console.log('📧 NO EMAIL SENT - existing subscription user');
    }

    console.log(`Successfully processed checkout for ${customerEmail}`);
  } catch (error) {
    console.error('Error handling checkout completed:', error);
  }
}

// Get session details for password display
async function handleGetSessionDetails(sessionId, env, corsHeaders) {
  try {
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Session ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get session details from database
    const sessionStmt = env.DB.prepare(`
      SELECT email, password, created_at, expires_at
      FROM session_passwords 
      WHERE session_id = ? AND expires_at > ?
    `);
    const sessionData = await sessionStmt.bind(sessionId, new Date().toISOString()).first();
    
    if (!sessionData) {
      return new Response(JSON.stringify({ error: 'Session not found or expired' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      email: sessionData.email,
      password: sessionData.password,
      created_at: sessionData.created_at,
      expires_at: sessionData.expires_at
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get session details error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get session details' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription, env) {
  try {
    const updateStmt = env.DB.prepare(`
      UPDATE user_subscriptions 
      SET status = ?, updated_at = datetime('now')
      WHERE stripe_subscription_id = ?
    `);
    
    await updateStmt.bind(subscription.status, subscription.id).run();
    console.log(`Updated subscription ${subscription.id} to status: ${subscription.status}`);
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription, env) {
  try {
    const deleteStmt = env.DB.prepare(`
      UPDATE user_subscriptions 
      SET status = 'canceled', updated_at = datetime('now')
      WHERE stripe_subscription_id = ?
    `);
    
    await deleteStmt.bind(subscription.id).run();
    console.log(`Canceled subscription ${subscription.id}`);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

// Handle customer updates (email changes, etc.)
async function handleCustomerUpdated(customer, env) {
  try {
    const customerId = customer.id;
    const newEmail = customer.email;
    
    if (!newEmail) {
      console.log(`No email in customer update for ${customerId}`);
      return;
    }
    
    // Find user by stripe_customer_id
    const findUserStmt = env.DB.prepare(`
      SELECT u.id, u.email as current_email 
      FROM users u 
      JOIN user_subscriptions s ON u.id = s.user_id 
      WHERE s.stripe_customer_id = ?
    `);
    
    const user = await findUserStmt.bind(customerId).first();
    
    if (!user) {
      console.log(`No user found for stripe customer ${customerId}`);
      return;
    }
    
    // Check if email actually changed
    if (user.current_email === newEmail) {
      console.log(`Email unchanged for customer ${customerId}`);
      return;
    }
    
    // Update user email in local database
    const updateStmt = env.DB.prepare(`
      UPDATE users 
      SET email = ?, updated_at = datetime('now') 
      WHERE id = ?
    `);
    
    await updateStmt.bind(newEmail, user.id).run();
    
    console.log(`Updated user ${user.id} email from ${user.current_email} to ${newEmail}`);
    
  } catch (error) {
    console.error('Error handling customer update:', error);
  }
}

// Handle successful payment
async function handlePaymentSucceeded(invoice, env) {
  try {
    // Update subscription status to active on successful payment
    if (invoice.subscription) {
      const updateStmt = env.DB.prepare(`
        UPDATE user_subscriptions 
        SET status = 'active', updated_at = datetime('now')
        WHERE stripe_subscription_id = ?
      `);
      
      await updateStmt.bind(invoice.subscription).run();
      console.log(`Payment succeeded for subscription ${invoice.subscription}`);
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}


// ===== LISTS SYNC FUNCTIONS (Same ultra-simple pattern as tasks) =====

async function handleListsSyncSimple(request, env, corsHeaders) {
  try {
    const token = getAuthToken(request);
    const payload = await verifyToken(token, env.JWT_SECRET || 'default-secret-key');
    
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { userId, listSections } = await request.json();
    
    if (!listSections || !Array.isArray(listSections)) {
      return new Response(JSON.stringify({ error: 'Invalid listSections data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Ensure user can only sync their own lists
    if (userId !== payload.userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const actualUserId = payload.userId;
    
    // SIMPLE SYNC: Delete all existing lists for user, then insert all new lists
    console.log('🚀 SIMPLE LISTS SYNC: Replacing all lists for user:', actualUserId);
    
    // Delete all existing lists
    await env.DB.prepare('DELETE FROM user_lists WHERE user_id = ?')
      .bind(actualUserId)
      .run();
    
    // Insert all listSections as a single JSON record (ultra-simple approach)
    const stmt = env.DB.prepare(`
      INSERT INTO user_lists 
      (user_id, list_data, created_at, updated_at)
      VALUES (?, ?, datetime('now'), datetime('now'))
    `);
    
    await stmt.bind(
      actualUserId,
      JSON.stringify(listSections) // Store entire listSections array as JSON
    ).run();

    return new Response(JSON.stringify({ 
      success: true, 
      synced: listSections.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Simple lists sync error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleGetLists(userId, request, env, corsHeaders) {
  try {
    const token = getAuthToken(request);
    const payload = await verifyToken(token, env.JWT_SECRET || 'default-secret-key');
    
    if (!payload || payload.userId !== userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('📥 SIMPLE LISTS SYNC: Getting all lists for user:', userId);
    
    const { results } = await env.DB.prepare(`
      SELECT list_data FROM user_lists 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).bind(userId).all();

    // Parse the JSON data back to listSections format
    let listSections = [];
    if (results.length > 0 && results[0].list_data) {
      listSections = JSON.parse(results[0].list_data);
    }

    return new Response(JSON.stringify({ 
      listSections: listSections 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get lists error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// ===== TEMPLATES SYNC FUNCTIONS (Same ultra-simple pattern as tasks and lists) =====

async function handleTemplatesSyncSimple(request, env, corsHeaders) {
  try {
    const token = getAuthToken(request);
    const payload = await verifyToken(token, env.JWT_SECRET || 'default-secret-key');
    
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { userId, templates } = await request.json();
    
    if (!templates || !Array.isArray(templates)) {
      return new Response(JSON.stringify({ error: 'Invalid templates data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Ensure user can only sync their own templates
    if (userId !== payload.userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const actualUserId = payload.userId;
    
    // SIMPLE SYNC: Delete all existing templates for user, then insert all new templates
    console.log('🚀 SIMPLE TEMPLATES SYNC: Replacing all templates for user:', actualUserId);
    
    // Delete all existing templates
    await env.DB.prepare('DELETE FROM user_templates WHERE user_id = ?')
      .bind(actualUserId)
      .run();
    
    // Insert all templates as a single JSON record (ultra-simple approach)
    const stmt = env.DB.prepare(`
      INSERT INTO user_templates 
      (user_id, templates_data, created_at, updated_at)
      VALUES (?, ?, datetime('now'), datetime('now'))
    `);
    
    await stmt.bind(
      actualUserId,
      JSON.stringify(templates) // Store entire templates array as JSON
    ).run();

    return new Response(JSON.stringify({ 
      success: true, 
      synced: templates.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Simple templates sync error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleGetTemplates(userId, request, env, corsHeaders) {
  try {
    const token = getAuthToken(request);
    const payload = await verifyToken(token, env.JWT_SECRET || 'default-secret-key');
    
    if (!payload || payload.userId !== userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('📥 SIMPLE TEMPLATES SYNC: Getting all templates for user:', userId);
    
    const { results } = await env.DB.prepare(`
      SELECT templates_data FROM user_templates 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).bind(userId).all();

    // Parse the JSON data back to templates format
    let templates = [];
    if (results.length > 0 && results[0].templates_data) {
      templates = JSON.parse(results[0].templates_data);
    }

    return new Response(JSON.stringify({ 
      templates: templates 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get templates error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice, env) {
  try {
    // Update subscription status on failed payment
    if (invoice.subscription) {
      const updateStmt = env.DB.prepare(`
        UPDATE user_subscriptions 
        SET status = 'past_due', updated_at = datetime('now')
        WHERE stripe_subscription_id = ?
      `);
      
      await updateStmt.bind(invoice.subscription).run();
      console.log(`Payment failed for subscription ${invoice.subscription}`);
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Admin Stripe Management Functions
async function handleAdminStripeSubscriptionDetails(email, request, env, corsHeaders) {
  try {
    // Authentication is now handled by requireAdminAuth wrapper

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    
    // Get user's subscription from database
    const userStmt = env.DB.prepare('SELECT id FROM users WHERE email = ?');
    const user = await userStmt.bind(email).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const subStmt = env.DB.prepare('SELECT * FROM user_subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1');
    const subscription = await subStmt.bind(user.id).first();
    
    if (!subscription || !subscription.stripe_subscription_id) {
      return new Response(JSON.stringify({ error: 'No Stripe subscription found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get subscription details from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
    
    return new Response(JSON.stringify({
      local_subscription: subscription,
      stripe_subscription: stripeSubscription
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Admin Stripe subscription details error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get subscription details',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleAdminStripeSubscriptionPause(email, request, env, corsHeaders) {
  try {
    // Authentication is now handled by requireAdminAuth wrapper

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    
    // Get user's subscription
    const userStmt = env.DB.prepare('SELECT id FROM users WHERE email = ?');
    const user = await userStmt.bind(email).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const subStmt = env.DB.prepare('SELECT * FROM user_subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1');
    const subscription = await subStmt.bind(user.id).first();
    
    if (!subscription?.stripe_subscription_id) {
      return new Response(JSON.stringify({ error: 'No Stripe subscription found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Pause subscription in Stripe
    const pausedSubscription = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      pause_collection: {
        behavior: 'void'
      }
    });

    // Update local database
    const updateStmt = env.DB.prepare('UPDATE user_subscriptions SET status = ? WHERE stripe_subscription_id = ?');
    await updateStmt.bind('paused', subscription.stripe_subscription_id).run();

    return new Response(JSON.stringify({
      message: `Subscription paused for ${email}`,
      stripe_status: pausedSubscription.status
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Admin Stripe pause error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to pause subscription',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleAdminStripeSubscriptionResume(email, request, env, corsHeaders) {
  try {
    // Authentication is now handled by requireAdminAuth wrapper

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    
    // Get user's subscription
    const userStmt = env.DB.prepare('SELECT id FROM users WHERE email = ?');
    const user = await userStmt.bind(email).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const subStmt = env.DB.prepare('SELECT * FROM user_subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1');
    const subscription = await subStmt.bind(user.id).first();
    
    if (!subscription?.stripe_subscription_id) {
      return new Response(JSON.stringify({ error: 'No Stripe subscription found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Resume subscription in Stripe
    const resumedSubscription = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      pause_collection: null
    });

    // Update local database
    const updateStmt = env.DB.prepare('UPDATE user_subscriptions SET status = ? WHERE stripe_subscription_id = ?');
    await updateStmt.bind('active', subscription.stripe_subscription_id).run();

    return new Response(JSON.stringify({
      message: `Subscription resumed for ${email}`,
      stripe_status: resumedSubscription.status
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Admin Stripe resume error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to resume subscription',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleAdminStripeSubscriptionCancel(email, request, env, corsHeaders) {
  try {
    // Authentication is now handled by requireAdminAuth wrapper

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    
    // Get user's subscription
    const userStmt = env.DB.prepare('SELECT id FROM users WHERE email = ?');
    const user = await userStmt.bind(email).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const subStmt = env.DB.prepare('SELECT * FROM user_subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1');
    const subscription = await subStmt.bind(user.id).first();
    
    if (!subscription?.stripe_subscription_id) {
      return new Response(JSON.stringify({ error: 'No Stripe subscription found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Cancel subscription in Stripe
    const canceledSubscription = await stripe.subscriptions.cancel(subscription.stripe_subscription_id);

    // Update local database
    const updateStmt = env.DB.prepare('UPDATE user_subscriptions SET status = ? WHERE stripe_subscription_id = ?');
    await updateStmt.bind('canceled', subscription.stripe_subscription_id).run();

    return new Response(JSON.stringify({
      message: `Subscription canceled for ${email}`,
      stripe_status: canceledSubscription.status
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Admin Stripe cancel error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to cancel subscription',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleAdminStripeCustomerPortal(email, request, env, corsHeaders) {
  try {
    // Authentication is now handled by requireAdminAuth wrapper

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    
    // Get user's Stripe customer ID
    const userStmt = env.DB.prepare('SELECT id FROM users WHERE email = ?');
    const user = await userStmt.bind(email).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const subStmt = env.DB.prepare('SELECT stripe_customer_id FROM user_subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1');
    const subscription = await subStmt.bind(user.id).first();
    
    if (!subscription?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: 'No Stripe customer found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: 'https://hyperfiler.pro/frontend/hyperfiler-pro.html',
    });

    return new Response(JSON.stringify({
      url: session.url,
      customer_id: subscription.stripe_customer_id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Admin Stripe portal error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create customer portal',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Send welcome email for new Stripe customers
async function sendWelcomeEmail(email, password, stripeCustomerId, env) {
  try {
    const emailHtml = await generatePromoEmailHTML(
      email, 
      password, 
      'Welcome to HyperFiler Pro!',
      'Unlimited',
      'active',
      stripeCustomerId,
      env
    );
    
    const emailResult = await sendEmail(
      env,
      email, 
      '🎉 Welcome to HyperFiler Pro - Your Account is Ready!',
      emailHtml
    );
    
    if (emailResult.success) {
      console.log(`Welcome email sent successfully to ${email}`);
    } else {
      console.error(`Failed to send welcome email to ${email}:`, emailResult.error);
    }
    
    return emailResult;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
}

// Test function to debug customer portal creation
async function handleTestCustomerPortal(request, env, corsHeaders) {
  try {
    const { customerId } = await request.json();
    
    if (!customerId) {
      return new Response(JSON.stringify({ error: 'customerId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Testing customer portal creation for customer:', customerId);
    
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: 'https://hyperfiler.pro/frontend/hyperfiler-pro.html',
      });
      
      console.log('Customer portal URL created successfully:', session.url);
      
      return new Response(JSON.stringify({ 
        success: true, 
        portal_url: session.url,
        customer_id: customerId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    } catch (stripeError) {
      console.error('Stripe customer portal creation failed:', stripeError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Stripe portal creation failed',
        details: stripeError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error('Test customer portal error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Test failed',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Test function to simulate new customer welcome email
async function handleTestWelcomeEmail(request, env, corsHeaders) {
  try {
    const { email, customerId } = await request.json();
    
    if (!email || !customerId) {
      return new Response(JSON.stringify({ error: 'email and customerId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Testing welcome email for new customer:', email, 'customerId:', customerId);
    
    // Generate a test password
    const testPassword = 'test-' + Math.random().toString(36).slice(-8);
    
    // Call the sendWelcomeEmail function
    const result = await sendWelcomeEmail(email, testPassword, customerId, env);
    
    return new Response(JSON.stringify({ 
      success: true, 
      email_sent: result.success,
      email_id: result.id,
      test_password: testPassword,
      customer_id: customerId,
      message: 'Welcome email test completed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Test welcome email error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Test failed',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Admin authentication functions
async function handleAdminLogin(request, env, corsHeaders) {
  try {
    const { username, password } = await request.json();
    
    const adminUsername = env.ADMIN_USERNAME;
    const adminPasswordHash = env.ADMIN_PASSWORD_HASH;
    
    if (!adminUsername || !adminPasswordHash) {
      console.error('Admin credentials not configured in environment');
      return new Response(JSON.stringify({ error: 'Admin authentication not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Login attempt:', { 
      receivedUsername: username, 
      receivedPasswordLength: password.length,
      envUsernameLength: adminUsername?.length,
      envPasswordHashLength: adminPasswordHash?.length
    });
    
    // Verify username and password separately for better security
    if (username !== adminUsername) {
      console.log('Admin login failed - invalid username');
      return new Response(JSON.stringify({ error: 'Invalid admin credentials' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Verify password using secure hash comparison
    const isPasswordValid = await verifyPassword(password, adminPasswordHash);
    if (!isPasswordValid) {
      console.log('Admin login failed - invalid password');
      return new Response(JSON.stringify({ error: 'Invalid admin credentials' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Create admin session
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Store session in database with better error handling
    try {
      // Ensure table exists first
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS admin_sessions (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `).run();
      
      console.log('Creating session:', { sessionId, username, expiresAt: expiresAt.toISOString() });
      
      // Use INSERT OR REPLACE to handle any conflicts
      const stmt = env.DB.prepare(`
        INSERT OR REPLACE INTO admin_sessions (id, username, expires_at, created_at) 
        VALUES (?, ?, ?, datetime('now'))
      `);
      const result = await stmt.bind(sessionId, username, expiresAt.toISOString()).run();
      console.log('Session creation result:', result);
      
      // Verify the session was created
      const verifyStmt = env.DB.prepare('SELECT * FROM admin_sessions WHERE id = ?');
      const verifyResult = await verifyStmt.bind(sessionId).first();
      console.log('Session verification after creation:', verifyResult);
      
      if (!verifyResult) {
        console.error('Session was not saved to database!');
        return new Response(JSON.stringify({ error: 'Session creation failed - not saved' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
    } catch (dbError) {
      console.error('Failed to create admin session:', dbError);
      return new Response(JSON.stringify({ error: 'Failed to create session: ' + dbError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Admin login successful for username:', username);
    
    return new Response(JSON.stringify({ 
      success: true, 
      session_id: sessionId,
      expires_at: expiresAt.toISOString(),
      message: 'Admin login successful'
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Set-Cookie': `admin_session=${sessionId}; SameSite=Lax; Max-Age=${24 * 60 * 60}; Path=/`
      }
    });
    
  } catch (error) {
    console.error('Admin login error:', error);
    return new Response(JSON.stringify({ error: 'Admin login failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleAdminLogout(request, env, corsHeaders) {
  try {
    const sessionId = getAdminSessionId(request);
    
    if (sessionId) {
      // Remove session from database
      const stmt = env.DB.prepare('DELETE FROM admin_sessions WHERE id = ?');
      await stmt.bind(sessionId).run();
    }
    
    return new Response(JSON.stringify({ success: true, message: 'Admin logout successful' }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Set-Cookie': 'admin_session=; SameSite=Lax; Max-Age=0; Path=/'
      }
    });
    
  } catch (error) {
    console.error('Admin logout error:', error);
    return new Response(JSON.stringify({ error: 'Admin logout failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleDebugSession(request, env, corsHeaders) {
  try {
    const sessionId = getAdminSessionId(request);
    
    // Check all sessions in database
    const allSessionsStmt = env.DB.prepare('SELECT * FROM admin_sessions ORDER BY created_at DESC LIMIT 10');
    const allSessions = await allSessionsStmt.all();
    
    const debugInfo = {
      receivedSessionId: sessionId,
      cookieHeader: request.headers.get('Cookie'),
      allSessions: allSessions.results || [],
      currentTime: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(debugInfo, null, 2), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Debug session error:', error);
    return new Response(JSON.stringify({ error: 'Debug failed', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleFixSession(request, env, corsHeaders) {
  try {
    const sessionId = getAdminSessionId(request);
    
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'No session cookie found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Create session with current cookie ID
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Ensure table exists
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `).run();
    
    // Insert or replace session
    const stmt = env.DB.prepare(`
      INSERT OR REPLACE INTO admin_sessions (id, username, expires_at, created_at) 
      VALUES (?, ?, ?, datetime('now'))
    `);
    await stmt.bind(sessionId, 'admin', expiresAt.toISOString()).run();
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Session created',
      sessionId: sessionId,
      expiresAt: expiresAt.toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Fix session error:', error);
    return new Response(JSON.stringify({ error: 'Fix failed', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleSecureAdminPanel(request, env, corsHeaders) {
  try {
    const sessionId = getAdminSessionId(request);
    console.log('Admin panel access attempt:', {
      sessionId: sessionId,
      cookies: request.headers.get('Cookie')
    });
    
    if (!sessionId) {
      console.log('No session ID found, showing login form');
      return new Response(generateAdminLoginHTML(), {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      });
    }
    
    const isValidSession = await verifyAdminSession(sessionId, env);
    console.log('Session verification result:', isValidSession);
    
    if (!isValidSession) {
      console.log('Invalid session, showing login form');
      return new Response(generateAdminLoginHTML(), {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      });
    }
    
    console.log('Valid session found, showing admin panel');
    // Return full admin panel if authenticated
    return new Response(await generateSecureAdminHTML(env), {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' }
    });
    
  } catch (error) {
    console.error('Secure admin panel error:', error);
    return new Response(JSON.stringify({ error: 'Admin panel error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

function getAdminSessionId(request) {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith('admin_session='));
  
  return sessionCookie ? sessionCookie.split('=')[1] : null;
}

async function requireAdminAuth(request, env, handler, corsHeaders) {
  const sessionId = getAdminSessionId(request);
  console.log('=== ADMIN AUTH DEBUG ===');
  console.log('Request URL:', request.url);
  console.log('Request headers Cookie:', request.headers.get('Cookie'));
  console.log('All request headers:', [...request.headers.entries()]);
  console.log('Extracted sessionId:', sessionId);
  
  if (!sessionId) {
    console.log('No session ID found');
    return new Response(JSON.stringify({ error: 'Admin authentication required - no session' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  const isValid = await verifyAdminSession(sessionId, env);
  console.log('Session validation result:', isValid);
  
  if (!isValid) {
    console.log('Session validation failed');
    return new Response(JSON.stringify({ error: 'Admin authentication required - invalid session' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  console.log('Admin auth successful');
  return await handler();
}

async function verifyAdminSession(sessionId, env) {
  try {
    console.log('Verifying session ID:', sessionId);
    
    if (!sessionId || sessionId.trim() === '') {
      console.log('Empty or null session ID');
      return false;
    }
    
    // Ensure admin_sessions table exists
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS admin_sessions (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `).run();
    } catch (createError) {
      console.log('Table creation attempt (might already exist):', createError.message);
    }
    
    const stmt = env.DB.prepare('SELECT username, expires_at FROM admin_sessions WHERE id = ?');
    const result = await stmt.bind(sessionId).first();
    
    console.log('Database query result:', result);
    
    if (!result) {
      console.log('No session found in database for ID:', sessionId);
      
      // Let's check what sessions exist
      const allSessionsStmt = env.DB.prepare('SELECT id, username, expires_at FROM admin_sessions ORDER BY created_at DESC LIMIT 5');
      const allSessions = await allSessionsStmt.all();
      console.log('Recent sessions in DB:', allSessions.results || []);
      
      return false;
    }
    
    const expiresAt = new Date(result.expires_at);
    const now = new Date();
    console.log('Session expires at:', expiresAt);
    console.log('Current time:', now);
    console.log('Is expired?', expiresAt < now);
    
    if (expiresAt < now) {
      console.log('Session expired, cleaning up');
      // Session expired, clean it up
      const deleteStmt = env.DB.prepare('DELETE FROM admin_sessions WHERE id = ?');
      await deleteStmt.bind(sessionId).run();
      return false;
    }
    
    console.log('Session is valid');
    return true;
  } catch (error) {
    console.error('Admin session verification error:', error);
    return false;
  }
}

function generateAdminLoginHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - HyperFiler Pro</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            width: 100%;
            max-width: 400px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 40px 20px;
        }
        .header h1 {
            font-size: 2.2em;
            font-weight: 800;
            margin-bottom: 10px;
        }
        .form-section { padding: 40px; }
        .form-group { margin-bottom: 20px; }
        .form-group label {
            display: block;
            font-weight: 600;
            margin-bottom: 8px;
            color: #333;
        }
        .form-group input {
            width: 100%;
            padding: 15px;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            font-size: 1em;
            transition: all 0.3s ease;
        }
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .login-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 18px;
            border-radius: 10px;
            font-size: 1.1em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
            margin-bottom: 20px;
        }
        .login-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }
        .error { color: #dc3545; margin-top: 10px; text-align: center; }
        .loading { display: none; text-align: center; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Admin Login</h1>
            <p>Secure Admin Panel Access</p>
        </div>
        <div class="form-section">
            <div id="loading" class="loading">Authenticating...</div>
            <form id="admin-login-form">
                <div class="form-group">
                    <label for="username">Admin Username</label>
                    <input type="text" id="username" name="username" required>
                </div>
                <div class="form-group">
                    <label for="password">Admin Password</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="login-button">Access Admin Panel</button>
                <div id="error" class="error"></div>
            </form>
        </div>
    </div>
    <script>
        document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const loading = document.getElementById('loading');
            const error = document.getElementById('error');
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            loading.style.display = 'block';
            error.textContent = '';
            
            try {
                console.log('Making login request to:', window.location.origin + '/admin/login');
                console.log('Credentials:', { username, passwordLength: password.length });
                
                const response = await fetch(window.location.origin + '/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                console.log('Response status:', response.status);
                const result = await response.json();
                console.log('Response data:', result);
                
                if (response.ok && result.success) {
                    console.log('Login successful, reloading page');
                    alert('Login successful! Page will reload to show admin panel.');
                    window.location.reload(); // Reload to show admin panel
                } else {
                    console.error('Login failed:', result);
                    alert('Login failed: ' + (result.error || 'Unknown error'));
                    error.textContent = result.error || 'Login failed';
                }
            } catch (err) {
                console.error('Login error:', err);
                error.textContent = 'Network error. Please try again.';
            }
            
            loading.style.display = 'none';
        });
    </script>
</body>
</html>`;
}

async function generateSecureAdminHTML(env) {
  // Get user statistics for the admin panel
  const userCountStmt = env.DB.prepare('SELECT COUNT(*) as count FROM users');
  const userCountResult = await userCountStmt.first();
  const userCount = userCountResult?.count || 0;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure Admin Panel - HyperFiler Pro</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header h1 { font-size: 2em; font-weight: 800; }
        .logout-btn {
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .logout-btn:hover { background: rgba(255,255,255,0.3); }
        
        .tabs {
            display: flex;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }
        .tab-button {
            background: none;
            border: none;
            padding: 15px 25px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
            color: #666;
            border-bottom: 3px solid transparent;
        }
        .tab-button:hover {
            background: #e9ecef;
            color: #333;
        }
        .tab-button.active {
            background: #667eea;
            color: white;
            border-bottom: 3px solid #764ba2;
        }
        
        .tab-content {
            display: none;
            padding: 30px;
        }
        .tab-content.active {
            display: block;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            border: 1px solid #e9ecef;
        }
        .stat-number { font-size: 2.5em; font-weight: 800; color: #667eea; }
        .stat-label { color: #666; font-weight: 500; margin-top: 5px; }
        
        .users-list {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            margin-top: 20px;
        }
        .user-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border-bottom: 1px solid #e9ecef;
            background: white;
            margin-bottom: 10px;
            border-radius: 8px;
        }
        .user-info h4 { margin: 0; color: #333; }
        .user-info p { margin: 5px 0 0 0; color: #666; font-size: 0.9em; }
        
        .button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 0.9em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 2px;
        }
        .button:hover {
            transform: translateY(-1px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
        }
        .button.danger {
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
        }
        .button.success {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        }
        .button.warning {
            background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
            color: #212529;
        }
        .button.info {
            background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
        }
        .button.primary {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
        }
        .button.secondary {
            background: linear-gradient(135deg, #6c757d 0%, #545b62 100%);
        }
        .button.purple {
            background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%);
        }
        
        .action-panel {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid #e9ecef;
        }
        .action-panel h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 1.1em;
            font-weight: 600;
        }
        
        .form-input, .form-select {
            padding: 10px 15px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 0.95em;
            transition: all 0.3s ease;
            margin-right: 10px;
        }
        .form-input:focus, .form-select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        /* Autocomplete Styles */
        .autocomplete-container {
            position: relative;
            flex: 1;
            min-width: 250px;
        }
        
        .autocomplete-suggestions {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 2px solid #e9ecef;
            border-top: none;
            border-radius: 0 0 8px 8px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }
        
        .autocomplete-suggestions.show {
            display: block;
        }
        
        .suggestion-item {
            padding: 12px 15px;
            cursor: pointer;
            border-bottom: 1px solid #f8f9fa;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.2s ease;
        }
        
        .suggestion-item:hover {
            background: #f8f9fa;
        }
        
        .suggestion-item.selected {
            background: #667eea;
            color: white;
        }
        
        .suggestion-email {
            font-weight: 500;
        }
        
        .suggestion-badge {
            font-size: 0.8em;
            padding: 2px 8px;
            border-radius: 12px;
            font-weight: 600;
        }
        
        .badge-pro {
            background: #28a745;
            color: white;
        }
        
        .badge-free {
            background: #6c757d;
            color: white;
        }
        
        .form-row {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        .form-group {
            margin-bottom: 15px;
        }
        .button-group {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 10px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            font-weight: 600;
            margin-bottom: 8px;
            color: #333;
        }
        .form-group input, .form-group select {
            width: 100%;
            padding: 10px;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            font-size: 1em;
        }
        
        .loading {
            text-align: center;
            padding: 20px;
            color: #666;
        }
        
        .message {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        }
        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Secure Admin Panel</h1>
            <button onclick="logout()" class="logout-btn">Logout</button>
        </div>
        
        <div class="tabs">
            <button class="tab-button active" onclick="showTab('dashboard')">Dashboard</button>
            <button class="tab-button" onclick="showTab('users')">Users</button>
            <button class="tab-button" onclick="showTab('subscriptions')">Subscriptions</button>
            <button class="tab-button" onclick="showTab('promo-codes')">Promo Codes</button>
            <button class="tab-button" onclick="showTab('database')">Database</button>
        </div>
        
        <div id="dashboard" class="tab-content active">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${userCount}</div>
                    <div class="stat-label">Total Users</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">✅</div>
                    <div class="stat-label">Secure Authentication</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">🔐</div>
                    <div class="stat-label">Session Protected</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="session-count">-</div>
                    <div class="stat-label">Active Sessions</div>
                </div>
            </div>
        </div>
        
        <div id="users" class="tab-content">
            <div class="message success" id="users-success"></div>
            <div class="message error" id="users-error"></div>
            
            <!-- Quick User Actions -->
            <div class="action-panel">
                <h3>👤 Quick User Management</h3>
                <div class="form-group">
                    <div class="autocomplete-container">
                        <input type="email" id="user-email" placeholder="Type user email..." class="form-input" oninput="filterUsers(this)" autocomplete="off">
                        <div id="user-email-suggestions" class="autocomplete-suggestions"></div>
                    </div>
                </div>
                <div class="button-group">
                    <button class="button info" onclick="getUserDetails()">📋 Get Details</button>
                    <button class="button warning" onclick="resetUserPassword()">🔑 Reset Password</button>
                    <button class="button success" onclick="resendUserEmail()">📧 Resend Email</button>
                    <button class="button danger" onclick="deleteUserByEmail()">🗑️ Delete User</button>
                </div>
            </div>

            <!-- Create New User -->
            <div class="action-panel">
                <h3>➕ Create New User</h3>
                <div class="form-row">
                    <input type="email" id="new-user-email" placeholder="New user email..." class="form-input">
                    <select id="new-user-plan" class="form-select">
                        <option value="free">Free Plan</option>
                        <option value="pro">Pro Plan</option>
                    </select>
                    <input type="number" id="new-user-months" placeholder="Months" min="1" max="999" class="form-input" style="display: none;">
                    <button class="button primary" onclick="createUser()">➕ Create</button>
                </div>
            </div>

            <!-- User List -->
            <div class="action-panel">
                <h3>👥 All Users</h3>
                <button class="button" onclick="loadUsers()">🔄 Refresh Users</button>
                
                <div id="users-list" class="users-list">
                    <div class="loading">Click "Refresh Users" to load user data</div>
                </div>
            </div>
        </div>
        
        <div id="subscriptions" class="tab-content">
            <div class="message success" id="sub-success"></div>
            <div class="message error" id="sub-error"></div>
            
            <!-- Local Subscription Management -->
            <div class="action-panel">
                <h3>💰 Local Subscription Management</h3>
                <div class="form-row">
                    <div class="autocomplete-container">
                        <input type="email" id="sub-email" placeholder="Type user email..." class="form-input" oninput="filterUsers(this)" autocomplete="off">
                        <div id="sub-email-suggestions" class="autocomplete-suggestions"></div>
                    </div>
                    <input type="number" id="extend-months" placeholder="Months (999=lifetime)" min="1" class="form-input">
                    <button class="button success" onclick="extendSubscription()">⏰ Extend</button>
                    <button class="button danger" onclick="cancelSubscription()">❌ Cancel</button>
                </div>
            </div>

            <!-- Stripe Control Center -->
            <div class="action-panel">
                <h3>🔥 Stripe Control Center</h3>
                <div class="form-row">
                    <div class="autocomplete-container">
                        <input type="email" id="stripe-email" placeholder="Type user email..." class="form-input" oninput="filterUsers(this)" autocomplete="off">
                        <div id="stripe-email-suggestions" class="autocomplete-suggestions"></div>
                    </div>
                    <button class="button info" onclick="getStripeSubscription()">📊 Get Details</button>
                    <button class="button warning" onclick="pauseStripeSubscription()">⏸️ Pause</button>
                    <button class="button success" onclick="resumeStripeSubscription()">▶️ Resume</button>
                    <button class="button danger" onclick="cancelStripeSubscription()">❌ Cancel</button>
                    <button class="button purple" onclick="generateCustomerPortal()">🔗 Portal</button>
                </div>
            </div>
        </div>
        
        <div id="promo-codes" class="tab-content">
            <div class="message success" id="promo-success"></div>
            <div class="message error" id="promo-error"></div>
            
            <!-- Create Promo Code -->
            <div class="action-panel">
                <h3>🎁 Create Promo Code</h3>
                <div class="form-row">
                    <input type="text" id="promo-code" placeholder="PROMO CODE" class="form-input" style="text-transform: uppercase;">
                    <input type="number" id="promo-months" placeholder="Months" min="1" max="999" class="form-input">
                    <input type="text" id="promo-description" placeholder="Description..." class="form-input">
                    <button class="button primary" onclick="createPromoCode()">🎫 Create</button>
                    <button class="button secondary" onclick="loadPromoCodes()">👁️ View All</button>
                </div>
            </div>

            <!-- Promo Codes List -->
            <div class="action-panel">
                <h3>🎁 All Promo Codes</h3>
                <button class="button" onclick="loadPromoCodes()">🔄 Refresh Promo Codes</button>
                
                <div id="promo-list">
                    <div class="loading">Click "Refresh Promo Codes" to load data</div>
                </div>
            </div>
        </div>
        
        <div id="database" class="tab-content">
            <div class="message success" id="db-success"></div>
            <div class="message error" id="db-error"></div>
            
            <h3>Database Operations</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <button class="button" onclick="getDatabaseStatus()">Database Status</button>
                </div>
                <div class="stat-card">
                    <button class="button" onclick="analyzeDatabase()">Analyze Database</button>
                </div>
                <div class="stat-card">
                    <button class="button warning" onclick="checkSyncStatus()">🔄 Sync Check</button>
                </div>
                <div class="stat-card">
                    <button class="button" onclick="migrateDatabase()" style="background: #17a2b8; border-color: #17a2b8;">🔧 Migrate DB</button>
                </div>
            </div>
            
            <div id="db-results" style="margin-top: 20px;">
                <div class="loading">Select an operation above</div>
            </div>
        </div>
    </div>
    
    <script>
        function showTab(tabName) {
            // Hide all tab contents
            const contents = document.querySelectorAll('.tab-content');
            contents.forEach(content => content.classList.remove('active'));
            
            // Remove active class from all buttons
            const buttons = document.querySelectorAll('.tab-button');
            buttons.forEach(btn => btn.classList.remove('active'));
            
            // Show selected tab
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
        }
        
        async function apiCall(endpoint, method = 'GET', body = null) {
            try {
                const options = {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                };
                if (body) options.body = JSON.stringify(body);
                
                console.log('Making API call to:', endpoint, 'with credentials');
                const response = await fetch(window.location.origin + endpoint, options);
                console.log('Response status:', response.status);
                const result = await response.json();
                console.log('Response data:', result);
                return result;
            } catch (error) {
                console.error('API call failed:', error);
                return { error: 'Network error' };
            }
        }
        
        async function loadUsers() {
            const container = document.getElementById('users-list');
            container.innerHTML = '<div class="loading">Loading users...</div>';
            
            // Debug cookies
            console.log('All cookies:', document.cookie);
            console.log('Looking for admin_session cookie...');
            
            const result = await apiCall('/admin/users');
            
            if (result.error) {
                container.innerHTML = '<div class="loading">Error loading users: ' + result.error + '</div>';
                return;
            }
            
            if (!result.users || result.users.length === 0) {
                container.innerHTML = '<div class="loading">No users found</div>';
                return;
            }
            
            container.innerHTML = result.users.map(user => {
                const hasStripeCustomer = user.stripe_customer_id ? true : false;
                const hasStripeSubscription = user.stripe_subscription_id ? true : false;
                const hasLocalSubscription = user.subscription_status && user.subscription_status !== 'Free';
                
                let syncStatus = '';
                let syncColor = '';
                
                if (hasStripeSubscription && hasLocalSubscription) {
                    syncStatus = '🟢 SYNCED';
                    syncColor = '#28a745';
                } else if (hasStripeSubscription && !hasLocalSubscription) {
                    syncStatus = '🟡 STRIPE ONLY';
                    syncColor = '#ffc107';
                } else if (!hasStripeSubscription && hasLocalSubscription) {
                    syncStatus = '🔵 LOCAL ONLY';
                    syncColor = '#007bff';
                } else {
                    syncStatus = '⚪ FREE';
                    syncColor = '#6c757d';
                }
                
                return \`
                    <div class="user-item">
                        <div class="user-info">
                            <h4>\${user.email}</h4>
                            <p>Created: \${new Date(user.created_at).toLocaleDateString()}</p>
                            <p>Status: \${user.subscription_status || 'Free'}</p>
                            <p style="color: \${syncColor}; font-weight: 600; font-size: 0.85em;">\${syncStatus}</p>
                        </div>
                        <div>
                            <button class="button" onclick="viewUser('\${user.email}')">View</button>
                            <button class="button danger" onclick="confirmDeleteUser('\${user.email}', \${hasStripeSubscription})">Delete</button>
                        </div>
                    </div>
                \`;
            }).join('');
            
            // Also refresh autocomplete data
            loadAllUsers();
        }
        
        async function loadPromoCodes() {
            const container = document.getElementById('promo-list');
            container.innerHTML = '<div class="loading">Loading promo codes...</div>';
            
            const result = await apiCall('/admin/promo-codes');
            
            if (result.error) {
                container.innerHTML = '<div class="loading">Error: ' + result.error + '</div>';
                return;
            }
            
            if (!result.promo_codes || result.promo_codes.length === 0) {
                container.innerHTML = '<div class="loading">No promo codes found</div>';
                return;
            }
            
            // Display promo codes in a nice table format
            container.innerHTML = \`
                <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-top: 20px;">
                    <h4 style="margin-bottom: 15px; color: #333;">Active Promo Codes</h4>
                    \${result.promo_codes.map(promo => \`
                        <div style="background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px; border: 1px solid #e9ecef;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <div>
                                    <h5 style="margin: 0; color: #667eea; font-size: 1.1em;">\${promo.code}</h5>
                                    <span style="background: \${promo.active ? '#28a745' : '#dc3545'}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.8em; margin-left: 10px;">
                                        \${promo.active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div>
                                    <button class="button warning" onclick="togglePromoCode('\${promo.code}')" style="font-size: 0.8em; padding: 5px 10px; margin-right: 5px;">
                                        \${promo.active ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button class="button danger" onclick="deletePromoCode('\${promo.code}')" style="font-size: 0.8em; padding: 5px 10px;">
                                        Delete
                                    </button>
                                </div>
                            </div>
                            <p style="margin: 5px 0; color: #666;">\${promo.description}</p>
                            <small style="color: #999;">
                                📅 \${promo.months} month\${promo.months !== 1 ? 's' : ''} • 
                                📊 Used: \${promo.current_uses} times • 
                                📅 Created: \${new Date(promo.created_at).toLocaleDateString()}
                            </small>
                        </div>
                    \`).join('')}
                </div>
            \`;
        }
        
        async function getDatabaseStatus() {
            const container = document.getElementById('db-results');
            container.innerHTML = '<div class="loading">Getting database status...</div>';
            
            const result = await apiCall('/admin/database-status');
            
            if (result.error) {
                container.innerHTML = '<div class="loading">Error: ' + result.error + '</div>';
                return;
            }
            
            container.innerHTML = \`
                <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-top: 20px;">
                    <h4 style="margin-bottom: 15px; color: #333;">📊 Database Status</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef;">
                            <div style="font-size: 2em; font-weight: 800; color: #667eea;">\${result.total_tasks || 0}</div>
                            <div style="color: #666; font-weight: 500;">Total Tasks</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef;">
                            <div style="font-size: 2em; font-weight: 800; color: \${result.is_empty ? '#dc3545' : '#28a745'};">
                                \${result.is_empty ? '❌' : '✅'}
                            </div>
                            <div style="color: #666; font-weight: 500;">\${result.is_empty ? 'Empty Database' : 'Active Database'}</div>
                        </div>
                    </div>
                    <p style="margin-top: 15px; color: #666; font-style: italic;">
                        Database contains \${result.total_tasks} tasks across all users
                    </p>
                </div>
            \`;
        }
        
        async function checkSyncStatus() {
            const container = document.getElementById('db-results');
            container.innerHTML = '<div class="loading">Checking sync status between Local DB and Stripe...</div>';
            
            try {
                const result = await apiCall('/admin/sync-check');
                
                if (result.error) {
                    container.innerHTML = '<div class="loading">Error: ' + result.error + '</div>';
                    return;
                }
                
                const syncData = result.sync_analysis || {};
                const issues = result.sync_issues || [];
                
                container.innerHTML = \`
                    <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-top: 20px;">
                        <h4 style="margin-bottom: 15px; color: #333;">🔄 Sync Status Analysis</h4>
                        
                        <!-- Sync Summary -->
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
                            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef;">
                                <div style="font-size: 1.8em; font-weight: 800; color: #28a745;">\${syncData.synced_users || 0}</div>
                                <div style="color: #666; font-weight: 500;">🟢 Synced</div>
                            </div>
                            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef;">
                                <div style="font-size: 1.8em; font-weight: 800; color: #ffc107;">\${syncData.stripe_only || 0}</div>
                                <div style="color: #666; font-weight: 500;">🟡 Stripe Only</div>
                            </div>
                            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef;">
                                <div style="font-size: 1.8em; font-weight: 800; color: #007bff;">\${syncData.local_only || 0}</div>
                                <div style="color: #666; font-weight: 500;">🔵 Local Only</div>
                            </div>
                            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef;">
                                <div style="font-size: 1.8em; font-weight: 800; color: #dc3545;">\${issues.length || 0}</div>
                                <div style="color: #666; font-weight: 500;">⚠️ Issues</div>
                            </div>
                        </div>
                        
                        \${issues.length > 0 ? \`
                            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffeaa7; margin-bottom: 15px;">
                                <h5 style="margin-bottom: 10px; color: #856404;">⚠️ Sync Issues Found</h5>
                                \${issues.map(issue => \`
                                    <div style="margin-bottom: 10px; padding: 10px; background: white; border-radius: 5px;">
                                        <strong>\${issue.type}</strong>: \${issue.email}<br>
                                        <small style="color: #666;">\${issue.description}</small>
                                    </div>
                                \`).join('')}
                            </div>
                        \` : \`
                            <div style="background: #d4edda; padding: 15px; border-radius: 8px; border: 1px solid #c3e6cb;">
                                <h5 style="margin-bottom: 10px; color: #155724;">✅ All Users in Sync</h5>
                                <p style="margin: 0; color: #155724;">No sync discrepancies found. All users are properly synchronized between local database and Stripe.</p>
                            </div>
                        \`}
                    </div>
                \`;
            } catch (error) {
                console.error('Sync check display error:', error);
                container.innerHTML = '<div class="loading">Error formatting sync results: ' + error.message + '</div>';
            }
        }

        async function migrateDatabase() {
            const container = document.getElementById('db-results');
            container.innerHTML = '<div class="loading">Running database migrations...</div>';
            
            try {
                const result = await apiCall('/admin/migrate-database', 'POST');
                
                if (result.error) {
                    container.innerHTML = '<div class="loading">Error: ' + result.error + '</div>';
                    return;
                }
                
                const migrations = result.migrations || [];
                
                container.innerHTML = \`
                    <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-top: 20px;">
                        <h4 style="margin-bottom: 15px; color: #333;">🔧 Database Migration Results</h4>
                        
                        \${migrations.map(migration => \`
                            <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid \${
                                migration.status === 'ADDED' ? '#28a745' : 
                                migration.status === 'EXISTS' ? '#17a2b8' : '#dc3545'
                            };">
                                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                                    <span style="font-weight: 600; margin-right: 10px;">\${migration.migration}</span>
                                    <span style="
                                        background: \${migration.status === 'ADDED' ? '#28a745' : migration.status === 'EXISTS' ? '#17a2b8' : '#dc3545'};
                                        color: white;
                                        padding: 4px 8px;
                                        border-radius: 4px;
                                        font-size: 12px;
                                        font-weight: 600;
                                    ">\${migration.status}</span>
                                </div>
                                <div style="color: #666; font-size: 14px;">\${migration.message}</div>
                            </div>
                        \`).join('')}
                        
                        <div style="margin-top: 15px; padding: 10px; background: #d4edda; border-radius: 6px; color: #155724; font-size: 14px;">
                            ✅ Migration completed at \${new Date(result.migrated_at).toLocaleString()}
                        </div>
                    </div>
                \`;
            } catch (error) {
                console.error('Migration display error:', error);
                container.innerHTML = '<div class="loading">Error formatting migration results: ' + error.message + '</div>';
            }
        }

        async function analyzeDatabase() {
            const container = document.getElementById('db-results');
            container.innerHTML = '<div class="loading">Analyzing database...</div>';
            
            try {
                const result = await apiCall('/admin/analyze-database');
                
                if (result.error) {
                    container.innerHTML = '<div class="loading">Error: ' + result.error + '</div>';
                    return;
                }
            
            // Format the analysis data nicely
            const analysis = result.analysis || {};
            const duplicateTaskIds = result.duplicate_task_ids || [];
            const duplicateContent = result.duplicate_content || [];
            const tasksPerUser = result.tasks_per_user || [];
            
            container.innerHTML = \`
                <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-top: 20px;">
                    <h4 style="margin-bottom: 15px; color: #333;">🔍 Database Analysis</h4>
                    
                    <!-- Summary Cards -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
                        <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef;">
                            <div style="font-size: 1.8em; font-weight: 800; color: #667eea;">\${analysis.total_users || 0}</div>
                            <div style="color: #666; font-weight: 500;">Total Users</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef;">
                            <div style="font-size: 1.8em; font-weight: 800; color: #667eea;">\${analysis.total_tasks || 0}</div>
                            <div style="color: #666; font-weight: 500;">Total Tasks</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef;">
                            <div style="font-size: 1.8em; font-weight: 800; color: \${analysis.duplicate_task_ids > 0 ? '#dc3545' : '#28a745'};">\${analysis.duplicate_task_ids || 0}</div>
                            <div style="color: #666; font-weight: 500;">Duplicate Task IDs</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef;">
                            <div style="font-size: 1.8em; font-weight: 800; color: \${analysis.duplicate_content > 0 ? '#ffc107' : '#28a745'};">\${analysis.duplicate_content || 0}</div>
                            <div style="color: #666; font-weight: 500;">Duplicate Content</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef;">
                            <div style="font-size: 1.8em; font-weight: 800; color: #667eea;">\${analysis.users_with_tasks || 0}</div>
                            <div style="color: #666; font-weight: 500;">Active Users</div>
                        </div>
                    </div>
                    
                    <!-- Top Users -->
                    \${tasksPerUser.length > 0 ? \`
                        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 15px;">
                            <h5 style="margin-bottom: 10px; color: #333;">👑 Top Users by Task Count</h5>
                            \${tasksPerUser.slice(0, 5).map(user => \`
                                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f0f0f0;">
                                    <span style="color: #333;">\${user.email}</span>
                                    <span style="color: #667eea; font-weight: 600;">\${user.task_count} tasks</span>
                                </div>
                            \`).join('')}
                        </div>
                    \` : ''}
                    
                    <!-- Issues Found -->
                    \${duplicateTaskIds.length > 0 ? \`
                        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffeaa7; margin-bottom: 15px;">
                            <h5 style="margin-bottom: 10px; color: #856404;">⚠️ Duplicate Task IDs Found</h5>
                            <p style="margin: 0; color: #856404;">Found \${duplicateTaskIds.length} task IDs with duplicates. This may indicate sync issues.</p>
                        </div>
                    \` : ''}
                    
                    \${duplicateContent.length > 0 ? \`
                        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffeaa7;">
                            <h5 style="margin-bottom: 10px; color: #856404;">📋 Duplicate Content Found</h5>
                            <p style="margin: 0; color: #856404;">Found \${duplicateContent.length} instances of duplicate task content. Users may have created similar tasks.</p>
                        </div>
                    \` : ''}
                    
                    \${duplicateTaskIds.length === 0 && duplicateContent.length === 0 ? \`
                        <div style="background: #d4edda; padding: 15px; border-radius: 8px; border: 1px solid #c3e6cb;">
                            <h5 style="margin-bottom: 10px; color: #155724;">✅ Database Health Good</h5>
                            <p style="margin: 0; color: #155724;">No significant issues found. Database appears to be in good condition.</p>
                        </div>
                    \` : ''}
                </div>
            \`;
            } catch (error) {
                console.error('Database analysis display error:', error);
                container.innerHTML = '<div class="loading">Error formatting results: ' + error.message + '</div>';
            }
        }
        
        async function viewUser(email) {
            const result = await apiCall('/admin/users/' + encodeURIComponent(email));
            if (result.error) {
                alert('Error: ' + result.error);
            } else {
                const user = result.user;
                const subscription = result.subscription;
                
                let details = '👤 USER DETAILS\\n';
                details += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n';
                details += '📧 Email: ' + user.email + '\\n';
                details += '🆔 User ID: ' + user.id + '\\n';
                details += '📅 Created: ' + new Date(user.created_at).toLocaleString() + '\\n';
                details += '🔄 Updated: ' + new Date(user.updated_at).toLocaleString() + '\\n\\n';
                
                if (subscription) {
                    details += '💳 SUBSCRIPTION DETAILS\\n';
                    details += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n';
                    details += '📋 Plan: ' + (subscription.plan_name || 'free').toUpperCase() + '\\n';
                    details += '🟢 Status: ' + (subscription.status || 'active').toUpperCase() + '\\n';
                    
                    if (subscription.current_period_start) {
                        details += '📅 Period Start: ' + new Date(subscription.current_period_start).toLocaleString() + '\\n';
                    }
                    if (subscription.current_period_end) {
                        const endDate = new Date(subscription.current_period_end);
                        details += '📅 Period End: ' + endDate.toLocaleString() + '\\n';
                        
                        // Check if it's a lifetime subscription (year 2108)
                        if (endDate.getFullYear() > 2100) {
                            details += '♾️ Type: LIFETIME SUBSCRIPTION\\n';
                        }
                    }
                    
                    if (subscription.stripe_customer_id) {
                        details += '🔗 Stripe Customer: ' + subscription.stripe_customer_id + '\\n';
                    }
                    if (subscription.stripe_subscription_id) {
                        details += '🔗 Stripe Subscription: ' + subscription.stripe_subscription_id + '\\n';
                    }
                    
                    // Show sync status
                    const hasStripe = subscription.stripe_subscription_id ? true : false;
                    const hasLocal = subscription.plan_name && subscription.status && subscription.status !== 'Free';
                    
                    details += '\\n🔄 SYNC STATUS\\n';
                    details += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n';
                    if (hasStripe && hasLocal) {
                        details += '🟢 SYNCED (Local + Stripe data)\\n';
                    } else if (hasStripe && !hasLocal) {
                        details += '🟡 STRIPE ONLY (Missing local subscription data)\\n';
                    } else if (!hasStripe && hasLocal) {
                        details += '🔵 LOCAL ONLY (No Stripe billing connected)\\n';
                    } else {
                        details += '⚪ FREE USER (No subscription data)\\n';
                    }
                } else {
                    details += '💳 SUBSCRIPTION: Free Plan (No active subscription)\\n';
                    details += '\\n🔄 SYNC STATUS\\n';
                    details += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n';
                    details += '⚪ FREE USER (No subscription data)\\n';
                }
                
                alert(details);
            }
        }
        
        async function deleteUser(email) {
            confirmDeleteUser(email, false);
        }

        async function confirmDeleteUser(email, hasStripeSubscription) {
            let confirmMessage = 'Are you sure you want to delete user: ' + email + '?';
            
            if (hasStripeSubscription) {
                confirmMessage += '\\n\\n⚠️  WARNING: This user has an ACTIVE STRIPE SUBSCRIPTION!\\n';
                confirmMessage += '🔄 The system will attempt to cancel their Stripe subscription automatically.\\n';
                confirmMessage += '💰 Please verify the cancellation was successful in Stripe dashboard.\\n\\n';
                confirmMessage += 'Continue with deletion?';
            }
            
            if (!confirm(confirmMessage)) return;
            
            const result = await apiCall('/admin/users/' + encodeURIComponent(email), 'DELETE');
            if (result.error) {
                alert('Error: ' + result.error);
            } else {
                let message = 'User ' + email + ' deleted successfully';
                if (result.stripe_cancelled) {
                    message += '\\n✅ Stripe subscription cancelled automatically';
                } else if (result.stripe_warning) {
                    message += '\\n⚠️ ' + result.stripe_warning;
                }
                alert(message);
                loadUsers();
            }
        }

        async function getUserDetails() {
            const email = document.getElementById('user-email').value.trim();
            if (!email) {
                alert('Please enter user email');
                return;
            }

            const result = await apiCall('/admin/users/' + encodeURIComponent(email));
            if (result.error) {
                alert('Error: ' + result.error);
            } else {
                const user = result.user;
                const subscription = result.subscription;
                
                let details = '👤 USER DETAILS\\n';
                details += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n';
                details += '📧 Email: ' + user.email + '\\n';
                details += '🆔 User ID: ' + user.id + '\\n';
                details += '📅 Created: ' + new Date(user.created_at).toLocaleString() + '\\n';
                details += '🔄 Updated: ' + new Date(user.updated_at).toLocaleString() + '\\n\\n';
                
                if (subscription) {
                    details += '💳 SUBSCRIPTION DETAILS\\n';
                    details += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n';
                    details += '📋 Plan: ' + (subscription.plan_name || 'free').toUpperCase() + '\\n';
                    details += '🟢 Status: ' + (subscription.status || 'active').toUpperCase() + '\\n';
                    
                    if (subscription.current_period_start) {
                        details += '📅 Period Start: ' + new Date(subscription.current_period_start).toLocaleString() + '\\n';
                    }
                    if (subscription.current_period_end) {
                        const endDate = new Date(subscription.current_period_end);
                        details += '📅 Period End: ' + endDate.toLocaleString() + '\\n';
                        
                        // Check if it's a lifetime subscription (year 2108)
                        if (endDate.getFullYear() > 2100) {
                            details += '♾️ Type: LIFETIME SUBSCRIPTION\\n';
                        }
                    }
                    
                    if (subscription.stripe_customer_id) {
                        details += '🔗 Stripe Customer: ' + subscription.stripe_customer_id + '\\n';
                    }
                    if (subscription.stripe_subscription_id) {
                        details += '🔗 Stripe Subscription: ' + subscription.stripe_subscription_id + '\\n';
                    }
                    
                    // Show sync status
                    const hasStripe = subscription.stripe_subscription_id ? true : false;
                    const hasLocal = subscription.plan_name && subscription.status && subscription.status !== 'Free';
                    
                    details += '\\n🔄 SYNC STATUS\\n';
                    details += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n';
                    if (hasStripe && hasLocal) {
                        details += '🟢 SYNCED (Local + Stripe data)\\n';
                    } else if (hasStripe && !hasLocal) {
                        details += '🟡 STRIPE ONLY (Missing local subscription data)\\n';
                    } else if (!hasStripe && hasLocal) {
                        details += '🔵 LOCAL ONLY (No Stripe billing connected)\\n';
                    } else {
                        details += '⚪ FREE USER (No subscription data)\\n';
                    }
                } else {
                    details += '💳 SUBSCRIPTION: Free Plan (No active subscription)\\n';
                    details += '\\n🔄 SYNC STATUS\\n';
                    details += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n';
                    details += '⚪ FREE USER (No subscription data)\\n';
                }
                
                alert(details);
            }
        }

        async function resetUserPassword() {
            const email = document.getElementById('user-email').value.trim();
            if (!email) {
                alert('Please enter user email');
                return;
            }

            if (!confirm('Reset password for ' + email + '?')) return;

            const result = await apiCall('/admin/users/' + encodeURIComponent(email) + '/reset-password', 'POST');
            if (result.error) {
                alert('Error: ' + result.error);
            } else {
                alert('Password reset for ' + email + '\\nNew password: ' + result.new_password);
            }
        }

        async function resendUserEmail() {
            const email = document.getElementById('user-email').value.trim();
            if (!email) {
                alert('Please enter user email');
                return;
            }

            if (!confirm('Resend credentials email to ' + email + '?')) return;

            const result = await apiCall('/admin/users/' + encodeURIComponent(email) + '/resend-email', 'POST');
            if (result.error) {
                alert('Error: ' + result.error);
            } else {
                let message = 'Credentials email resent to ' + email;
                message += '\\nNew password: ' + result.new_password;
                message += '\\nEmail status: ' + result.email_status;
                if (result.email_sent) {
                    message += '\\n✅ Email delivered successfully!';
                } else {
                    message += '\\n📝 Email logged to console (check worker logs)';
                }
                alert(message);
            }
        }

        async function deleteUserByEmail() {
            const email = document.getElementById('user-email').value.trim();
            if (!email) {
                alert('Please enter user email');
                return;
            }

            if (!confirm('PERMANENTLY DELETE user ' + email + '? This cannot be undone!')) return;

            const result = await apiCall('/admin/users/' + encodeURIComponent(email), 'DELETE');
            if (result.error) {
                alert('Error: ' + result.error);
            } else {
                alert('User ' + email + ' deleted successfully');
                document.getElementById('user-email').value = '';
                loadUsers();
            }
        }

        async function createUser() {
            const email = document.getElementById('new-user-email').value.trim();
            const plan = document.getElementById('new-user-plan').value;
            const months = parseInt(document.getElementById('new-user-months').value) || 1;

            if (!email) {
                alert('Please enter user email');
                return;
            }

            if (plan === 'pro' && (!months || months < 1)) {
                alert('Please enter valid number of months for Pro plan');
                return;
            }

            if (!confirm('Create ' + plan + ' user account for ' + email + '?')) return;

            const requestBody = { email: email, plan: plan };
            if (plan === 'pro') {
                requestBody.months = months;
            }

            const result = await apiCall('/admin/users', 'POST', requestBody);
            if (result.error) {
                alert('Error: ' + result.error);
            } else {
                let message = 'User ' + email + ' created successfully';
                if (result.password) {
                    message += '\\nTemporary password: ' + result.password;
                }
                if (result.email_sent) {
                    message += '\\n✅ Welcome email sent successfully!';
                } else {
                    message += '\\n📝 Welcome email logged to console';
                }
                alert(message);
                
                // Clear form
                document.getElementById('new-user-email').value = '';
                document.getElementById('new-user-plan').value = 'free';
                document.getElementById('new-user-months').value = '';
                document.getElementById('new-user-months').style.display = 'none';
                
                loadUsers();
            }
        }

        // Subscription Management Functions
        async function extendSubscription() {
            const email = document.getElementById('sub-email').value.trim();
            const months = parseInt(document.getElementById('extend-months').value);

            if (!email || !months) {
                alert('Please enter user email and months');
                return;
            }

            if (!confirm('Extend subscription for ' + email + ' by ' + months + ' months?')) return;

            const result = await apiCall('/admin/users/' + encodeURIComponent(email) + '/extend', 'POST', { months: months });
            if (result.error) {
                alert('Error: ' + result.error);
            } else {
                alert('Success: ' + result.message);
                document.getElementById('sub-email').value = '';
                document.getElementById('extend-months').value = '';
            }
        }

        async function cancelSubscription() {
            const email = document.getElementById('sub-email').value.trim();
            if (!email) {
                alert('Please enter user email');
                return;
            }

            if (!confirm('Cancel subscription for ' + email + '?')) return;

            const result = await apiCall('/admin/users/' + encodeURIComponent(email) + '/cancel', 'POST');
            if (result.error) {
                alert('Error: ' + result.error);
            } else {
                alert('Success: ' + result.message);
                document.getElementById('sub-email').value = '';
            }
        }

        // Stripe Management Functions
        async function getStripeSubscription() {
            const email = document.getElementById('stripe-email').value.trim();
            if (!email) {
                alert('Please enter user email');
                return;
            }

            const result = await apiCall('/admin/stripe/subscription/' + encodeURIComponent(email));
            if (result.error) {
                alert('Error: ' + result.error);
            } else {
                alert('Stripe Subscription Details:\\n' + JSON.stringify(result, null, 2));
            }
        }

        async function pauseStripeSubscription() {
            const email = document.getElementById('stripe-email').value.trim();
            if (!email) {
                alert('Please enter user email');
                return;
            }

            if (!confirm('Pause Stripe subscription for ' + email + '?')) return;

            const result = await apiCall('/admin/stripe/subscription/' + encodeURIComponent(email) + '/pause', 'POST');
            if (result.error) {
                alert('Error: ' + result.error);
            } else {
                alert('Success: ' + result.message);
            }
        }

        async function resumeStripeSubscription() {
            const email = document.getElementById('stripe-email').value.trim();
            if (!email) {
                alert('Please enter user email');
                return;
            }

            if (!confirm('Resume Stripe subscription for ' + email + '?')) return;

            const result = await apiCall('/admin/stripe/subscription/' + encodeURIComponent(email) + '/resume', 'POST');
            if (result.error) {
                alert('Error: ' + result.error);
            } else {
                alert('Success: ' + result.message);
            }
        }

        async function cancelStripeSubscription() {
            const email = document.getElementById('stripe-email').value.trim();
            if (!email) {
                alert('Please enter user email');
                return;
            }

            if (!confirm('CANCEL Stripe subscription for ' + email + '? This cannot be undone!')) return;

            const result = await apiCall('/admin/stripe/subscription/' + encodeURIComponent(email) + '/cancel', 'POST');
            if (result.error) {
                alert('Error: ' + result.error);
            } else {
                alert('Success: ' + result.message);
            }
        }

        async function generateCustomerPortal() {
            const email = document.getElementById('stripe-email').value.trim();
            if (!email) {
                alert('Please enter user email');
                return;
            }

            const result = await apiCall('/admin/stripe/customer-portal/' + encodeURIComponent(email));
            if (result.error) {
                alert('Error: ' + result.error);
            } else {
                alert('Customer Portal URL:\\n' + result.url);
                if (result.url) {
                    window.open(result.url, '_blank');
                }
            }
        }

        // Promo Code Management Functions
        async function createPromoCode() {
            const code = document.getElementById('promo-code').value.trim().toUpperCase();
            const months = parseInt(document.getElementById('promo-months').value);
            const description = document.getElementById('promo-description').value.trim();

            if (!code || !months || !description) {
                alert('Please fill in all promo code fields');
                return;
            }

            if (!confirm('Create promo code ' + code + ' for ' + months + ' months?')) return;

            const result = await apiCall('/admin/promo-codes', 'POST', {
                code: code,
                months: months,
                description: description
            });

            if (result.error) {
                alert('Error: ' + result.error);
            } else {
                alert('Promo code ' + code + ' created successfully');
                document.getElementById('promo-code').value = '';
                document.getElementById('promo-months').value = '';
                document.getElementById('promo-description').value = '';
                loadPromoCodes();
            }
        }

        async function togglePromoCode(code) {
            if (!confirm('Toggle status for promo code ' + code + '?')) return;

            const result = await apiCall('/admin/promo-codes/' + encodeURIComponent(code) + '/toggle', 'POST');
            if (result.error) {
                alert('Error: ' + result.error);
            } else {
                alert('Success: ' + result.message);
                loadPromoCodes();
            }
        }

        async function deletePromoCode(code) {
            if (!confirm('PERMANENTLY DELETE promo code ' + code + '? This cannot be undone!')) return;

            const result = await apiCall('/admin/promo-codes/' + encodeURIComponent(code), 'DELETE');
            if (result.error) {
                alert('Error: ' + result.error);
            } else {
                alert('Success: ' + result.message);
                loadPromoCodes();
            }
        }
        
        async function logout() {
            try {
                await fetch(window.location.origin + '/admin/logout', { 
                    method: 'POST',
                    credentials: 'same-origin'
                });
                window.location.reload();
            } catch (error) {
                console.error('Logout error:', error);
                window.location.reload();
            }
        }
        
        // User autocomplete functionality
        let allUsers = [];
        let selectedSuggestionIndex = -1;

        async function loadAllUsers() {
            try {
                const result = await apiCall('/admin/users');
                allUsers = result.users || [];
            } catch (error) {
                console.error('Failed to load users for autocomplete:', error);
                allUsers = [];
            }
        }

        function filterUsers(input) {
            const query = input.value.toLowerCase().trim();
            const suggestionsId = input.id + '-suggestions';
            const suggestionsDiv = document.getElementById(suggestionsId);
            
            selectedSuggestionIndex = -1;
            
            if (query.length < 1) {
                suggestionsDiv.classList.remove('show');
                return;
            }

            const filtered = allUsers.filter(user => 
                user.email.toLowerCase().includes(query)
            );

            if (filtered.length === 0) {
                suggestionsDiv.classList.remove('show');
                return;
            }

            const html = filtered.slice(0, 8).map((user, index) => {
                const badgeClass = user.plan_name === 'pro' ? 'badge-pro' : 'badge-free';
                const badgeText = user.plan_name === 'pro' ? 'PRO' : 'FREE';
                
                return \`
                    <div class="suggestion-item" data-email="\${user.email}" data-index="\${index}">
                        <span class="suggestion-email">\${user.email}</span>
                        <span class="suggestion-badge \${badgeClass}">\${badgeText}</span>
                    </div>
                \`;
            }).join('');

            suggestionsDiv.innerHTML = html;
            suggestionsDiv.classList.add('show');

            // Add click handlers
            suggestionsDiv.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    input.value = item.dataset.email;
                    suggestionsDiv.classList.remove('show');
                });
            });
        }

        function handleAutocompleteKeydown(event, input) {
            const suggestionsId = input.id + '-suggestions';
            const suggestionsDiv = document.getElementById(suggestionsId);
            const items = suggestionsDiv.querySelectorAll('.suggestion-item');
            
            if (!suggestionsDiv.classList.contains('show')) return;

            switch(event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, items.length - 1);
                    updateSelectedSuggestion(items);
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
                    updateSelectedSuggestion(items);
                    break;
                case 'Enter':
                    event.preventDefault();
                    if (selectedSuggestionIndex >= 0 && items[selectedSuggestionIndex]) {
                        input.value = items[selectedSuggestionIndex].dataset.email;
                        suggestionsDiv.classList.remove('show');
                    }
                    break;
                case 'Escape':
                    suggestionsDiv.classList.remove('show');
                    break;
            }
        }

        function updateSelectedSuggestion(items) {
            items.forEach((item, index) => {
                item.classList.toggle('selected', index === selectedSuggestionIndex);
            });
        }

        // Load initial data and setup event listeners
        window.onload = function() {
            // Load users for autocomplete
            loadAllUsers();
            
            // Setup plan selection event listener
            const planSelect = document.getElementById('new-user-plan');
            if (planSelect) {
                planSelect.addEventListener('change', function() {
                    const monthsField = document.getElementById('new-user-months');
                    if (this.value === 'pro') {
                        monthsField.style.display = 'block';
                        monthsField.focus();
                    } else {
                        monthsField.style.display = 'none';
                        monthsField.value = '';
                    }
                });
            }
            
            // Setup autocomplete event listeners
            const autocompleteInputs = ['user-email', 'sub-email', 'stripe-email'];
            
            autocompleteInputs.forEach(inputId => {
                const input = document.getElementById(inputId);
                if (input) {
                    input.addEventListener('keydown', (e) => handleAutocompleteKeydown(e, input));
                    
                    // Hide suggestions when clicking outside
                    document.addEventListener('click', (e) => {
                        if (!input.contains(e.target) && !e.target.closest('.autocomplete-suggestions')) {
                            const suggestionsDiv = document.getElementById(inputId + '-suggestions');
                            if (suggestionsDiv) {
                                suggestionsDiv.classList.remove('show');
                            }
                        }
                    });
                }
            });
        };
    </script>
</body>
</html>`;
}

// Generate thank you email HTML for Pro upgrade
async function generateThankYouEmailHTML(userEmail, env) {
  const loginUrl = 'https://hyperfiler.pro/hyperfiler-pro.html';
  const readmeUrl = 'https://hyperfiler.pro/readme';
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You for Upgrading to HyperFiler Pro!</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container {
                background: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 2.5em;
                margin-bottom: 10px;
            }
            .title {
                font-size: 1.8em;
                color: #333;
                margin-bottom: 10px;
                font-weight: 600;
            }
            .subtitle {
                color: #666;
                font-size: 1.1em;
            }
            .content {
                margin-bottom: 30px;
            }
            .highlight-box {
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                color: white;
                padding: 25px;
                border-radius: 10px;
                margin: 25px 0;
                text-align: center;
            }
            .highlight-box h3 {
                margin: 0 0 15px 0;
                font-size: 1.3em;
            }
            .highlight-box p {
                margin: 0;
                font-size: 1.1em;
                opacity: 0.9;
            }
            .button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 50px;
                font-weight: 600;
                margin: 10px;
                transition: transform 0.2s ease;
            }
            .button:hover {
                transform: translateY(-2px);
            }
            .features {
                background: #f8f9fa;
                padding: 25px;
                border-radius: 10px;
                margin: 25px 0;
            }
            .features h3 {
                margin: 0 0 15px 0;
                color: #333;
            }
            .features ul {
                margin: 0;
                padding-left: 20px;
            }
            .features li {
                margin-bottom: 8px;
                color: #555;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 0.9em;
            }
            .cta-buttons {
                text-align: center;
                margin: 30px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">⚡</div>
                <h1 class="title">Welcome to HyperFiler Pro!</h1>
                <p class="subtitle">Thank you for supporting our development</p>
            </div>
            
            <div class="content">
                <p>Hi there!</p>
                
                <p>🎉 <strong>Thank you for upgrading to HyperFiler Pro!</strong> Your €49.98 contribution helps us keep building and improving this powerful productivity system.</p>
                
                <div class="highlight-box">
                    <h3>🚀 You're Now a Pro User!</h3>
                    <p>All Pro features are now unlocked and the trial reminder has been removed from your interface.</p>
                </div>
                
                <p>Your Pro status includes:</p>
                
                <div class="features">
                    <h3>✨ Pro Benefits:</h3>
                    <ul>
                        <li><strong>Priority Support:</strong> Get help within 24 hours</li>
                        <li><strong>Lifetime Access:</strong> Never pay again - this is a one-time payment</li>
                        <li><strong>All Features Unlocked:</strong> Advanced analytics, unlimited projects, and more</li>
                        <li><strong>Development Support:</strong> You're helping us keep HyperFiler Pro awesome</li>
                    </ul>
                </div>
                
                <p>Your app interface has been automatically updated to show your Pro status, and you'll no longer see the trial reminder.</p>
                
                <div class="cta-buttons">
                    <a href="${loginUrl}" class="button">🚀 Continue Using HyperFiler Pro</a>
                    <a href="${readmeUrl}" class="button">📚 Read the Complete Guide</a>
                </div>
                
                <p style="text-align: center; margin-top: 20px; color: #666; font-size: 0.9em;">
                    <strong>💡 Pro Tip:</strong> Check out the advanced @project system and keyboard shortcuts to maximize your productivity!
                </p>
            </div>
            
            <div class="footer">
                <p>Thank you for choosing HyperFiler Pro!</p>
                <p>Questions? Reply to this email or contact us at support@hyperfiler.pro</p>
                <p style="margin-top: 15px; font-size: 0.8em; opacity: 0.7;">
                    You're receiving this email because you upgraded to HyperFiler Pro. 
                    <br>This is a one-time payment - no recurring charges.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Send thank you email for Pro upgrade
async function sendThankYouEmail(userEmail, env) {
  try {
    const emailHtml = await generateThankYouEmailHTML(userEmail, env);
    
    const emailResult = await sendEmail(
      env, 
      userEmail, 
      `🎉 Welcome to HyperFiler Pro! Thank You for Your Support`, 
      emailHtml
    );
    
    return emailResult;
  } catch (error) {
    console.error('Error sending thank you email:', error);
    return { success: false, error: error.message };
  }
}

// Generate trial expiration email HTML
async function generateTrialExpirationEmailHTML(userEmail, env) {
  const loginUrl = 'https://hyperfiler.pro/hyperfiler-pro.html';
  const upgradeUrl = 'https://hyperfiler.pro/frontend/upgrade-compare.html';
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your HyperFiler Pro Trial Has Ended</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container {
                background: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 2.5em;
                margin-bottom: 10px;
            }
            .title {
                font-size: 1.8em;
                color: #333;
                margin-bottom: 10px;
                font-weight: 600;
            }
            .subtitle {
                color: #666;
                font-size: 1.1em;
            }
            .content {
                margin-bottom: 30px;
            }
            .highlight-box {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 25px;
                border-radius: 10px;
                margin: 25px 0;
                text-align: center;
            }
            .highlight-box h3 {
                margin: 0 0 15px 0;
                font-size: 1.3em;
            }
            .highlight-box p {
                margin: 0;
                font-size: 1.1em;
                opacity: 0.9;
            }
            .button {
                display: inline-block;
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 50px;
                font-weight: 600;
                margin: 10px;
                transition: transform 0.2s ease;
            }
            .button:hover {
                transform: translateY(-2px);
            }
            .secondary-button {
                background: #6c757d;
            }
            .features {
                background: #f8f9fa;
                padding: 25px;
                border-radius: 10px;
                margin: 25px 0;
            }
            .features h3 {
                margin: 0 0 15px 0;
                color: #333;
            }
            .features ul {
                margin: 0;
                padding-left: 20px;
            }
            .features li {
                margin-bottom: 8px;
                color: #555;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 0.9em;
            }
            .cta-buttons {
                text-align: center;
                margin: 30px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">⚡</div>
                <h1 class="title">Your 60-Day Trial Has Ended</h1>
                <p class="subtitle">But your HyperFiler Pro journey doesn't have to!</p>
            </div>
            
            <div class="content">
                <p>Hi there!</p>
                
                <p>Your 60-day free trial of HyperFiler Pro has come to an end. We hope you've enjoyed discovering how this powerful GTD system can transform your productivity!</p>
                
                <div class="highlight-box">
                    <h3>🎉 Great News!</h3>
                    <p>You can continue using HyperFiler Pro completely free forever!</p>
                </div>
                
                <p>That's right - all your tasks, projects, and data remain accessible. You can keep organizing your life with our powerful @project system, natural language processing, and cloud sync.</p>
                
                <div class="features">
                    <h3>✨ What you can continue using for free:</h3>
                    <ul>
                        <li>Unlimited tasks and projects</li>
                        <li>Advanced @project system</li>
                        <li>Smart natural language processing</li>
                        <li>Cloud sync across devices</li>
                        <li>All your existing data</li>
                    </ul>
                </div>
                
                <p>If you've found value in HyperFiler Pro and would like to support its development, we'd love to have you as a Pro user!</p>
                
                <div class="cta-buttons">
                    <a href="${loginUrl}" class="button secondary-button">🚀 Continue Using Free</a>
                </div>
                
                <p style="text-align: center; margin-top: 20px; color: #666; font-size: 0.9em;">
                    <strong>Pro benefits:</strong> Priority support, advanced analytics, and knowing you're helping keep HyperFiler Pro awesome! 🚀
                </p>
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <p style="margin: 0; color: #856404; font-size: 0.9em; font-weight: 500;">
                        <strong>📧 One-Time Reminder:</strong> This is the only email you'll receive about payment. 
                        <br>We respect your choice completely and won't contact you again.
                    </p>
                </div>
            </div>
            
            <div class="footer">
                <p>Thank you for trying HyperFiler Pro!</p>
                <p>Questions? Reply to this email or contact us at support@hyperfiler.pro</p>
                <p style="margin-top: 15px; font-size: 0.8em; opacity: 0.7;">
                    You're receiving this email because you signed up for HyperFiler Pro. 
                    <br>You can continue using the app free forever, no action required.
                </p>
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea;">
                    <p style="margin: 0; font-size: 0.9em; color: #666; font-weight: 500;">
                        <strong>📧 One-Time Email:</strong> This is the only reminder you'll receive. 
                        <br>We won't contact you again about payment - your choice is completely respected.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Send trial expiration email
async function sendTrialExpirationEmail(userEmail, env) {
  try {
    const emailHtml = await generateTrialExpirationEmailHTML(userEmail, env);
    
    const emailResult = await sendEmail(
      env, 
      userEmail, 
      `🎉 Your HyperFiler Pro Trial Has Ended - Continue Using Free!`, 
      emailHtml
    );
    
    return emailResult;
  } catch (error) {
    console.error('Error sending trial expiration email:', error);
    return { success: false, error: error.message };
  }
}

// Update database structure
async function handleUpdateDatabase(request, env, corsHeaders) {
  try {
    console.log('🔧 Updating database structure...');
    
    // Add expiration_email_sent column to user_subscriptions table
    try {
      const alterStmt = env.DB.prepare(`
        ALTER TABLE user_subscriptions 
        ADD COLUMN expiration_email_sent INTEGER DEFAULT 0
      `);
      await alterStmt.run();
      console.log('✅ Added expiration_email_sent column to user_subscriptions');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('ℹ️ expiration_email_sent column already exists');
      } else {
        throw error;
      }
    }
    
    // Add user_email column to user_subscriptions table if it doesn't exist
    try {
      const alterStmt2 = env.DB.prepare(`
        ALTER TABLE user_subscriptions 
        ADD COLUMN user_email TEXT
      `);
      await alterStmt2.run();
      console.log('✅ Added user_email column to user_subscriptions');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('ℹ️ user_email column already exists');
      } else {
        throw error;
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Database structure updated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Database update error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Trial status endpoint
async function handleTrialStatus(request, env, corsHeaders) {
  try {
    const token = getAuthToken(request);
    const payload = await verifyToken(token, env.JWT_SECRET || 'default-secret-key');
    
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get subscription info
    const subStmt = env.DB.prepare('SELECT * FROM user_subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1');
    const subscription = await subStmt.bind(payload.userId).first();
    
    if (!subscription) {
      return new Response(JSON.stringify({ 
        error: 'No subscription found',
        trialStatus: null
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Calculate trial status
    const now = new Date();
    const trialEnd = new Date(subscription.current_period_end);
    const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
    const isExpired = trialEnd < now;
    
    // No automatic emails - just soft reminders in the app
    // Users can continue using the app free forever with gentle reminders
    
    const trialStatus = {
      isActive: subscription.status === 'active',
      isTrial: subscription.plan_name === 'trial',
      isExpired: isExpired,
      daysLeft: daysLeft > 0 ? daysLeft : 0,
      trialEnd: subscription.current_period_end,
      hasPaid: subscription.plan_name === 'pro', // All Pro users (Stripe customers + promo code users) are considered paid
      planName: subscription.plan_name
    };

    return new Response(JSON.stringify({ 
      trialStatus: trialStatus,
      subscription: subscription
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Trial status error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get trial status' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

