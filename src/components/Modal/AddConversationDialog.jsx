import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Stack,
    Alert,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createConversationApi } from '../../api/conversations';
import { useParams } from 'react-router-dom';
import useSocket from '../../hooks/useSocket';
import { useSocketContext } from '../../context/SocketProvider';

export default function AddConversationDialog({ open, onClose, onCreated }) {

    const { socket } = useSocketContext();

    const [title, setTitle] = useState('');
    const [tags] = useState([]); // mở rộng sau nếu cần
    const qc = useQueryClient();

    const { mutate, isPending, error, reset } = useMutation({
        mutationFn: (payload) => createConversationApi(payload),
        onSuccess: (conversation) => {
            // Cập nhật cache / refetch list
            console.log('>>> conversation', conversation)

            qc.invalidateQueries({ queryKey: ['conversations'] });
            onCreated?.(conversation);
            handleClose();
        },
    });

    const handleSubmit = (e) => {
        e?.preventDefault();
        mutate({ title: title.trim(), tags });
        socket.emit('new_conversation');
    };

    const handleClose = () => {
        reset();
        setTitle('');
        onClose?.();
    };

    // focus khi mở
    useEffect(() => {
        if (!open) setTitle('');
    }, [open]);

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
            <form onSubmit={handleSubmit}>
                <DialogTitle>Tạo đoạn chat mới</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField
                            autoFocus
                            label="Tên đoạn chat"
                            placeholder="VD: Văn đz, Văn cute, Văn dthw ..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={isPending}
                        />
                        {error && (
                            <Alert severity="error">
                                {(error.response?.data?.message) || error.message}
                            </Alert>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={isPending}>Huỷ</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isPending || !title.trim()}
                    >
                        {isPending ? 'Đang tạo...' : 'Tạo'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

AddConversationDialog.propTypes = {
    open: PropTypes.bool,
    onClose: PropTypes.func,
    onCreated: PropTypes.func, // nhận lại conversation mới { _id, title, ... }
};
