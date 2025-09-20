import { createTheme, alpha } from '@mui/material/styles';

const theme = createTheme({
    cssVariables: true,
    colorSchemes: { dark: true }, // mặc định dark
    palette: {
        mode: 'dark',
        background: {
            default: '#0b0e14',     // nền app
            paper: '#11151f',     // thẻ, ô chat
        },
        divider: alpha('#ffffff', 0.08),
        primary: { main: '#6ea8fe' },
        success: { main: '#2ecc71' },
    },
    shape: { borderRadius: 14 },
    typography: {
        fontFamily: ['Inter', 'system-ui', 'Segoe UI', 'Arial', 'sans-serif'].join(','),
        body1: { lineHeight: 1.6, fontSize: 15 },
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                }
            }
        }
    }
});

export default theme;
