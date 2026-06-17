import { ClockCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { pluralizeRu } from '@/shared/lib/format';
import styles from './QuestionnaireMeta.module.scss';

interface IQuestionnaireMetaProps {
  questions_count: number;
  estimated_duration_minutes?: number | null;
}

export const QuestionnaireMeta = ({
  questions_count,
  estimated_duration_minutes,
}: IQuestionnaireMetaProps) => (
  <ul className={styles.meta} aria-label="О материале">
    <li>
      <InfoCircleOutlined aria-hidden />
      {questions_count}{' '}
      {pluralizeRu(questions_count, ['вопрос', 'вопроса', 'вопросов'])}
    </li>
    {estimated_duration_minutes != null && (
      <li>
        <ClockCircleOutlined aria-hidden />
        Около {estimated_duration_minutes}{' '}
        {pluralizeRu(estimated_duration_minutes, ['минуты', 'минут', 'минут'])}
      </li>
    )}
  </ul>
);
