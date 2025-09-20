import api from "./axios";

/** List theo conversation (phân trang) */
export async function listMessagesApi(conversationId, { page = 1, limit = 50, order = 'asc' } = {}) {
    const data = await api.get(`/conversations/${conversationId}/messages`, {
        params: { page, limit, order },
    });

    return data; // { items, page, limit, total, totalPages }
}

/** Tạo message mới */
export async function createMessageApi(conversationId, { role = 'you', content = '', attachments = [] } = {}) {
    const { data } = await api.post(`/conversations/${conversationId}/messages`, {
        role,
        content,
        attachments,
    });
    return data.message; // { _id, conversation, role, content, ... }
}

/** Lấy 1 message theo id */
export async function getMessageApi(id) {
    const { data } = await api.get(`/messages/${id}`);
    return data.message;
}

/** Sửa 1 message (content/attachments) */
export async function updateMessageApi(id, patch) {
    const { data } = await api.patch(`/messages/${id}`, patch);
    return data.message;
}

/** Xoá 1 message */
export async function deleteMessageApi(id) {
    const { data } = await api.delete(`/messages/${id}`);
    return data; // { ok: true }
}

/** Xoá toàn bộ messages của 1 conversation */
export async function clearMessagesApi(conversationId) {
    const { data } = await api.delete(`/conversations/${conversationId}/messages`);
    return data; // { deletedCount: n }
}
