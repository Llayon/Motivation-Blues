import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Active view crashed.', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <section className="error-boundary glass-panel" data-testid="error-boundary">
        <p className="eyebrow">Аварийная закладка</p>
        <h1>Комната споткнулась. Рукописи на месте.</h1>
        <p>
          Этот раздел не открылся, но автосейв, банк текстов и очередь облака живут отдельно. Можно
          вернуться в кабинет или перезагрузить приложение.
        </p>
        <div className="hero-actions">
          <button className="primary-button" type="button" onClick={this.handleReset}>
            Вернуться в кабинет
          </button>
          <button className="ghost-button" type="button" onClick={this.handleReload}>
            Перезагрузить
          </button>
        </div>
        {import.meta.env.DEV ? (
          <pre className="error-boundary-details">{this.state.error.message}</pre>
        ) : null}
      </section>
    );
  }
}
