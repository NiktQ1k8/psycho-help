import type { TTestResult } from '@/entities/test/types';
import { moscowDate } from '@/shared/lib/date-time';
import { sanitizeHtml } from '@/shared/lib/html';
import styles from './TestResult.module.scss';

interface ITestResultProps {
  result: TTestResult;
}

export const TestResult = ({ result }: ITestResultProps) => (
  <section className={styles.wrapper} aria-labelledby="test-result-title">
    <div className={styles.header}>
      <h2 className={styles.title} id="test-result-title">
        Ваш последний результат
      </h2>
      <time className={styles.date} dateTime={result.completed_at}>
        {moscowDate(result.completed_at).toFormat('dd.MM.yyyy, HH:mm')} (МСК)
      </time>
    </div>
    <div className={styles.columns}>
      <div
        className={styles.resultText}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(result.result_text) }}
      />
      {result.recommendations.length > 0 && (
        <aside
          className={styles.recommendations}
          aria-labelledby="test-recommendations-title"
        >
          <h3 id="test-recommendations-title">Рекомендации</h3>
          <ul>
            {result.recommendations.map((recommendation, index) => (
              <li key={index}>{recommendation}</li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  </section>
);
