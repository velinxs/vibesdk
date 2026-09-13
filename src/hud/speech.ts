/**
 * Optional speech input and output. Microphone access is requested only
 * when the player activates it, transcripts stay on the device, and no
 * audio is stored.
 */
interface SpeechRecognitionLike extends EventTarget {
	lang: string;
	interimResults: boolean;
	continuous: boolean;
	start(): void;
	stop(): void;
	onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
	onend: (() => void) | null;
	onerror: ((event: { error: string }) => void) | null;
}

type RecognitionCtor = new () => SpeechRecognitionLike;

function recognitionCtor(): RecognitionCtor | null {
	const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
	return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechInputSupported(): boolean {
	return typeof window !== 'undefined' && recognitionCtor() !== null;
}

export function speechOutputSupported(): boolean {
	return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function listenOnce(onTranscript: (text: string, final: boolean) => void, onDone: (error: string | null) => void): () => void {
	const Ctor = recognitionCtor();
	if (!Ctor) {
		onDone('Speech input is not available in this browser.');
		return () => {};
	}
	const rec = new Ctor();
	rec.lang = 'en-US';
	rec.interimResults = true;
	rec.continuous = false;
	rec.onresult = (event) => {
		let text = '';
		for (let i = 0; i < event.results.length; i++) {
			text += event.results[i][0].transcript;
		}
		onTranscript(text, false);
	};
	rec.onerror = (event) => onDone(event.error === 'not-allowed' ? 'Microphone permission was declined. Typed play still works.' : event.error);
	rec.onend = () => onDone(null);
	try {
		rec.start();
	} catch {
		onDone('Could not start the microphone.');
	}
	return () => rec.stop();
}

export function speak(text: string, voiceHint: 'female' | 'male' = 'female'): void {
	if (!speechOutputSupported()) return;
	window.speechSynthesis.cancel();
	const utterance = new SpeechSynthesisUtterance(text);
	const voices = window.speechSynthesis.getVoices();
	const preferred = voices.find((v) => v.lang.startsWith('en') && (voiceHint === 'female' ? /female|samantha|victoria|karen|moira|zira/i.test(v.name) : /male|daniel|alex|david/i.test(v.name)));
	if (preferred) utterance.voice = preferred;
	utterance.rate = 1.02;
	utterance.pitch = voiceHint === 'female' ? 1.05 : 0.95;
	window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
	if (speechOutputSupported()) window.speechSynthesis.cancel();
}
