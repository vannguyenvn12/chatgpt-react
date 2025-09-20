// src/components/Sidebar.jsx
import PropTypes from 'prop-types';
import {
    Box,
    Button,
    Divider,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

function formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    // Ví dụ: 09:41 · 09/09
    return `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${d.toLocaleDateString()}`;
}

export default function Sidebar({
    conversations = [],
    activeId,
    onNewChat,
    onSelectConversation,
    width = 300,
    sx,
}) {

    return (
        <Box
            component="nav"
            sx={{
                width,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                height: '100dvh',
                ...sx,
            }}
        >
            {/* Header */}
            <Box sx={{ p: 2 }}>
                <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onNewChat}
                    aria-label="Tạo đoạn chat mới"
                >
                    Đoạn chat mới
                </Button>
            </Box>

            <Divider />

            {/* History */}
            <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="overline" sx={{ opacity: 0.8 }}>
                    Lịch sử chat
                </Typography>
            </Box>

            <Box sx={{ overflowY: 'auto', flex: 1 }}>
                {conversations.length === 0 ? (
                    <Box sx={{ px: 2, py: 3, opacity: 0.7 }}>
                        <Typography variant="body2">
                            Chưa có cuộc hội thoại nào. Hãy bắt đầu bằng nút “Đoạn chat mới”.
                        </Typography>
                    </Box>
                ) : (
                    <List disablePadding>
                        {conversations.map((c, idx) => {
                            const primary =
                                c.title?.trim() ||
                                `Chat ${idx + 1}`;
                            const secondary = formatTime(c.lastMessageAt || c.updatedAt || c.createdAt);
                            const selected = String(c._id) === String(activeId);

                            return (
                                <Tooltip key={c._id} title={primary} placement="right" enterDelay={600}>
                                    <ListItemButton
                                        selected={selected}
                                        onClick={() => onSelectConversation?.(c)}
                                        sx={{
                                            borderRadius: 1,
                                            mx: 1,
                                            mb: 0.5,
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <ChatBubbleOutlineIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={primary}
                                            secondary={secondary}
                                            primaryTypographyProps={{
                                                noWrap: true,
                                                variant: 'body2',
                                                fontWeight: selected ? 600 : 500,
                                            }}
                                            secondaryTypographyProps={{
                                                noWrap: true,
                                                variant: 'caption',
                                                sx: { opacity: 0.7 },
                                            }}
                                        />
                                    </ListItemButton>
                                </Tooltip>
                            );
                        })}
                    </List>
                )}
            </Box>

            {/* Footer (optional) */}
            <Box sx={{ p: 1, opacity: 0.6 }}>
                <Typography variant="caption">VanGPT Sidebar</Typography>
            </Box>
        </Box>
    );
}

Sidebar.propTypes = {
    conversations: PropTypes.arrayOf(
        PropTypes.shape({
            _id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
            title: PropTypes.string,
            lastMessageAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
            updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
            createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
        })
    ),
    activeId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    onNewChat: PropTypes.func,
    onSelectConversation: PropTypes.func,
    width: PropTypes.number,
    sx: PropTypes.object,
};
