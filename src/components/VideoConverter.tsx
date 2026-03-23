import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import DropZone from "./DropZone";
import DownloadCard from "./DownloadCard";
import { FileVideo, RefreshCw, X } from "lucide-react";

type OutputFormat = "mp4" | "mp3" | "webm" | "muted" | "audio";

interface ConvertedFile {
  url: string;
  filename: string;
  label: string;
  size: string;
}

const FORMAT_OPTIONS: { value: OutputFormat; label: string; desc: string }[] = [
  { value: "mp4",   label: "MP4",          desc: "Convert to MP4 video" },
  { value: "webm",  label: "WebM",         desc: "Convert to WebM video" },
  { value: "mp3",   label: "MP3 / Audio",  desc: "Extract audio track" },
  { value: "muted", label: "Mute Video",   desc: "Remove audio from video" },
];

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const VideoConverter = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [format, setFormat] = useState<OutputFormat>("mp4");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ConvertedFile | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const handleFile = (f: File) => {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
    setProgress(0);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreviewUrl("");
    setResult(null);
    setProgress(0);
  };

  // Extract audio using Web Audio API + MediaRecorder
  const extractAudio = (): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.src = previewUrl;
      video.crossOrigin = "anonymous";

      video.addEventListener("canplay", () => {
        const ctx = new AudioContext();
        const src = ctx.createMediaElementSource(video);
        const dest = ctx.createMediaStreamDestination();
        src.connect(dest);

        const recorder = new MediaRecorder(dest.stream);
        const chunks: BlobPart[] = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => resolve(new Blob(chunks, { type: "audio/webm" }));
        recorder.onerror = reject;

        video.ontimeupdate = () => {
          const pct = (video.currentTime / video.duration) * 100;
          setProgress(Math.min(Math.round(pct), 99));
        };
        video.onended = () => { recorder.stop(); ctx.close(); };

        recorder.start();
        video.play().catch(reject);
      });

      video.onerror = reject;
      video.load();
    });

  // Mute video: capture canvas frames without audio
  const muteVideo = (): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.src = previewUrl;
      video.muted = true;

      video.addEventListener("loadedmetadata", () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d")!;

        const stream = canvas.captureStream();
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8" });
        const chunks: BlobPart[] = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
        recorder.onerror = reject;

        const draw = () => {
          if (video.ended || video.paused) return;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const pct = (video.currentTime / video.duration) * 100;
          setProgress(Math.min(Math.round(pct), 99));
          requestAnimationFrame(draw);
        };

        recorder.start(100);
        video.play().then(draw).catch(reject);
        video.onended = () => recorder.stop();
      });

      video.onerror = reject;
      video.load();
    });

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(5);
    setResult(null);

    try {
      let blob: Blob;
      let ext: string;
      let label: string;

      if (format === "mp3" || format === "audio") {
        blob = await extractAudio();
        ext = "webm";
        label = "Extracted Audio";
      } else if (format === "muted") {
        blob = await muteVideo();
        ext = "webm";
        label = "Muted Video";
      } else {
        // For mp4/webm: re-wrap using MediaRecorder from the video stream
        // Browser can only record in webm natively; we output as-is
        blob = await muteVideoWithAudio();
        ext = "webm";
        label = format === "mp4" ? "Converted MP4 (WebM container)" : "Converted WebM";
      }

      setProgress(100);
      const url = URL.createObjectURL(blob);
      const baseName = file.name.replace(/\.[^.]+$/, "");
      setResult({
        url,
        filename: `${baseName}-mianconvert.${ext}`,
        label,
        size: formatBytes(blob.size),
      });
    } catch (err) {
      toast({ variant: "destructive", title: "Conversion failed", description: "Something went wrong. Try a different file or format." });
    } finally {
      setProcessing(false);
    }
  };

  // Re-record video with audio (passthrough)
  const muteVideoWithAudio = (): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.src = previewUrl;

      video.addEventListener("loadedmetadata", () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d")!;

        const audioCtx = new AudioContext();
        const audioSrc = audioCtx.createMediaElementSource(video);
        const audioDest = audioCtx.createMediaStreamDestination();
        audioSrc.connect(audioDest);
        audioSrc.connect(audioCtx.destination);

        const videoStream = canvas.captureStream();
        const combined = new MediaStream([
          ...videoStream.getVideoTracks(),
          ...audioDest.stream.getAudioTracks(),
        ]);

        const recorder = new MediaRecorder(combined, { mimeType: "video/webm;codecs=vp8,opus" });
        const chunks: BlobPart[] = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => { audioCtx.close(); resolve(new Blob(chunks, { type: "video/webm" })); };
        recorder.onerror = reject;

        const draw = () => {
          if (video.ended || video.paused) return;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const pct = (video.currentTime / video.duration) * 100;
          setProgress(Math.min(Math.round(pct), 99));
          requestAnimationFrame(draw);
        };

        recorder.start(100);
        video.play().then(draw).catch(reject);
        video.onended = () => recorder.stop();
      });

      video.onerror = reject;
      video.load();
    });

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone onFile={handleFile} />
      ) : (
        <div className="space-y-5">
          {/* Preview */}
          <div className="relative rounded-2xl overflow-hidden bg-black shadow-xl">
            <video
              ref={videoRef}
              src={previewUrl}
              controls
              className="w-full max-h-72 object-contain"
            />
            <button
              onClick={reset}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* File info */}
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <FileVideo className="w-4 h-4 shrink-0" />
            <span className="truncate font-medium">{file.name}</span>
            <span className="shrink-0 text-gray-400">({formatBytes(file.size)})</span>
          </div>

          {/* Format selector */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Choose output format</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormat(opt.value)}
                  className={`rounded-xl border-2 px-3 py-3 text-left transition-all ${
                    format === opt.value
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
                      : "border-gray-200 dark:border-gray-700 hover:border-violet-300 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <p className="font-semibold text-sm">{opt.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Convert button */}
          {!result && (
            <Button
              onClick={handleConvert}
              disabled={processing}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11 text-base"
            >
              {processing ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                "Convert Now"
              )}
            </Button>
          )}

          {/* Progress */}
          {processing && (
            <div className="space-y-1">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-500 text-right">{progress}%</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">Done! Your file is ready.</p>
              <DownloadCard
                url={result.url}
                filename={result.filename}
                label={result.label}
                size={result.size}
              />
              <Button variant="outline" onClick={reset} className="w-full">
                Convert another file
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoConverter;
