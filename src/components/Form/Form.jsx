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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import { CloudUpload, Delete, FileDownload } from '@mui/icons-material';
import { useSocketContext } from '../../context/SocketProvider';
import { uploadToCloudinary } from '../../api/upload';

export default function Form() {
  const { socket, connected, connecting, socketError, isWaiting, waitingMessage, connectSocket, disconnectSocket } = useSocketContext();

  // Form state
  const [formData, setFormData] = useState({
    fileAttachment: null,
    question: 'CN2: Xây dựng bộ câu hỏi mới',
    caseNumber: '',
    interviewDate: null, // 7/3/2024
    companion: [],
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [latestChatGPTMessage, setLatestChatGPTMessage] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isWaitingForChatGPT, setIsWaitingForChatGPT] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [waitingTime, setWaitingTime] = useState(0);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportedDocUrl, setExportedDocUrl] = useState(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [isChatGPTStreaming, setIsChatGPTStreaming] = useState(false);
  const [isChatGPTComplete, setIsChatGPTComplete] = useState(false);

  const connectionChip = (
    <Button
      variant={connected ? "outlined" : "contained"}
      size="small"
      onClick={connected ? disconnectSocket : connectSocket}
      disabled={connecting || isWaiting}
      startIcon={connecting ? <CircularProgress size={16} /> : null}
      color={connected ? "warning" : "primary"}
      sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
    >
      {connecting
        ? '🔄 Đang kết nối...'
        : connected
          ? '🔌 Ngắt kết nối'
          : isWaiting
            ? '⏳ Đang chờ...'
            : '🔌 Kết nối'
      }
    </Button>
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

      // Kiểm tra nếu là message từ ChatGPT (không phải user)
      if (payload.author === 'chatgpt' || payload.role === 'chatgpt') {
        setLatestChatGPTMessage(payload);
        setIsWaitingForChatGPT(false); // Stop loading when ChatGPT responds

        // Kiểm tra nếu message có dấu hiệu streaming
        const isStreaming = payload.text && (
          payload.text.includes('...') ||
          payload.text.endsWith('...') ||
          payload.isStreaming === true ||
          payload.streaming === true
        );

        if (isStreaming) {
          setIsChatGPTStreaming(true);
          setIsChatGPTComplete(false);
        } else {
          // Message hoàn chỉnh
          setIsChatGPTStreaming(false);
          setIsChatGPTComplete(true);
        }

        // Reset form after receiving complete ChatGPT response
        if (!isStreaming) {
          setTimeout(() => {
            setFormData({
              fileAttachment: null,
              question: 'CN2: Xây dựng bộ câu hỏi mới',
              caseNumber: '',
              interviewDate: null,
              companion: [],
              notes: '',
            });
            setIsSubmitting(false);
            setUploadError(null);
          }, 2000); // Wait 2 seconds before resetting
        }
      }
    };

    socket.on('send_chat_to_react', handleChatGPTMessage);

    return () => {
      socket.off('send_chat_to_react', handleChatGPTMessage);
    };
  }, [socket]);

  // Timer for waiting time display
  useEffect(() => {
    let timer;
    if (isWaitingForChatGPT) {
      timer = setInterval(() => {
        setWaitingTime(prev => prev + 1);
      }, 1000);
    } else {
      setWaitingTime(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isWaitingForChatGPT]);

  // Timeout for ChatGPT response
  useEffect(() => {
    let timeout;
    if (isWaitingForChatGPT) {
      timeout = setTimeout(() => {
        setIsWaitingForChatGPT(false);
        setUploadError('Timeout: Không nhận được phản hồi từ ChatGPT trong 90 giây');
      }, 90000);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isWaitingForChatGPT]);

  // Reset streaming states when starting new conversation
  useEffect(() => {
    if (isWaitingForChatGPT) {
      setIsChatGPTStreaming(false);
      setIsChatGPTComplete(false);
    }
  }, [isWaitingForChatGPT]);

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

  const handleCloseExportModal = () => {
    setExportModalOpen(false);
    setExportSuccess(false);
    setExportedDocUrl(null);
    setExportProgress(0);
  };

  const handleExportToGoogle = async () => {
    if (!latestChatGPTMessage) {
      alert('Chưa có dữ liệu từ ChatGPT để xuất!');
      return;
    }

    // Mở modal và bắt đầu export
    setExportModalOpen(true);
    setExportSuccess(false);
    setExportedDocUrl(null);
    setExportProgress(0);
    setIsExporting(true);

    // Fake progress: chạy đến 90%
    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15 + 5; // Tăng 5-20% mỗi lần
      });
    }, 200);

    try {
      const response = await postText(
        'https://script.google.com/macros/s/AKfycbyS3h4Ci958a33mz2tWopo02R1jwQvZaUQrezmT6AzsaqkCc0NkLm4CxPJU_o2lklZo/exec',
        latestChatGPTMessage.text
      );

      // Dừng fake progress và set 100% khi thành công
      clearInterval(progressInterval);
      setExportProgress(100);

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
            setExportedDocUrl(parsedData.googleDocUrl);
            setExportSuccess(true);

            // Disconnect socket ngay khi xuất file thành công
            if (connected) {
              setTimeout(() => {
                disconnectSocket();
              }, 1000); // Delay 1 giây để user thấy kết quả
            }
          } else {
            setExportSuccess(true);

            // Disconnect socket ngay khi xuất file thành công
            if (connected) {
              setTimeout(() => {
                disconnectSocket();
              }, 1000); // Delay 1 giây để user thấy kết quả
            }
          }
        } catch (parseError) {
          // Nếu không parse được JSON, coi như thành công
          console.log('Response is not JSON, treating as success:', parseError);
          setExportSuccess(true);

          // Disconnect socket ngay khi xuất file thành công
          if (connected) {
            setTimeout(() => {
              disconnectSocket();
            }, 1000); // Delay 1 giây để user thấy kết quả
          }
        }
      } else {
        throw new Error(`Export failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      clearInterval(progressInterval);
      setUploadError('Lỗi xuất file: ' + error.message);
      setExportSuccess(false);
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
        alert('Bạn cần kết nối trước khi sử dụng hệ thống');
        return;
      }

      setIsSubmitting(true);
      setUploadError(null);

      try {
        let fileUrl = 'Không có';

        // Upload file nếu có
        if (formData.fileAttachment) {
          setIsUploading(true);
          setUploadProgress(0);
          try {
            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
              setUploadProgress(prev => {
                if (prev >= 90) return prev;
                return prev + Math.random() * 20;
              });
            }, 200);

            const uploadResult = await uploadToCloudinary([
              formData.fileAttachment,
            ]);

            clearInterval(progressInterval);
            setUploadProgress(100);

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
            setUploadProgress(0);
            return;
          } finally {
            setIsUploading(false);
            setUploadProgress(0);
          }
        }

        // Tạo prompt từ form data với file content
        const companionText = Array.isArray(formData.companion)
          ? formData.companion.join(', ')
          : formData.companion;

        const prompt = `${fileUrl}
Câu hỏi: ${formData.question}
Case Number: ${formData.caseNumber}
Ngày phỏng vấn: ${formatDateVN(formData.interviewDate)}
Người đi cùng: ${companionText}
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

        // Bắt đầu chờ phản hồi từ ChatGPT
        setIsWaitingForChatGPT(true);
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
    <Box sx={{
      display: 'flex',
      gap: { xs: 0, lg: 0 },
      maxWidth: '100%',
      mx: 0,
      flexDirection: { xs: 'column', lg: 'row' },
      px: 0,
      mt: 0,
      pt: 0
    }}>
      {/* Hướng dẫn sử dụng - Sidebar */}
      {(
        <Box sx={{
          flex: { xs: 'none', lg: '0 0 300px' },
          order: { xs: 2, lg: 1 },
          display: { xs: 'block', lg: 'block' }
        }}>
          <Card
            variant='outlined'
            sx={{
              position: { xs: 'static', lg: 'sticky' },
              top: { xs: 'auto', lg: 20 },
              borderColor: 'divider',
              boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
              backdropFilter: 'saturate(110%) blur(10px)',
              bgcolor: 'grey.900',
              border: '1px solid',
              borderColor: 'grey.700',
              mb: 0
            }}
          >
            <CardHeader
              title={!connected ? "📖 Hướng dẫn sử dụng" : "💡 Mẹo sử dụng"}
              sx={{ pb: 1 }}
            />
            <CardContent sx={{ pt: 0 }}>
              {!connected ? (
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <Typography component="li" variant="body2" sx={{ mb: 2, color: 'text.primary' }}>
                    <strong>Bước 1:</strong> Nhấn nút "Kết nối" ở góc phải trên để kết nối với hệ thống
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 2, color: 'text.primary' }}>
                    <strong>Bước 2:</strong> Điền đầy đủ thông tin phỏng vấn (có thể tải lên file PDF)
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 2, color: 'text.primary' }}>
                    <strong>Bước 3:</strong> Nhấn "Yêu cầu bộ câu hỏi phỏng vấn" để nhận phản hồi
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 2, color: 'text.primary' }}>
                    <strong>Bước 4:</strong> Chờ hệ thống trả lời
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 2, color: 'text.primary' }}>
                    <strong>Bước 5:</strong> Nhấn "Xuất File" để xuất file
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 2, color: 'text.primary' }}>
                    <strong>Bước 6:</strong> Ngắt kết nối sau khi dùng xong
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ pl: 0, m: 0 }}>
                  <Typography variant="body2" sx={{ mb: 2, color: 'text.primary' }}>
                    ✅ <strong>Đã kết nối:</strong> Bạn có thể bắt đầu sử dụng hệ thống
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: 'text.primary' }}>
                    📝 <strong>Điền form:</strong> Thông tin càng chi tiết, hệ thống trả lời càng chính xác
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: 'text.primary' }}>
                    📎 <strong>Upload file:</strong> Hỗ trợ PDF (tối đa 10MB)
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: 'text.primary' }}>
                    🤖 <strong>Gửi câu hỏi:</strong> Nhấn nút xanh để gửi câu hỏi cho hệ thống
                  </Typography>
                </Box>
              )}
              {/* <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                💡 <strong>Lưu ý:</strong> Hệ thống chỉ cho phép 1 người sử dụng tại 1 thời điểm.
              </Typography> */}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Form chính */}
      <Box sx={{
        flex: 1,
        order: { xs: 1, lg: 2 }
      }}>
        <Card
          variant='outlined'
          sx={{
            borderColor: 'divider',
            boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
            backdropFilter: 'saturate(110%) blur(10px)',
            maxWidth: '100%',
            mx: 'auto',
          }}
        >
          <CardHeader
            title='Immigration interview prep'
            action={connectionChip}
            sx={{ pb: 0.5 }}
            titleTypographyProps={{ fontSize: '1rem' }}
          />

          {/* Socket Status Banner */}
          {isWaiting && (
            <Box sx={{ px: 2, pb: 2 }}>
              <Alert
                severity="warning"
                sx={{ mb: 2 }}
                icon={<CircularProgress size={20} />}
              >
                <Typography variant="body2" fontWeight="bold">
                  🔒 Hệ thống đang được sử dụng
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Có người khác đang sử dụng hệ thống. Vui lòng chờ đợi...
                </Typography>
                <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
                  💡 Mẹo: Hãy thử lại sau vài phút hoặc liên hệ quản trị viên
                </Typography>
              </Alert>
            </Box>
          )}

          {socketError && (
            <Box sx={{ px: 2, pb: 2 }}>
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => window.location.reload()}
                  >
                    🔄 Thử lại
                  </Button>
                }
              >
                <Typography variant="body2" fontWeight="bold">
                  ❌ Không thể kết nối
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {socketError}
                </Typography>
                <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
                  💡 Mẹo: Kiểm tra kết nối mạng và thử lại
                </Typography>
              </Alert>
            </Box>
          )}

          {/* Welcome Banner */}
          {/* {!connected && !isWaiting && !socketError && (
            <Box sx={{ px: 2, pb: 2 }}>
              <Alert
                severity="info"
                sx={{ mb: 2 }}
              >
                <Typography variant="body2" fontWeight="bold">
                  👋 Chào mừng bạn đến với Hệ thống Phỏng vấn AI
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  📝 Để bắt đầu, hãy nhấn nút "Kết nối" ở góc phải trên
                </Typography>
                <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
                  💡 Sau khi kết nối, bạn có thể điền form và gửi câu hỏi để nhận phản hồi từ AI
                </Typography>
              </Alert>
            </Box>
          )} */}

          {/* Connected Banner */}
          {connected && (
            <Box sx={{ px: 2 }}>
              <Alert
                severity="success"
                sx={{ mb: 0 }}
              >
                {/* <Typography variant="body2" fontWeight="bold">
                  ✅ Đã kết nối thành công
                </Typography> */}
                <Typography variant="body2">
                  Bạn có thể bắt đầu sử dụng hệ thống.
                </Typography>
              </Alert>
            </Box>
          )}

          <CardContent sx={{ pt: 2 }}>
            <Box component='form' onSubmit={handleSubmit}>
              {/* <Typography variant='h6' gutterBottom>
                📋 Thông tin phỏng vấn
              </Typography>
              <Typography variant='body2' color="text.secondary" sx={{ mb: 3 }}>
                💡 Điền đầy đủ thông tin bên dưới để nhận phản hồi chính xác từ AI
              </Typography> */}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, mt: 1, px: 1 }}>
                {/* File đính kèm - Upload */}
                <Box>
                  {isUploading && (
                    <Box sx={{ mb: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={uploadProgress}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            backgroundColor: 'primary.main'
                          }
                        }}
                      />
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        sx={{ mt: 1, display: 'block', fontSize: '0.85rem' }}
                      >
                        Đang upload file... {Math.round(uploadProgress)}%
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
                            sx={{ fontWeight: 600, fontSize: '0.9rem' }}
                          >
                            {formData.fileAttachment.name}
                          </Typography>
                          <Typography variant='caption' color='text.secondary' sx={{ fontSize: '0.85rem' }}>
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
                        p: 2,
                        textAlign: 'center',
                        border: '2px dashed',
                        borderColor: isDragOver ? 'primary.main' : 'grey.600',
                        bgcolor: isDragOver ? 'primary.900' : 'grey.900',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
                        minHeight: 60,
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'primary.900',
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
                          gap: 0.5,
                        }}
                      >
                        <Box
                          sx={{
                            p: 0.5,
                            borderRadius: '50%',
                            bgcolor: isDragOver ? 'primary.800' : 'grey.800',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <CloudUpload
                            sx={{
                              fontSize: 20,
                              color: isDragOver ? 'primary.main' : 'grey.400',
                              transition: 'all 0.3s ease',
                            }}
                          />
                        </Box>
                        <Box>
                          <Typography
                            variant='body2'
                            color={isDragOver ? 'primary.main' : 'text.primary'}
                            sx={{ mb: 0.25, fontWeight: 500, fontSize: '0.9rem' }}
                          >
                            {isDragOver ? '📁 Thả file vào đây' : '📁 Tải file PDF timeline'}
                          </Typography>
                          <Typography variant='caption' color='text.secondary' sx={{ fontSize: '0.8rem' }}>
                            Nhấn để chọn file hoặc kéo thả file vào đây
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

                {/* Câu hỏi và Case Number trên cùng 1 hàng */}
                <Box sx={{ display: 'flex', gap: 2.5 }}>
                  <FormControl sx={{ flex: 1, display: 'none' }} >
                    <InputLabel sx={{ fontSize: '0.95rem' }}>❓ Câu hỏi phỏng vấn</InputLabel>
                    <Select
                      value={formData.question}
                      onChange={handleInputChange('question')}
                      label='❓ Câu hỏi phỏng vấn'
                      sx={{ fontSize: '0.95rem' }}
                    >
                      <MenuItem value='CN2: Xây dựng bộ câu hỏi mới' sx={{ fontSize: '0.95rem' }}>
                        CN2: Xây dựng bộ câu hỏi mới
                      </MenuItem>
                      <MenuItem value='CN1: Phỏng vấn cơ bản' sx={{ fontSize: '0.95rem' }}>
                        Option 2 (chưa có)
                      </MenuItem>
                      <MenuItem value='CN3: Đánh giá năng lực' sx={{ fontSize: '0.95rem' }}>
                        Option 3 (chưa có)
                      </MenuItem>
                      <MenuItem value='CN4: Kiểm tra kỹ thuật' sx={{ fontSize: '0.95rem' }}>
                        Option 4 (chưa có)
                      </MenuItem>
                      <MenuItem value='Khác' sx={{ fontSize: '0.95rem' }}>Khác</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    sx={{
                      flex: 1,
                      '& .MuiInputLabel-root': { fontSize: '0.95rem' },
                      '& .MuiInputBase-input': { fontSize: '0.95rem' },
                      '& .MuiInputBase-input::placeholder': {
                        opacity: 1,
                        color: 'text.secondary',
                        fontSize: '0.95rem'
                      }
                    }}
                    label='📋 Mã khách hàng'
                    value={formData.caseNumber}
                    onChange={handleInputChange('caseNumber')}
                    placeholder='Mã hồ sơ lưu trữ tại ICAVIET (VD: 2025CR11234)'
                  />
                </Box>

                {/* Ngày phỏng vấn và Người đi cùng trên cùng 1 hàng */}
                <Box sx={{ display: 'flex', gap: 2.5 }}>
                  <LocalizationProvider
                    dateAdapter={AdapterDateFns}
                    adapterLocale={vi}
                  >
                    <DatePicker
                      label='📅 Ngày phỏng vấn'
                      value={formData.interviewDate}
                      onChange={handleDateChange}
                      format='dd/MM/yyyy'
                      slotProps={{
                        textField: {
                          sx: {
                            flex: 1,
                            '& .MuiInputLabel-root': { fontSize: '0.95rem' },
                            '& .MuiInputBase-input': { fontSize: '0.95rem' }
                          },
                          error: false,
                        },
                      }}
                    />
                  </LocalizationProvider>

                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel sx={{ fontSize: '0.95rem' }}>👥 Người đi cùng</InputLabel>
                    <Select
                      multiple
                      value={formData.companion}
                      onChange={handleInputChange('companion')}
                      label='👥 Người đi cùng'
                      sx={{ fontSize: '0.95rem' }}
                      renderValue={(selected) => selected.join(', ')}
                    >
                      <MenuItem value='Người bảo lãnh' sx={{ fontSize: '0.95rem' }}>
                        Người bảo lãnh
                      </MenuItem>
                      <MenuItem value='Con đi kèm' sx={{ fontSize: '0.95rem' }}>
                        Con đi kèm
                      </MenuItem>
                      {/* <MenuItem value='Vợ/chồng đi kèm' sx={{ fontSize: '0.95rem' }}>
                        Vợ/chồng đi kèm
                      </MenuItem>
                      <MenuItem value='Người giám hộ' sx={{ fontSize: '0.95rem' }}>
                        Người giám hộ
                      </MenuItem> */}
                    </Select>
                  </FormControl>
                </Box>

                {/* Ghi chú */}
                <TextField
                  fullWidth
                  label='📝 Ghi chú bổ sung'
                  value={formData.notes}
                  onChange={handleInputChange('notes')}
                  placeholder='Tuổi của 2 người, lịch sử hôn nhân, lịch sử xin visa Mỹ, tiền án của NBL nếu có,...'
                  multiline
                  rows={3}
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.95rem' },
                    '& .MuiInputBase-input': { fontSize: '0.95rem' },
                    '& .MuiInputBase-input::placeholder': {
                      opacity: 1,
                      color: 'text.secondary',
                      fontSize: '0.95rem'
                    }
                  }}
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

              {/* ChatGPT Loading State */}
              {isWaitingForChatGPT && (
                <Paper
                  elevation={1}
                  sx={{
                    p: 3,
                    mb: 2,
                    bgcolor: 'info.50',
                    border: '1px solid',
                    borderColor: 'info.200',
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress
                      size={24}
                      sx={{ color: 'info.main' }}
                    />
                    <Box sx={{ width: '100%' }}>
                      <Typography
                        variant='subtitle2'
                        color='info.dark'
                        sx={{ mb: 1, fontWeight: 600 }}
                      >
                        Đang chờ phản hồi từ hệ thống...
                      </Typography>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        sx={{ display: 'block' }}
                      >
                        Vui lòng đợi trong giây lát... ({waitingTime}s)
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              )}

              {/* ChatGPT Response Display */}
              {latestChatGPTMessage && (
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    mb: 2,
                    bgcolor: isChatGPTStreaming ? 'info.50' : 'success.50',
                    border: '1px solid',
                    borderColor: isChatGPTStreaming ? 'info.200' : 'success.200',
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography
                      variant='subtitle2'
                      color={isChatGPTStreaming ? 'info.dark' : 'success.dark'}
                      sx={{ fontWeight: 600 }}
                    >
                      Phản hồi từ AI:
                    </Typography>
                    {isChatGPTStreaming && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CircularProgress size={16} sx={{ color: 'info.main' }} />
                        <Typography variant='caption' color='info.main' sx={{ fontWeight: 500 }}>
                          Đang gõ...
                        </Typography>
                      </Box>
                    )}
                    {isChatGPTComplete && !isChatGPTStreaming && (
                      <Typography variant='caption' color='success.main' sx={{ fontWeight: 500 }}>
                        ✓ Hoàn thành
                      </Typography>
                    )}
                  </Box>
                  {/* <Typography variant='body2' sx={{ mb: 1 }}>
                {latestChatGPTMessage.text}
              </Typography> */}

                  {/* Google Doc Link */}
                  {/* {latestChatGPTMessage.googleDocUrl && (
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
              )} */}

                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ mt: 1, display: 'block' }}
                  >
                    {new Date(latestChatGPTMessage.ts).toLocaleString('vi-VN')}
                  </Typography>
                </Paper>
              )}

              <Box sx={{ display: 'flex', gap: 2.5 }}>
                <Button
                  type='submit'
                  variant='contained'
                  size='large'
                  onClick={handleSubmit}
                  disabled={!connected || isSubmitting || isUploading || isWaitingForChatGPT}
                  startIcon={
                    isUploading || isSubmitting || isWaitingForChatGPT ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : null
                  }
                  sx={{
                    py: 1.3,
                    flex: 1,
                    fontWeight: 'bold',
                    fontSize: '0.75rem'
                  }}
                >
                  {isUploading
                    ? '📤 Đang tải file...'
                    : isSubmitting
                      ? '🚀 Đang gửi câu hỏi...'
                      : isWaitingForChatGPT
                        ? '⏳ Đang chờ AI trả lời...'
                        : '🤖 Yêu cầu bộ câu hỏi phỏng vấn'}
                </Button>

                <Button
                  variant='outlined'
                  size='large'
                  onClick={handleExportToGoogle}
                  disabled={!latestChatGPTMessage || isExporting || isChatGPTStreaming || !isChatGPTComplete}
                  // startIcon={<FileDownload />}
                  sx={{
                    py: 1.3,
                    minWidth: 130,
                    fontWeight: 'bold',
                    fontSize: '0.75rem'
                  }}
                >
                  {isExporting
                    ? '📄 Đang xuất...'
                    : isChatGPTStreaming
                      ? '⏳ Đang chờ ChatGPT...'
                      : '📄 Xuất File'
                  }
                </Button>
              </Box>
            </Box>
          </CardActions>

          {/* Export Modal */}
          <Dialog
            open={exportModalOpen}
            onClose={() => { }} // Tắt chức năng đóng khi click bên ngoài
            maxWidth="sm"
            fullWidth
            disableEscapeKeyDown // Tắt chức năng đóng bằng phím Escape
            PaperProps={{
              sx: {
                borderRadius: 2,
                boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
                bgcolor: 'background.paper',
                color: 'text.primary',
              }
            }}
          >
            <DialogTitle sx={{
              pb: 1,
              color: 'text.primary',
              fontWeight: 'bold',
              fontSize: '1.1rem'
            }}>
              {exportSuccess ? '🎉 Xuất file thành công!' : '📄 Đang xuất file...'}
            </DialogTitle>
            <DialogContent sx={{
              pt: 2,
              color: 'text.primary'
            }}>
              {!exportSuccess ? (
                // Loading state
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                  <Box sx={{ width: '100%', mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                        🔄 Đang tạo Google Doc...
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                        {Math.round(exportProgress)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={exportProgress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'grey.800',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          backgroundColor: exportProgress >= 100 ? 'success.main' : 'primary.main'
                        }
                      }}
                    />
                  </Box>

                  <Typography variant="h6" color="text.primary" sx={{ mb: 1, fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {exportProgress < 90 ? '⚙️ Đang xử lý dữ liệu...' : '📄 Đang tạo tài liệu...'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ fontSize: '0.9rem' }}>
                    {exportProgress < 90
                      ? 'Vui lòng đợi trong giây lát, chúng tôi đang xử lý dữ liệu của bạn.'
                      : 'Đang tạo Google Doc, vui lòng đợi thêm chút nữa...'
                    }
                  </Typography>
                </Box>
              ) : (
                // Success state
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      bgcolor: 'success.100',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                    }}
                  >
                    <FileDownload sx={{ fontSize: 32, color: 'success.main' }} />
                  </Box>

                  <Typography variant="h6" color="success.main" sx={{ mb: 2, textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    🎉 Google Doc đã được tạo thành công!
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center', fontSize: '0.9rem', px: 2 }}>
                    💡 Tôi sẽ tự động ngắt kết nối để cho người khác sử dụng. Nếu bạn có nhu cầu tạo câu hỏi tiếp thì nhấn nút "kết nối" lại nhé.
                  </Typography>

                  {exportedDocUrl ? (
                    <Box sx={{ width: '100%', textAlign: 'center' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        href={exportedDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          py: 1.3,
                          px: 4,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '1rem',
                          fontWeight: 600,
                        }}
                      >
                        📄 Mở Google Doc
                      </Button>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', fontSize: '0.85rem' }}>
                        💡 Click vào nút trên để mở Google Doc trong tab mới
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ fontSize: '0.9rem' }}>
                      ✅ File đã được xuất thành công!
                    </Typography>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{
              p: 3,
              pt: 1,
              bgcolor: 'background.paper',
              borderTop: '1px solid',
              borderColor: 'divider'
            }}>
              <Button
                onClick={handleCloseExportModal}
                variant="outlined"
                size="large"
                sx={{
                  minWidth: 110,
                  fontWeight: 'bold',
                  fontSize: '0.95rem'
                }}
              >
                {exportSuccess ? '✅ OK' : '❌ Hủy'}
              </Button>
            </DialogActions>
          </Dialog>
        </Card>
      </Box>
    </Box>
  );
}
