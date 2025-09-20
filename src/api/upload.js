import api from './axios';

export async function uploadToCloudinary(files) {
    console.log('check file', files);

    const form = new FormData();
    form.append('file', files[0]);
    const res = await api.post('/upload', form);
    return res.file; // {secure_url, public_id,...}
}

export async function uploadManyToCloudinary(files) {
    const form = new FormData();
    [...files].forEach((f) => form.append('files', f));
    const res = await api.post('/upload/many', form);
    return res.files; // array
}

export async function deleteFromCloudinary(publicId) {
    return api.delete(`/upload/${encodeURIComponent(publicId)}`);
}
