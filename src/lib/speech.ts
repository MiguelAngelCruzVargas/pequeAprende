
// Keep a reference to prevent garbage collection of the utterance object
let currentUtterance: SpeechSynthesisUtterance | null = null;

export const speak = (text: string, cancelPrevious = true) => {
  if ('speechSynthesis' in window) {
    if (cancelPrevious) {
      window.speechSynthesis.cancel();
    }
    
    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.lang = 'es-ES';
    currentUtterance.rate = 0.9;
    currentUtterance.pitch = 1.1;
    
    // Add a small delay before speaking if we just cancelled to ensure the engine is ready
    if (cancelPrevious) {
      setTimeout(() => {
        if (currentUtterance) window.speechSynthesis.speak(currentUtterance);
      }, 50);
    } else {
      window.speechSynthesis.speak(currentUtterance);
    }
  }
};
