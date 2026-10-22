import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Download, Loader2, Mail, RefreshCw, Check, X } from "lucide-react";
import blackIrishImg from "@/assets/black-irish-masquerade.jpg.asset.json";
import mexxoImg from "@/assets/mexxo-masquerade.jpg.asset.json";
import mariahImg from "@/assets/mariah-carey-masquerade.jpg.asset.json";
import logoImg from "@/assets/black-irish-logo.jpg.asset.json";
import { SCENES, cleanName, isValidEmail, isValidName, type SceneId } from "@/lib/kiosk";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Royal Wine Masquerade — Photo Kiosk" },
      { name: "description", content: "Create an AI masquerade portrait with Black Irish, MEXXO or Mariah Carey." },
      { property: "og:title", content: "Royal Wine Masquerade — Photo Kiosk" },
      { property: "og:description", content: "Create an AI masquerade portrait at the Royal Wine event." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Kiosk,
});

const SCENE_IMG: Record<SceneId, string> = {
  "black-irish": blackIrishImg.url,
  mexxo: mexxoImg.url,
  mariah: mariahImg.url,
};

type Phase = "home" | "camera" | "countdown" | "review" | "generating" | "result";
type CamState = "idle" | "starting" | "live" | "denied" | "unavailable";
type MailStage = "closed" | "editing" | "confirm" | "queued" | "sending" | "sent" | "error";
const MAX_ATTEMPTS = 3;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("image load failed"));
    img.src = src;
  });
}

function canvasToBlob(c: HTMLCanvasElement, q = 0.9): Promise<Blob> {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("encode failed"))), "image/jpeg", q));
}

function drawScaled(src: CanvasImageSource, w: number, h: number, max = 1536) {
  const s = Math.min(1, max / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * s);
  c.height = Math.round(h * s);
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable");
  ctx.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

/** Composite brand plaque + AI label on the generated portrait. Returns bare base64 JPEG + data URL. */
async function composite(b64: string, scene: SceneId, mimeType = "image/jpeg") {
  const img = await loadImage(`data:${mimeType};base64,${b64}`);
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable");
  ctx.drawImage(img, 0, 0);
  const pad = Math.round(c.width * 0.03);
  if (scene === "black-irish") {
    try {
      const logo = await loadImage(logoImg.url);
      const w = Math.round(c.width * 0.26);
      const h = Math.round((w * logo.naturalHeight) / logo.naturalWidth);
      const x = c.width - w - pad;
      const y = c.height - h - pad;
      ctx.fillStyle = "rgba(250,246,236,0.94)";
      ctx.beginPath();
      ctx.roundRect(x - 8, y - 8, w + 16, h + 16, 10);
      ctx.fill();
      ctx.drawImage(logo, x, y, w, h);
    } catch {
      /* logo optional */
    }
  }
  const label = "AI-created portrait";
  const fs = Math.max(14, Math.round(c.width * 0.02));
  ctx.font = `600 ${fs}px Manrope, sans-serif`;
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = "rgba(10,20,16,0.6)";
  ctx.beginPath();
  ctx.roundRect(pad, c.height - pad - fs * 1.8, tw + fs * 1.4, fs * 1.8, fs * 0.9);
  ctx.fill();
  ctx.fillStyle = "rgba(250,246,236,0.95)";
  ctx.fillText(label, pad + fs * 0.7, c.height - pad - fs * 0.55);
  const dataUrl = c.toDataURL("image/jpeg", 0.88);
  return { dataUrl, b64: dataUrl.split(",")[1] ?? "" };
}

function Kiosk() {
  const [phase, setPhase] = useState<Phase>("home");
  const [scene, setScene] = useState<SceneId>("black-irish");
  const [count, setCount] = useState(1);
  const [frameReady, setFrameReady] = useState(false);
  const [cam, setCam] = useState<CamState>("idle");
  const [countdown, setCountdown] = useState(5);
  const [source, setSource] = useState<{ blob: Blob; url: string } | null>(null);
  const [output, setOutput] = useState<{ dataUrl: string; b64: string; id: string; gen: number } | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [mail, setMail] = useState<MailStage>("closed");
  const [mailError, setMailError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef(0); // bumps on Finish / Start over
  const mediaOpRef = useRef(0); // bumps whenever a pending camera/capture is superseded
  const genRef = useRef(0); // bumps on each generation request
  const queuedGenRef = useRef(-1); // generation the "Send when ready" confirmation belongs to
  const outputRef = useRef<typeof output>(null);
  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const sendingRef = useRef(false);
  const sentKeysRef = useRef(new Set<string>());
  const timerRef = useRef<number | null>(null);
  const sourceUrlRef = useRef<string | null>(null);
  outputRef.current = output;

  const clearTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  /** Stops the camera and invalidates any pending getUserMedia/capture. */
  const stopMedia = useCallback(() => {
    mediaOpRef.current += 1;
    clearTimer();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setFrameReady(false);
    setCam("idle");
  }, []);

  const startCamera = useCallback(async () => {
    stopMedia();
    const op = mediaOpRef.current;
    setNotice(null);
    setPhase("camera");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCam("unavailable");
      return;
    }
    setCam("starting");
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      if (op !== mediaOpRef.current) {
        s.getTracks().forEach((t) => t.stop()); // superseded: never leave a late camera running
        return;
      }
      streamRef.current = s;
      for (const track of s.getVideoTracks()) {
        track.addEventListener("ended", () => {
          if (streamRef.current !== s) return;
          stopMedia();
          setCam("unavailable");
          setPhase("camera");
        }, { once: true });
      }
      setCam("live");
    } catch (e) {
      if (op !== mediaOpRef.current) return;
      const n = (e as DOMException)?.name;
      setCam(n === "NotAllowedError" || n === "SecurityError" ? "denied" : "unavailable");
    }
  }, [stopMedia]);

  useEffect(() => {
    if (cam === "live" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cam, phase]);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      clearTimer();
      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    },
    [],
  );

  const setSourceBlob = (blob: Blob) => {
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    const url = URL.createObjectURL(blob);
    sourceUrlRef.current = url;
    setSource({ blob, url });
  };

  const capture = async () => {
    const op = mediaOpRef.current;
    const v = videoRef.current;
    try {
      if (cam !== "live" || !frameReady || !v || !v.videoWidth || !streamRef.current?.getVideoTracks().some((t) => t.readyState === "live")) throw new Error("no frame");
      const c = drawScaled(v, v.videoWidth, v.videoHeight); // unmirrored full frame
      const blob = await canvasToBlob(c);
      if (op !== mediaOpRef.current) return;
      stopMedia();
      setSourceBlob(blob);
      setPhase("review");
    } catch {
      if (op !== mediaOpRef.current) return;
      setNotice("The photo couldn't be captured. Retry the camera, or start over.");
      setPhase("camera");
    }
  };

  const startCountdown = () => {
    if (timerRef.current || cam !== "live" || !frameReady || !streamRef.current?.getVideoTracks().some((t) => t.readyState === "live")) return;
    setCountdown(5);
    setPhase("countdown");
    let n = 5;
    timerRef.current = window.setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearTimer();
        void capture();
      } else setCountdown(n);
    }, 1000);
  };

  const cancelCountdown = () => {
    mediaOpRef.current += 1; // discard a frame still encoding when the timer is cancelled
    clearTimer();
    setPhase("camera");
  };

  const generate = async () => {
    if (busyRef.current || !source) return;
    busyRef.current = true;
    const session = sessionRef.current;
    const gen = ++genRef.current;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setGenError(null);
    setOutput(null);
    setPhase("generating");
    setAttempts((a) => a + 1);
    try {
      const fd = new FormData();
      fd.set("scene", scene);
      fd.set("guestCount", String(count));
      fd.set("guest", new File([source.blob], "guest.jpg", { type: "image/jpeg" }));
      const res = await fetch("/api/generate", { method: "POST", body: fd, signal: ctrl.signal });
      const json = await res.json().catch(() => ({}));
      if (session !== sessionRef.current || gen !== genRef.current) return;
      if (!res.ok || !json.imageBase64) throw new Error(json.error || "The portrait could not be created.");
      const out = await composite(json.imageBase64, scene, json.mimeType);
      if (session !== sessionRef.current || gen !== genRef.current) return;
      setOutput({ ...out, id: crypto.randomUUID(), gen });
      setPhase("result");
    } catch (e) {
      if (session !== sessionRef.current || ctrl.signal.aborted) return;
      setGenError((e as Error).message || "Something went wrong.");
    } finally {
      if (session === sessionRef.current) busyRef.current = false;
    }
  };

  const sendEmail = useCallback(async () => {
    const out = outputRef.current;
    if (!out || sendingRef.current) return;
    const key = `${out.id}\n${email.trim().toLowerCase()}\n${cleanName(name)}`;
    if (sentKeysRef.current.has(key)) {
      setMail("sent");
      return;
    }
    sendingRef.current = true;
    const session = sessionRef.current;
    setMail("sending");
    setMailError(null);
    try {
      const res = await fetch("/api/send-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: cleanName(name), imageBase64: out.b64 }),
      });
      const json = await res.json().catch(() => ({}));
      if (session !== sessionRef.current || outputRef.current?.id !== out.id) return;
      if (!res.ok || json.ok !== true) throw new Error(json.error || "Email could not be sent.");
      sentKeysRef.current.add(key);
      setMail("sent");
    } catch (e) {
      if (session !== sessionRef.current || outputRef.current?.id !== out.id) return;
      setMailError((e as Error).message);
      setMail("error");
    } finally {
      if (session === sessionRef.current) sendingRef.current = false;
    }
  }, [email, name]);

  // Send only after explicit confirmation for THIS generation AND a real finished portrait.
  useEffect(() => {
    if (mail === "queued" && output && output.gen === queuedGenRef.current) void sendEmail();
  }, [mail, output, sendEmail]);

  const confirmSend = () => {
    queuedGenRef.current = genRef.current;
    setMail("queued");
  };

  const finish = () => {
    sessionRef.current += 1;
    genRef.current += 1;
    queuedGenRef.current = -1;
    abortRef.current?.abort();
    busyRef.current = false;
    sendingRef.current = false;
    sentKeysRef.current = new Set();
    stopMedia();
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    sourceUrlRef.current = null;
    setSource(null);
    setOutput(null);
    setGenError(null);
    setNotice(null);
    setAttempts(0);
    setEmail("");
    setName("");
    setMail("closed");
    setMailError(null);
    setScene("black-irish");
    setCount(1);
    setPhase("home");
  };

  const tryAnother = () => {
    if (mail === "sending") return;
    queuedGenRef.current = -1;
    setOutput(null);
    setAttempts(0);
    setMail((m) => (m === "sent" ? "closed" : m === "queued" ? "confirm" : m));
    setPhase("review");
  };

  const busy = phase === "generating" && !genError;
  const showSetup = phase === "home" || phase === "review" || phase === "camera";
  const sceneObj = SCENES.find((s) => s.id === scene);
  if (!sceneObj) return null;

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-[1080px] flex-col gap-2 px-3 pt-2 sm:gap-5 sm:px-6 sm:pt-5">
      <header className="flex items-center justify-center gap-3 sm:gap-5">
        <div className="shrink-0 rounded-lg bg-plaque px-2.5 py-1 shadow-[var(--shadow-gold)] sm:px-3 sm:py-1.5">
          <img src={logoImg.url} alt="Black Irish Irish Cream" className="h-9 w-auto sm:h-16" />
        </div>
        <div className="min-w-0 text-center">
          <p className="eyebrow">Royal Wine</p>
          <h1 className="truncate text-xl font-semibold leading-tight text-ivory sm:text-4xl">Masquerade Portraits</h1>
        </div>
      </header>

      <section
        aria-live="polite"
        className="gold-frame relative flex min-h-[24dvh] flex-1 items-center justify-center overflow-hidden rounded-2xl bg-stage sm:min-h-[38dvh]"
      >
        {phase === "home" && (
          <div className="flex flex-col items-center gap-2 p-4 text-center sm:gap-3 sm:p-6">
            <Camera className="h-8 w-8 text-gold sm:h-12 sm:w-12" aria-hidden />
            <h2 className="text-2xl font-semibold text-ivory sm:text-5xl">Create your portrait</h2>
            <p className="max-w-md text-sm text-muted-foreground sm:text-lg">
              Choose your scene and number of guests. We'll style your formal portrait.
            </p>
          </div>
        )}

        {(phase === "camera" || phase === "countdown") && (
          <>
            {cam === "live" && (
              <video ref={videoRef} onLoadedData={() => setFrameReady(true)} onEmptied={() => setFrameReady(false)} playsInline muted className="absolute inset-0 h-full w-full -scale-x-100 object-contain" />
            )}
            {cam === "starting" && <Loader2 className="h-10 w-10 animate-spin text-gold" aria-label="Starting camera" />}
            {(cam === "denied" || cam === "unavailable") && (
              <div className="flex max-w-sm flex-col items-center gap-3 p-4 text-center">
                <p className="text-base text-ivory sm:text-lg">
                  {cam === "denied"
                    ? "Camera access was blocked. Allow camera access in your browser settings, then retry."
                    : "No camera is available. Check that a camera is connected and not in use by another app, then retry."}
                </p>
                <button className="btn btn-outline" onClick={startCamera}>
                  <RefreshCw className="h-5 w-5" /> Retry camera
                </button>
              </div>
            )}
            {phase === "countdown" && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-stage/30">
                <span key={countdown} className="animate-count font-serif text-[7rem] font-bold leading-none text-ivory drop-shadow-lg sm:text-[9rem]">
                  {countdown}
                </span>
              </div>
            )}
          </>
        )}

        {(phase === "review" || phase === "generating") && source && (
          <img
            src={source.url}
            alt="Your captured photo"
            className={`absolute inset-0 h-full w-full object-contain ${phase === "generating" ? "opacity-40 blur-[2px]" : ""}`}
          />
        )}

        {phase === "generating" && (
          <div className="relative z-10 m-3 flex max-w-sm flex-col items-center gap-3 rounded-2xl bg-background/85 p-5 text-center">
            {genError ? (
              <>
                <p className="text-lg text-ivory" role="alert">{genError}</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {attempts < MAX_ATTEMPTS && (
                    <button className="btn btn-gold" onClick={generate}>
                      <RefreshCw className="h-5 w-5" /> Try again
                    </button>
                  )}
                  <button className="btn btn-outline" onClick={() => { setGenError(null); setPhase("review"); }}>
                    Back to photo
                  </button>
                </div>
                {attempts >= MAX_ATTEMPTS && <p className="text-sm text-muted-foreground">Please ask staff for help, or start over.</p>}
              </>
            ) : (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-gold" aria-hidden />
                <p className="font-serif text-2xl text-ivory">Creating your {sceneObj.title} portrait…</p>
                <p className="text-sm text-muted-foreground">Your illustrated portrait is being painted.</p>
                <div className="shimmer h-1 w-40 rounded-full" />
              </>
            )}
          </div>
        )}

        {phase === "result" && output && (
          <img src={output.dataUrl} alt="Your AI masquerade portrait" className="absolute inset-0 h-full w-full object-contain" />
        )}

        {notice && (
          <p role="alert" className="absolute inset-x-3 bottom-3 z-20 rounded-xl bg-background/90 p-3 text-center text-sm text-ivory">
            {notice}
          </p>
        )}
      </section>


      {showSetup && (
        <section aria-label="Portrait options" className="flex flex-col gap-2 sm:gap-4">
          <div role="group" aria-label="Choose a scene" className="grid grid-cols-3 gap-2 sm:gap-4">
            {SCENES.map((s) => (
              <button key={s.id} aria-pressed={scene === s.id} onClick={() => setScene(s.id)} className="scene-card">
                <img src={SCENE_IMG[s.id]} alt="" className="aspect-[5/4] w-full object-cover object-top sm:aspect-[3/4]" />
                <div className="p-1.5 sm:p-3">
                  <p className="font-serif text-[0.95rem] font-semibold leading-tight text-ivory sm:text-xl">{s.title}</p>
                  <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">{s.subtitle}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="eyebrow mr-1">Guests</span>
            {[1, 2, 3].map((n) => (
              <button key={n} aria-pressed={count === n} aria-label={`${n} guest${n > 1 ? "s" : ""}`} className="chip min-w-[52px]" onClick={() => setCount(n)}>
                {n}
              </button>
            ))}
          </div>

          {count > 1 && <p className="text-xs text-muted-foreground">Order guests left to right as they stand in the photo.</p>}
        </section>
      )}

      <section aria-label="Actions" className="sticky bottom-0 z-30 -mx-3 flex flex-wrap items-center justify-center gap-2 bg-background/95 px-3 py-2 backdrop-blur sm:mx-0 sm:gap-3 sm:bg-transparent sm:py-0 sm:backdrop-blur-none">
        {phase === "home" && (
          <>
            <button className="btn btn-gold flex-1 text-base sm:max-w-[320px] sm:text-lg" onClick={startCamera}>
              <Camera className="h-5 w-5" /> Create your portrait
            </button>
          </>
        )}
        {phase === "camera" && (
          <>
            {(cam === "live" || cam === "starting") && <button className="btn btn-gold flex-1 sm:max-w-[320px] sm:text-lg" disabled={cam !== "live" || !frameReady} onClick={startCountdown}>
              I'm ready — 5s timer
            </button>}
            {cam !== "denied" && cam !== "unavailable" && <button className="btn-quiet" onClick={() => { stopMedia(); setNotice(null); setPhase(source ? "review" : "home"); }}>Back</button>}
          </>
        )}
        {phase === "countdown" && (
          <button className="btn btn-outline" onClick={cancelCountdown}>Cancel timer</button>
        )}
        {phase === "review" && (
          <>
            <button className="btn btn-outline" onClick={startCamera}>
              <RefreshCw className="h-5 w-5" /> Retake
            </button>
            <button className="btn btn-gold flex-1 sm:max-w-[320px] sm:text-lg" disabled={busy} onClick={() => { setAttempts(0); void generate(); }}>
              Create portrait
            </button>
          </>
        )}
        {phase === "result" && output && (
          <>
            <a className="btn btn-gold" href={output.dataUrl} download="royal-wine-masquerade.jpg">
              <Download className="h-5 w-5" /> Save image
            </a>
            {mail === "closed" && (
              <button className="btn btn-outline" onClick={() => setMail("editing")}>
                <Mail className="h-5 w-5" /> Email portrait
              </button>
            )}
            <button className="btn btn-outline" disabled={mail === "sending"} onClick={tryAnother}>Try another look</button>
            <button className="btn btn-outline" onClick={finish}>Finish</button>
          </>
        )}
        {phase !== "home" && phase !== "result" && (
          <button className="btn-quiet" onClick={finish}>Start over</button>
        )}
      </section>

      {(phase === "generating" || phase === "result") && (
        <EmailPanel
          email={email}
          name={name}
          stage={mail}
          error={mailError}
          ready={!!output}
          onEmail={setEmail}
          onName={setName}
          onStage={setMail}
          onConfirm={confirmSend}
        />
      )}

      <footer className="pb-3 text-center text-xs text-muted-foreground">
        Your photo is processed to create your AI portrait. Finish clears this kiosk session. AI-created portraits; no celebrity endorsement implied.
      </footer>
    </main>
  );
}

function EmailPanel(p: {
  email: string;
  name: string;
  stage: MailStage;
  error: string | null;
  ready: boolean;
  onEmail: (v: string) => void;
  onName: (v: string) => void;
  onStage: (s: MailStage) => void;
  onConfirm: () => void;
}) {
  const valid = isValidEmail(p.email) && isValidName(p.name);
  if (p.stage === "closed")
    return p.ready ? null : (
      <div className="flex justify-center">
        <button className="btn btn-outline" onClick={() => p.onStage("editing")}>
          <Mail className="h-5 w-5" /> Email my portrait (optional)
        </button>
      </div>
    );
  return (
    <section aria-label="Email my portrait" className="mx-auto w-full max-w-xl rounded-2xl border border-border bg-card p-4">
      {p.stage === "editing" && (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) p.onStage("confirm");
          }}
        >
          <label className="flex flex-col gap-1 text-sm text-muted-foreground">
            Email
            <input className="field" type="email" inputMode="email" autoComplete="email" required maxLength={254} value={p.email} onChange={(e) => p.onEmail(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-muted-foreground">
            Name
            <input className="field" type="text" autoComplete="name" required minLength={2} maxLength={120} value={p.name} onChange={(e) => p.onName(e.target.value)} />
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn btn-gold" disabled={!valid}>Review</button>
            <button type="button" className="btn-quiet" onClick={() => p.onStage("closed")}>Cancel</button>
          </div>
        </form>
      )}
      {p.stage === "confirm" && (
        <div className="flex flex-col gap-3">
          <p className="text-ivory">
            Send to <strong className="break-all text-gold">{p.email.trim()}</strong>
            {" "}for {cleanName(p.name)}?
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="btn btn-gold" onClick={p.onConfirm}>
              <Check className="h-5 w-5" /> {p.ready ? "Send now" : "Send when ready"}
            </button>
            <button className="btn btn-outline" onClick={() => p.onStage("editing")}>Edit</button>
          </div>
        </div>
      )}
      {(p.stage === "queued" || p.stage === "sending") && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-ivory">
            {p.stage === "sending" || p.ready ? "Sending your portrait…" : `We'll email ${p.email.trim()} as soon as your portrait is ready.`}
          </p>
          {p.stage === "queued" && !p.ready && (
            <button className="btn btn-outline shrink-0" onClick={() => p.onStage("editing")}>
              <X className="h-5 w-5" /> Change
            </button>
          )}
        </div>
      )}
      {p.stage === "sent" && <p className="break-all text-ivory"><Check className="mr-2 inline h-5 w-5 text-gold" />Portrait emailed to {p.email.trim()}.</p>}
      {p.stage === "error" && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-ivory" role="alert">{p.error}</p>
          <button className="btn btn-gold" onClick={() => p.onStage("confirm")}>Try again</button>
        </div>
      )}
    </section>
  );
}
