import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import SendIcon from '@mui/icons-material/Send';
import {
    Box,
    Chip,
    CircularProgress,
    IconButton, InputAdornment, Paper,
    Stack,
    TextField, Tooltip
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadToCloudinary } from '../../api/upload';

const MAX_FILES = 10;
const MAX_SIZE_MB = 10;
const ACCEPT = [
    'image/*', 'application/pdf', 'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
].join(',');

export default function MessageInput({ onSend }) {
    const [value, setValue] = useState('');
    const [isComposing, setIsComposing] = useState(false);
    const [files, setFiles] = useState([]);              // File[]
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const ref = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => { ref.current?.focus(); }, []);

    const openPicker = () => fileInputRef.current?.click();

    const validateAndAppend = useCallback((picked) => {
        setError('');
        const list = Array.from(picked || []);
        if (!list.length) return;

        const next = [...files];
        for (const f of list) {
            if (next.length >= MAX_FILES) { setError(`Tối đa ${MAX_FILES} file.`); break; }
            if (f.size > MAX_SIZE_MB * 1024 * 1024) { setError(`"${f.name}" > ${MAX_SIZE_MB}MB`); continue; }
            next.push(f);
        }
        setFiles(next);
    }, [files]);

    const onFileChange = (e) => validateAndAppend(e.target.files);

    // Kéo-thả
    const onDrop = (e) => {
        e.preventDefault();
        validateAndAppend(e.dataTransfer.files);
    };
    const onDragOver = (e) => e.preventDefault();

    const removeFileAt = (idx) => setFiles((arr) => arr.filter((_, i) => i !== idx));

    const handleSend = async () => {
        const text = value.trim();
        if (!text && files.length === 0) return;

        try {
            setUploading(true);
            let attachments = [];
            if (files.length) {
                attachments = await uploadToCloudinary(files); // [{name,url,size,type}]
            }
            console.log(attachments);

            const clean = v => typeof v === 'string' ? v.trim() : v;
            const finalText = [attachments?.secure_url, text].map(clean).filter(Boolean).join(' - ');

            onSend?.(finalText);
            setValue('');
            setFiles([]);
            setError('');
        } catch (e) {
            console.error(e);
            setError('Upload thất bại, thử lại.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Paper
            variant="outlined"
            sx={(theme) => ({
                width: '100%',
                p: 1.25,
                borderRadius: 18,
                borderColor: alpha('#fff', 0.1),
                bgcolor: '#0f1420',
                boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
                '&:focus-within': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`,
                },
            })}
            onDrop={onDrop}
            onDragOver={onDragOver}
        >
            {/* Danh sách file đã chọn */}
            {!!files.length && (
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ px: 1, pt: 0.5, pb: 1 }}>
                    {files.map((f, i) => (
                        <Chip
                            key={i}
                            size="small"
                            variant="outlined"
                            label={`${f.name} • ${(f.size / 1024 / 1024).toFixed(1)}MB`}
                            onDelete={() => removeFileAt(i)}
                            deleteIcon={<CloseIcon />}
                            sx={{ borderColor: 'divider' }}
                        />
                    ))}
                </Stack>
            )}

            <Box
                component="form"
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            >
                <TextField
                    inputRef={ref}
                    fullWidth
                    placeholder="Nhập tin nhắn (Enter để gửi, Shift+Enter xuống dòng)…  •  Kéo-thả file vào đây"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    multiline
                    minRows={1}
                    maxRows={8}
                    variant="standard"
                    InputProps={{
                        disableUnderline: true,
                        sx: { px: 1.5, py: 0.5, borderRadius: 999 },
                        startAdornment: (
                            <InputAdornment position="start">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept={ACCEPT}
                                    hidden
                                    onChange={onFileChange}
                                />
                                <Tooltip title="Đính kèm">
                                    <span>
                                        <IconButton size="small" edge="start" onClick={openPicker} disabled={files.length >= MAX_FILES || uploading}>
                                            <AttachFileIcon fontSize="small" />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end" sx={{ gap: 0.5 }}>
                                {uploading && <CircularProgress size={18} sx={{ mr: 0.5 }} />}
                                <Tooltip title="Emoji (demo)">
                                    <span>
                                        <IconButton size="small" disabled={uploading}>
                                            <InsertEmoticonIcon fontSize="small" />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                                <Tooltip title="Gửi">
                                    <span>
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={handleSend}
                                            disabled={uploading || (!value.trim() && files.length === 0)}
                                        >
                                            <SendIcon fontSize="small" />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </InputAdornment>
                        ),
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                />
            </Box>

            {error && (
                <Box sx={{ px: 1.5, pt: 0.75, color: 'error.main', fontSize: 12 }}>{error}</Box>
            )}
        </Paper>
    );
}
