export type TNewsType = 'Анонс мероприятия' | 'Отчет о мероприятии';

export type TNews = {
  id: string;
  slug: string;
  image: string | null;
  type: TNewsType | null;
  date: string;
  event_date: string;
  title: string;
  description: string | null;
  link: string | null;
  text: string | null;
};
