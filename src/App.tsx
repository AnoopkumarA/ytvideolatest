import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Container, Box, Stack } from '@mui/material';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import theme from './theme';
import Header from './components/Header';
import URLInput from './components/URLInput';
import DownloadButtons from './components/DownloadButtons';
import StatusDisplay from './components/StatusDisplay';
import Footer from './components/Footer';

const createEmotionCache = () => {
  return createCache({
    key: 'mui',
    prepend: true,
  });
};

const emotionCache = createEmotionCache();

export default function App() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVideoDownload = async () => {
    if (!url.trim()) {
      setStatus('Please enter a YouTube URL');
      return;
    }
    
    setIsLoading(true);
    setStatus('Downloading video...');
    
    try {
      const resp = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed');
      setStatus('Download complete: ' + data.filename);
    } catch (err) {
      setStatus('Error: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioDownload = async () => {
    if (!url.trim()) {
      setStatus('Please enter a YouTube URL');
      return;
    }
    
    setIsLoading(true);
    setStatus('Downloading MP3...');
    
    try {
      const resp = await fetch('/api/download-mp3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, bitrate: 192 }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'MP3 download failed');
      setStatus('MP3 ready: ' + data.filename);
    } catch (err) {
      setStatus('Error: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: 'background.default'
        }}>
          <Header />
          
          <Container maxWidth="md" sx={{ flex: 1, py: 6 }}>
            <Stack spacing={4} alignItems="center">
              <Box sx={{ width: '100%', maxWidth: 600 }}>
                <URLInput value={url} onChange={setUrl} />
              </Box>
              
              <DownloadButtons
                onVideoDownload={handleVideoDownload}
                onAudioDownload={handleAudioDownload}
                isLoading={isLoading}
              />
              
              {status && (
                <Box sx={{ width: '100%', maxWidth: 600 }}>
                  <StatusDisplay status={status} isLoading={isLoading} />
                </Box>
              )}
            </Stack>
          </Container>
          
          <Footer />
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
}