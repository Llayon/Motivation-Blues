import { Component, type ErrorInfo, type ReactNode } from 'react';
import {
  copyCrashReport,
  createCrashReport,
  readCrashReport,
  saveCrashReport,
  type CrashReport,
  type CrashReportContext
} from '../lib/crashReport';

interface ErrorBoundaryProps {
  children: ReactNode;
  diagnosticsContext: CrashReportContext;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  copyStatus: string | null;
  error: Error | null;
  report: CrashReport | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    copyStatus: null,
    error: null,
    report: null
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      copyStatus: null,
      error,
      report: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const report = createCrashReport(error, errorInfo, this.props.diagnosticsContext);
    saveCrashReport(report);
    this.setState({ report });
    console.error('Active view crashed.', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ copyStatus: null, error: null, report: null });
    this.props.onReset?.();
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopyReport = async () => {
    const report = this.state.report ?? readCrashReport();

    if (!report) {
      this.setState({ copyStatus: 'Отчет еще не готов. Попробуй через секунду.' });
      return;
    }

    try {
      await copyCrashReport(report);
      this.setState({ copyStatus: 'Отчет скопирован. Можно отправить разработчику.' });
    } catch {
      this.setState({ copyStatus: 'Не удалось скопировать отчет. Браузер закрыл буфер обмена.' });
    }
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
        {this.state.report ? (
          <p className="error-boundary-report">
            Диагностический отчет сохранен локально: {this.state.report.id}
          </p>
        ) : null}
        <div className="hero-actions">
          <button className="primary-button" type="button" onClick={this.handleReset}>
            Вернуться в кабинет
          </button>
          <button className="ghost-button" type="button" onClick={this.handleReload}>
            Перезагрузить
          </button>
          <button className="plain-button" type="button" onClick={this.handleCopyReport}>
            Скопировать отчет
          </button>
        </div>
        {this.state.copyStatus ? <p className="status-line">{this.state.copyStatus}</p> : null}
        {import.meta.env.DEV ? (
          <pre className="error-boundary-details">{this.state.error.message}</pre>
        ) : null}
      </section>
    );
  }
}
