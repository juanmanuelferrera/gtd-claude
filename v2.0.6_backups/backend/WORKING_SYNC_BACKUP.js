// 🚀 WORKING SYNC SYSTEM BACKUP - v1.0-sync-working
// This file contains the proven working sync functions
// Use this to restore if future changes break sync

// ===== BACKEND: handleTasksSyncSimple =====
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
    
    // Insert all tasks from client
    for (const task of tasks) {
      const stmt = env.DB.prepare(`
        INSERT INTO user_tasks 
        (id, user_id, title, notes, due_date, due_time, status, repeat_type, template, created_at, updated_at, is_deleted, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      await stmt.bind(
        task.id,
        actualUserId,
        task.title || '',
        task.notes || '',
        task.dueDate || null,
        task.dueTime || null,
        task.status || 'pending',
        task.repeatType || null,
        task.template || null,
        task.createdAt || new Date().toISOString(),
        task.updatedAt || new Date().toISOString(),
        task.isDeleted ? 1 : 0,
        task.deletedAt || null
      ).run();
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
}

// ===== USAGE IN WORKER.JS =====
// if (pathname === '/tasks/sync' && request.method === 'POST') {
//   return handleTasksSyncSimple(request, env, corsHeaders);
// }