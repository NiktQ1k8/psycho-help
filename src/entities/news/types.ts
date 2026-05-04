export type TNewsType = 'Анонс мероприятия' | 'Отчет о мероприятии';

export type TNews = {
  id: string;
  images: string[] | null;
  type: TNewsType | null;
  date: string;
  title: string;
  text: string | null;
};
