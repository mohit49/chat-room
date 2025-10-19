'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square, Play, Pause, Trash2 } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export default function AudioRecorder({ onRecordingComplete, onCancel, disabled }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Request microphone permission and initialize recorder
  const initializeRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setRecordedAudio(audioBlob);
        audioChunksRef.current = [];
      };
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  // Start recording
  const startRecording = async () => {
    if (!mediaRecorderRef.current) {
      await initializeRecorder();
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordedAudio(null);

      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setIsRecording(false);
      setIsPaused(false);
    }
  };

  // Cancel recording
  const cancelRecording = () => {
    stopRecording();
    setRecordedAudio(null);
    setRecordingTime(0);
    if (onCancel) {
      onCancel();
    }
  };

  // Send recorded audio
  const sendAudio = () => {
    if (recordedAudio) {
      onRecordingComplete(recordedAudio);
      setRecordedAudio(null);
      setRecordingTime(0);
    }
  };

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="flex items-center space-x-2 shrink-0">
      {!isRecording && !recordedAudio ? (
        <Button
          size="icon"
          variant="outline"
          onClick={startRecording}
          disabled={disabled}
          className="h-10 w-10 border-2 border-red-500 hover:bg-red-50 bg-white shadow-md shrink-0"
          title="Start recording"
        >
          <Mic className="h-5 w-5 text-red-600" />
        </Button>
      ) : recordedAudio ? (
        // Show recorded audio preview
        <div className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
          <div className="flex-1">
            <div className="text-sm font-medium">Voice message</div>
            <div className="text-xs text-muted-foreground">{formatTime(recordingTime)}</div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={cancelRecording}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={sendAudio}
            className="h-8 w-8 p-0"
          >
            <Play className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            {formatTime(recordingTime)}
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={isPaused ? resumeRecording : pauseRecording}
            className="h-8 w-8 p-0"
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={stopRecording}
            className="h-8 w-8 p-0"
          >
            <Square className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={cancelRecording}
            className="h-8 w-8 p-0"
          >
            <MicOff className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}

