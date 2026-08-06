import { Component, ReactNode } from 'react';

// Debe coincidir con APP_STORAGE_KEY en App.tsx — no se exporta desde ahí
// porque App.tsx no expone constantes, así que la repetimos aquí a propósito.
const APP_STORAGE_KEY = 'peque_app_state_v1';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Red de seguridad para toda la app. Sin esto, si CUALQUIER juego truena
// (un bug, un dato mal formado, lo que sea), React desmonta todo y el niño
// se queda viendo una pantalla en blanco sin ninguna forma de volver a jugar.
// Con esto, ve una pantalla amigable con un botón para volver al inicio.
// ─────────────────────────────────────────────────────────────────────────────
export default class ErrorBoundary extends Component<Props, State> {
  // El proyecto no tiene @types/react instalado (ver otros archivos que
  // castean `window`/`import.meta` a `any` por el mismo motivo), así que
  // TypeScript no infiere `this.props`/`this.state` desde la clase base.
  // Los declaramos explícitos para que sigan siendo del tipo correcto.
  declare props: Props;
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[PequeAprendo] Error atrapado por ErrorBoundary:', error, info.componentStack);
  }

  handleGoHome = () => {
    // Si solo recargamos, App.tsx restaura la misma pantalla que truena y
    // vuelve a crashear en bucle. Forzamos que la próxima carga arranque en
    // el menú, conservando el nombre del niño y los juegos ya visitados.
    try {
      const raw = localStorage.getItem(APP_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify({ ...parsed, screen: 'menu' }));
    } catch {}
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="h-[100svh] w-full flex flex-col items-center justify-center gap-6 px-6 text-center bg-gradient-to-b from-sky-200 via-sky-100 to-green-100 font-sans">
        <div className="text-7xl sm:text-8xl animate-bounce">🦉</div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-4xl font-black text-slate-700">¡Ups! Algo no salió bien</h1>
          <p className="text-sm sm:text-base font-bold text-slate-500 max-w-md">
            No te preocupes, no perdiste nada. Vamos a volver a empezar.
          </p>
        </div>
        <button
          onClick={this.handleGoHome}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-400 to-red-500 text-white font-black uppercase tracking-widest text-sm sm:text-base px-8 py-4 rounded-full border-4 border-white shadow-[0_8px_0_#B91C1C] active:shadow-[0_0px_0_#B91C1C] active:translate-y-2 transition-all"
        >
          🏠 Ir al inicio
        </button>
        {(import.meta as any).env?.DEV && this.state.error && (
          <pre className="mt-4 max-w-lg w-full overflow-auto text-left text-[10px] text-red-500 bg-white/70 rounded-xl p-3 border border-red-200">
            {this.state.error.message}
            {'\n'}
            {this.state.error.stack}
          </pre>
        )}
      </div>
    );
  }
}
