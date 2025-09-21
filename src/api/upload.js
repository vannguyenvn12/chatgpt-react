const API_BASE_URL = 'http://localhost:3000/api/v1';

export async function uploadToCloudinary(files) {
  console.log('check file', files);

  const form = new FormData();
  form.append('file', files[0]);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.file; // {secure_url, public_id,...}
}

export async function uploadManyToCloudinary(files) {
  const form = new FormData();
  [...files].forEach((f) => form.append('files', f));

  const response = await fetch(`${API_BASE_URL}/upload/many`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.files; // array
}

export async function deleteFromCloudinary(publicId) {
  const response = await fetch(
    `${API_BASE_URL}/upload/${encodeURIComponent(publicId)}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    throw new Error(`Delete failed: ${response.statusText}`);
  }

  return response.json();
}
