// src/api/conversations.js

import api from "./axios";

export async function createConversationApi({ title, tags = [] }) {
    const { data } = await api.post('/conversations', { title, tags });

    return data;
}

// src/api/conversations.js (thêm)
export async function listConversationsApi({ q = '', page = 1, limit = 50, archived } = {}) {
    const params = { q, page, limit };
    if (typeof archived !== 'undefined') params.archived = archived;
    const { data } = await api.get('/conversations', { params });
    return data; // { items, page, limit, total, totalPages }
}
