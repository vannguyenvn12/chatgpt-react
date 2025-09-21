import { useState, useCallback, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  TextField,
  Button,
  Box,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton,
  LinearProgress,
  Link,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import { CloudUpload, Delete, FileDownload } from '@mui/icons-material';
import { useSocketContext } from '../../context/SocketProvider';
import { uploadToCloudinary } from '../../api/upload';

export default function Form() {
  const { socket, connected } = useSocketContext();

  // Form state
  const [formData, setFormData] = useState({
    fileAttachment: null,
    question: 'CN2: Xây dựng bộ câu hỏi mới',
    caseNumber: '2025F31234',
    interviewDate: new Date(2024, 2, 7), // 7/3/2024
    companion: 'Không có',
    notes: 'Không có',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [latestChatGPTMessage, setLatestChatGPTMessage] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const connectionChip = (
    <Chip
      label={connected ? 'Connected' : 'Disconnected'}
      color={connected ? 'success' : 'default'}
      size='small'
    />
  );

  const handleInputChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      interviewDate: date,
    }));
  };

  const formatDateVN = (date) => {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Listen for ChatGPT messages
  useEffect(() => {
    if (!socket) return;

    const handleChatGPTMessage = (payload) => {
      console.log('Received ChatGPT message:', payload);
      setLatestChatGPTMessage(payload);
    };

    socket.on('send_chat_to_react', handleChatGPTMessage);

    return () => {
      socket.off('send_chat_to_react', handleChatGPTMessage);
    };
  }, [socket]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        fileAttachment: file,
      }));
    }
  };

  const handleFileRemove = () => {
    setFormData((prev) => ({
      ...prev,
      fileAttachment: null,
    }));
  };

  const postText = async (url, text) => {
    return fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        accept: 'application/json, text/plain;q=0.9, */*;q=0.5',
      },
      body: text,
    });
  };

  const handleExportToGoogle = async () => {
    if (!latestChatGPTMessage) {
      alert('Chưa có dữ liệu từ ChatGPT để xuất!');
      return;
    }

    setIsExporting(true);
    try {
      const response = await postText(
        'https://script.google.com/macros/s/AKfycbyS3h4Ci958a33mz2tWopo02R1jwQvZaUQrezmT6AzsaqkCc0NkLm4CxPJU_o2lklZo/exec',
        latestChatGPTMessage.text
      );

      if (response.ok) {
        const responseData = await response.text();
        try {
          const parsedData = JSON.parse(responseData);
          if (parsedData.googleDocUrl) {
            // Cập nhật state với Google Doc URL
            setLatestChatGPTMessage((prev) => ({
              ...prev,
              googleDocUrl: parsedData.googleDocUrl,
            }));
            alert('Xuất file thành công! Google Doc đã được tạo.');
          } else {
            alert('Xuất file thành công!');
          }
        } catch (parseError) {
          // Nếu không parse được JSON, coi như thành công
          console.log('Response is not JSON, treating as success:', parseError);
          alert('Xuất file thành công!');
        }
      } else {
        throw new Error(`Export failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Lỗi xuất file: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setFormData((prev) => ({
        ...prev,
        fileAttachment: file,
      }));
    }
  };

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (!connected) {
        alert('Không có kết nối đến server');
        return;
      }

      setIsSubmitting(true);
      setUploadError(null);

      try {
        let fileUrl = 'Không có';

        // Upload file nếu có
        if (formData.fileAttachment) {
          setIsUploading(true);
          try {
            const uploadResult = await uploadToCloudinary([
              formData.fileAttachment,
            ]);
            // Sử dụng content thay vì secure_url
            fileUrl =
              uploadResult.content ||
              uploadResult.secure_url ||
              'File đã được xử lý';
            console.log('File processed successfully:', fileUrl);
          } catch (uploadErr) {
            console.error('Upload failed:', uploadErr);
            setUploadError('Lỗi upload file: ' + uploadErr.message);
            setIsSubmitting(false);
            setIsUploading(false);
            return;
          } finally {
            setIsUploading(false);
          }
        }

        // Tạo prompt từ form data với file content
        const prompt = `${fileUrl}
Câu hỏi: ${formData.question}
Case Number: ${formData.caseNumber}
Ngày phỏng vấn: ${formatDateVN(formData.interviewDate)}
Người đi cùng: ${formData.companion}
Ghi chú: ${formData.notes}

XUẤT TRỰC TIẾP PACKAGE`;

        // Gửi prompt qua socket
        const payload = {
          room: 'default',
          type: 'chat:text',
          messageId: `form_${Date.now()}`,
          text: prompt,
          author: 'you',
          ts: Date.now(),
          conversationId: 'default',
        };

        socket.emit('send_message_to_server', payload);

        // Reset form sau khi gửi
        setTimeout(() => {
          setFormData({
            fileAttachment: null,
            question: 'CN2: Xây dựng bộ câu hỏi mới',
            caseNumber: '2025F31234',
            interviewDate: new Date(2024, 2, 7), // 7/3/2024
            companion: 'Không có',
            notes: 'Không có',
          });
          setIsSubmitting(false);
          setUploadError(null);
        }, 1000);
      } catch (error) {
        console.error('Submit error:', error);
        setUploadError('Lỗi gửi form: ' + error.message);
        setIsSubmitting(false);
        setIsUploading(false);
      }
    },
    [socket, connected, formData]
  );

  return (
    <Card
      variant='outlined'
      sx={{
        flex: 1,
        mx: 'auto',
        maxWidth: 800,
        borderColor: 'divider',
        boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
        backdropFilter: 'saturate(110%) blur(10px)',
      }}
    >
      <CardHeader
        title='Form Phỏng Vấn'
        action={connectionChip}
        sx={{ pb: 0.5 }}
      />

      <CardContent sx={{ pt: 2 }}>
        <Box component='form' onSubmit={handleSubmit}>
          <Typography variant='h6' gutterBottom>
            Thông tin phỏng vấn
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            {/* File đính kèm - Upload */}
            <Box>
              <Typography variant='subtitle2' gutterBottom>
                File đính kèm
              </Typography>
              {isUploading && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress />
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ mt: 1, display: 'block' }}
                  >
                    Đang upload file...
                  </Typography>
                </Box>
              )}
              {formData.fileAttachment ? (
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: 'success.50',
                    border: '1px solid',
                    borderColor: 'success.200',
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      elevation: 4,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '50%',
                        bgcolor: 'success.100',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CloudUpload color='success' sx={{ fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography
                        variant='subtitle2'
                        color='success.dark'
                        sx={{ fontWeight: 600 }}
                      >
                        {formData.fileAttachment.name}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {(formData.fileAttachment.size / 1024).toFixed(1)} KB
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    size='small'
                    onClick={handleFileRemove}
                    color='error'
                    sx={{
                      bgcolor: 'error.50',
                      '&:hover': {
                        bgcolor: 'error.100',
                      },
                    }}
                  >
                    <Delete sx={{ fontSize: 20 }} />
                  </IconButton>
                </Paper>
              ) : (
                <Paper
                  elevation={isDragOver ? 8 : 1}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    border: '2px dashed',
                    borderColor: isDragOver ? 'primary.main' : 'grey.300',
                    bgcolor: isDragOver ? 'primary.50' : 'grey.50',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'primary.50',
                      transform: 'scale(1.01)',
                    },
                  }}
                  onClick={() => document.getElementById('file-upload').click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '50%',
                        bgcolor: isDragOver ? 'primary.100' : 'grey.100',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <CloudUpload
                        sx={{
                          fontSize: 40,
                          color: isDragOver ? 'primary.main' : 'grey.400',
                          transition: 'all 0.3s ease',
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography
                        variant='h6'
                        color={isDragOver ? 'primary.main' : 'text.primary'}
                        sx={{ mb: 1, fontWeight: 500 }}
                      >
                        {isDragOver ? 'Thả file vào đây' : 'Tải lên file'}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Nhấn để chọn file hoặc kéo thả file vào đây
                      </Typography>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        sx={{ mt: 1, display: 'block' }}
                      >
                        Hỗ trợ: PDF, DOC, DOCX, TXT, JPG, PNG (Tối đa 10MB)
                      </Typography>
                    </Box>
                  </Box>
                  <input
                    id='file-upload'
                    type='file'
                    hidden
                    onChange={handleFileUpload}
                    accept='.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png'
                  />
                </Paper>
              )}
            </Box>

            {/* Câu hỏi - Dropdown */}
            <FormControl fullWidth>
              <InputLabel>Câu hỏi</InputLabel>
              <Select
                value={formData.question}
                onChange={handleInputChange('question')}
                label='Câu hỏi'
              >
                <MenuItem value='CN2: Xây dựng bộ câu hỏi mới'>
                  CN2: Xây dựng bộ câu hỏi mới
                </MenuItem>
                <MenuItem value='CN1: Phỏng vấn cơ bản'>
                  CN1: Phỏng vấn cơ bản
                </MenuItem>
                <MenuItem value='CN3: Đánh giá năng lực'>
                  CN3: Đánh giá năng lực
                </MenuItem>
                <MenuItem value='CN4: Kiểm tra kỹ thuật'>
                  CN4: Kiểm tra kỹ thuật
                </MenuItem>
                <MenuItem value='Khác'>Khác</MenuItem>
              </Select>
            </FormControl>

            {/* Case Number */}
            <TextField
              fullWidth
              label='Case Number'
              value={formData.caseNumber}
              onChange={handleInputChange('caseNumber')}
              placeholder='Nhập case number'
            />

            {/* Ngày phỏng vấn */}
            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={vi}
            >
              <DatePicker
                label='Ngày phỏng vấn'
                value={formData.interviewDate}
                onChange={handleDateChange}
                format='dd/MM/yyyy'
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: false,
                  },
                }}
              />
            </LocalizationProvider>

            {/* Người đi cùng */}
            <TextField
              fullWidth
              label='Người đi cùng'
              value={formData.companion}
              onChange={handleInputChange('companion')}
              placeholder="Nhập tên người đi cùng hoặc 'Không có'"
            />

            {/* Ghi chú */}
            <TextField
              fullWidth
              label='Ghi chú'
              value={formData.notes}
              onChange={handleInputChange('notes')}
              placeholder='Nhập ghi chú bổ sung'
              multiline
              rows={3}
            />
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Box sx={{ width: '100%' }}>
          {uploadError && (
            <Typography
              variant='body2'
              color='error'
              sx={{ mb: 2, p: 1, bgcolor: 'error.50', borderRadius: 1 }}
            >
              {uploadError}
            </Typography>
          )}

          {/* ChatGPT Response Display */}
          {latestChatGPTMessage && (
            <Paper
              elevation={1}
              sx={{
                p: 2,
                mb: 2,
                bgcolor: 'success.50',
                border: '1px solid',
                borderColor: 'success.200',
                borderRadius: 2,
              }}
            >
              <Typography
                variant='subtitle2'
                color='success.dark'
                sx={{ mb: 1, fontWeight: 600 }}
              >
                Phản hồi từ ChatGPT:
              </Typography>
              <Typography variant='body2' sx={{ mb: 1 }}>
                {latestChatGPTMessage.text}
              </Typography>

              {/* Google Doc Link */}
              {latestChatGPTMessage.googleDocUrl && (
                <Box
                  sx={{ mt: 2, p: 1, bgcolor: 'primary.50', borderRadius: 1 }}
                >
                  <Typography
                    variant='body2'
                    color='primary.dark'
                    sx={{ mb: 1, fontWeight: 500 }}
                  >
                    📄 Google Doc đã được tạo:
                  </Typography>
                  <Link
                    href={latestChatGPTMessage.googleDocUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'underline',
                      fontWeight: 500,
                      '&:hover': {
                        color: 'primary.dark',
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Xem tại đây trên màn hình
                  </Link>
                </Box>
              )}

              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ mt: 1, display: 'block' }}
              >
                {new Date(latestChatGPTMessage.ts).toLocaleString('vi-VN')}
              </Typography>
            </Paper>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type='submit'
              variant='contained'
              size='large'
              onClick={handleSubmit}
              disabled={!connected || isSubmitting || isUploading}
              sx={{ py: 1.5, flex: 1 }}
            >
              {isUploading
                ? 'Đang upload file...'
                : isSubmitting
                ? 'Đang gửi...'
                : 'XUẤT TRỰC TIẾP PACKAGE'}
            </Button>

            <Button
              variant='outlined'
              size='large'
              onClick={handleExportToGoogle}
              disabled={!latestChatGPTMessage || isExporting}
              startIcon={<FileDownload />}
              sx={{ py: 1.5, minWidth: 140 }}
            >
              {isExporting ? 'Đang xuất...' : 'Xuất File'}
            </Button>
          </Box>
        </Box>
      </CardActions>
    </Card>
  );
}
