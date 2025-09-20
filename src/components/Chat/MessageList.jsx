import { Fragment, useEffect, useRef } from 'react';
import { alpha } from '@mui/material/styles';
import { Avatar, Box, Paper, Stack, Typography, useTheme } from '@mui/material';

export default function MessageList({ items = [], currentUser = 'you', height = 560 }) {
    const theme = useTheme();
    const scrollerRef = useRef(null);

    // Auto scroll xuống cuối khi có message mới
    useEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, [items]);

    return (
        <Box
            ref={scrollerRef}
            sx={{
                height,
                overflowY: 'auto',
                px: 2,
                py: 2,
                borderRadius: 3,
                background: `linear-gradient(180deg, ${alpha('#ffffff', 0.02)} 0%, transparent 60%)`,
                border: '1px solid',
                borderColor: 'divider',
            }}
        >
            <Stack spacing={1.25}>
                {items.map((m, idx) => {
                    const isYou = m.role === currentUser;
                    const youBg = alpha(theme.palette.primary.main, 0.25);
                    const botBg = theme.palette.mode === 'dark' ? '#141a26' : 'background.paper';
                    const borderCol = isYou ? alpha(theme.palette.primary.main, 0.4) : theme.palette.divider;

                    return (
                        <Fragment key={idx}>
                            <Stack
                                direction="row"
                                spacing={1.25}
                                justifyContent={isYou ? 'flex-end' : 'flex-start'}
                                alignItems="flex-end"
                            >
                                {!isYou && (
                                    <Avatar sx={{ width: 30, height: 30, bgcolor: 'grey.800' }}>
                                        {(m.author || 'B')[0].toUpperCase()}
                                    </Avatar>
                                )}

                                <Paper
                                    elevation={0}
                                    sx={{
                                        maxWidth: { xs: '92%', sm: '80%' },
                                        px: 1.75,
                                        py: 1.25,
                                        bgcolor: isYou ? youBg : botBg,
                                        border: '1px solid',
                                        borderColor: borderCol,
                                        borderTopLeftRadius: isYou ? 2.25 : 0.75,
                                        borderTopRightRadius: isYou ? 0.75 : 2.25,
                                        borderBottomLeftRadius: 2.25,
                                        borderBottomRightRadius: 2.25,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        boxShadow: isYou ? 'inset 0 0 0 1px rgba(255,255,255,0.04)' : 'none',
                                    }}
                                >
                                    {!isYou && (
                                        <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', mb: 0.25 }}>
                                            {m.role}
                                        </Typography>
                                    )}
                                    <Typography variant="body1">{m.content}</Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{ opacity: 0.5, display: 'block', mt: 0.5, textAlign: 'right' }}
                                    >
                                        {formatTime(m.createdAt)}
                                    </Typography>
                                </Paper>

                                {isYou && (
                                    <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', color: '#0b0e14' }}>
                                        {currentUser[0].toUpperCase()}
                                    </Avatar>
                                )}
                            </Stack>
                        </Fragment>
                    );
                })}
            </Stack>
        </Box>
    );
}

function formatTime(ts) {
    if (!ts) return '';
    try {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
}
