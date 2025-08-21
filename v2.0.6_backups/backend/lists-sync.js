// 🚀 ULTRA-SIMPLE LISTS SYNC - Same proven pattern as tasks
// Complete array replacement, no merging, no conflicts

// ===== LISTS SYNC ENDPOINT (POST /lists/sync) =====
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
    
    // Insert all list sections from client
    for (const section of listSections) {
      const stmt = env.DB.prepare(`
        INSERT INTO user_lists 
        (id, user_id, section_id, section_name, list_id, list_name, list_items, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      // Insert section with all its lists as JSON
      const sectionData = {
        id: section.id,
        name: section.name,
        lists: section.lists || [],
        createdAt: section.createdAt || new Date().toISOString()
      };
      
      await stmt.bind(
        section.id, // Use section.id as primary key
        actualUserId,
        section.id,
        section.name || '',
        null, // list_id (null for section records)
        null, // list_name (null for section records)  
        JSON.stringify(section.lists || []), // Store entire lists array as JSON
        section.createdAt || new Date().toISOString(),
        new Date().toISOString()
      ).run();
    }

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

// ===== GET LISTS ENDPOINT (GET /lists/{userId}) =====
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
      SELECT * FROM user_lists 
      WHERE user_id = ? 
      ORDER BY created_at ASC
    `).bind(userId).all();

    // Convert database records back to listSections format
    const listSections = results.map(row => ({
      id: row.section_id,
      name: row.section_name,
      lists: JSON.parse(row.list_items || '[]'),
      createdAt: row.created_at
    }));

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

// Export functions for use in worker.js
export { handleListsSyncSimple, handleGetLists };