import { useEffect, useRef, useState, useCallback } from 'react';

// thin wrapper around the browser Web Speech API. gracefully reports unsupported
// so the UI can just hide the mic button instead of breaking.
export const useSpeech = (onResult) => {
  const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const supported = Boolean(Recognition);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    if (!supported) return undefined;
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      if (transcript) onResultRef.current(transcript.trim());
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    return () => { try { recognition.stop(); } catch { /* already stopped */ } };
  }, [supported, Recognition]);

  const toggle = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      try { rec.start(); setListening(true); } catch { /* start() throws if already running */ }
    }
  }, [listening]);

  return { supported, listening, toggle };
};
